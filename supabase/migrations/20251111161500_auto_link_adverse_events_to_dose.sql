/*
  # Auto-link adverse_events to nearest dose_record

  - On INSERT/UPDATE, if adverse_events.dose_record_id is NULL, find the nearest
    dose for the same client (and same medication if provided) based on occurred_at
    and set dose_record_id accordingly.
  - SECURITY DEFINER to bypass RLS and ensure consistent linking.
  - Backfill existing rows with NULL dose_record_id.
*/

-- Helper: nearest dose for event
CREATE OR REPLACE FUNCTION fn_find_nearest_dose_for_event(
  p_client_id uuid,
  p_medication_id uuid,
  p_occurred_at timestamptz,
  p_threshold_seconds integer DEFAULT 43200 -- 12 hours
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dose_id uuid;
  v_diff_seconds integer;
BEGIN
  -- Select nearest dose by absolute time difference
  SELECT dr.id,
         ABS(EXTRACT(EPOCH FROM (dr.scheduled_time - p_occurred_at)))::int AS diff
  INTO v_dose_id, v_diff_seconds
  FROM dose_records dr
  WHERE dr.client_id = p_client_id
    AND (p_medication_id IS NULL OR dr.medication_id = p_medication_id)
  ORDER BY ABS(EXTRACT(EPOCH FROM (dr.scheduled_time - p_occurred_at))) ASC
  LIMIT 1;

  IF v_dose_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_diff_seconds IS NOT NULL AND v_diff_seconds <= p_threshold_seconds THEN
    RETURN v_dose_id;
  END IF;

  RETURN NULL; -- too far, do not link
END;
$$;

-- Update INSERT trigger to include auto-linking
CREATE OR REPLACE FUNCTION fn_adverse_event_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dose_id uuid;
BEGIN
  PERFORM set_config('search_path', 'public', true);

  IF NEW.dose_record_id IS NULL THEN
    v_dose_id := fn_find_nearest_dose_for_event(NEW.client_id, NEW.medication_id, NEW.occurred_at);
    IF v_dose_id IS NOT NULL THEN
      UPDATE adverse_events SET dose_record_id = v_dose_id WHERE id = NEW.id;
      UPDATE dose_records SET has_adverse_event = true WHERE id = v_dose_id;
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.dose_record_id IS NOT NULL THEN
    UPDATE dose_records SET has_adverse_event = true WHERE id = NEW.dose_record_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Update UPDATE trigger to try linking when dose_record_id stays NULL
CREATE OR REPLACE FUNCTION fn_adverse_event_after_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dose_id uuid;
BEGIN
  PERFORM set_config('search_path', 'public', true);

  -- If dose linkage changed, recompute flags
  IF OLD.dose_record_id IS DISTINCT FROM NEW.dose_record_id THEN
    IF OLD.dose_record_id IS NOT NULL THEN
      UPDATE dose_records dr
        SET has_adverse_event = EXISTS (
          SELECT 1 FROM adverse_events ae WHERE ae.dose_record_id = OLD.dose_record_id
        )
        WHERE dr.id = OLD.dose_record_id;
    END IF;

    IF NEW.dose_record_id IS NOT NULL THEN
      UPDATE dose_records dr SET has_adverse_event = true WHERE dr.id = NEW.dose_record_id;
    END IF;
  END IF;

  -- If still NULL, attempt to auto-link (e.g., medication/severity changed)
  IF NEW.dose_record_id IS NULL THEN
    v_dose_id := fn_find_nearest_dose_for_event(NEW.client_id, NEW.medication_id, NEW.occurred_at);
    IF v_dose_id IS NOT NULL THEN
      UPDATE adverse_events SET dose_record_id = v_dose_id WHERE id = NEW.id;
      UPDATE dose_records SET has_adverse_event = true WHERE id = v_dose_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure DELETE trigger exists (recompute flags)
CREATE OR REPLACE FUNCTION fn_adverse_event_after_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('search_path', 'public', true);
  IF OLD.dose_record_id IS NOT NULL THEN
    UPDATE dose_records dr
      SET has_adverse_event = EXISTS (
        SELECT 1 FROM adverse_events ae WHERE ae.dose_record_id = OLD.dose_record_id
      )
      WHERE dr.id = OLD.dose_record_id;
  END IF;
  RETURN OLD;
END;
$$;

-- Recreate triggers to use updated functions
DROP TRIGGER IF EXISTS trg_adverse_event_after_insert ON adverse_events;
DROP TRIGGER IF EXISTS trg_adverse_event_after_update ON adverse_events;
DROP TRIGGER IF EXISTS trg_adverse_event_after_delete ON adverse_events;

CREATE TRIGGER trg_adverse_event_after_insert
AFTER INSERT ON adverse_events
FOR EACH ROW
EXECUTE FUNCTION fn_adverse_event_after_insert();

CREATE TRIGGER trg_adverse_event_after_update
AFTER UPDATE ON adverse_events
FOR EACH ROW
EXECUTE FUNCTION fn_adverse_event_after_update();

CREATE TRIGGER trg_adverse_event_after_delete
AFTER DELETE ON adverse_events
FOR EACH ROW
EXECUTE FUNCTION fn_adverse_event_after_delete();

-- Optional performance index for nearest-dose lookup
CREATE INDEX IF NOT EXISTS idx_dose_records_client_med_time
  ON dose_records(client_id, medication_id, scheduled_time);

-- Backfill linkage: set dose_record_id for existing events without linkage
WITH candidates AS (
  SELECT ae.id AS adverse_event_id,
         (
           SELECT dr.id
           FROM dose_records dr
           WHERE dr.client_id = ae.client_id
             AND (ae.medication_id IS NULL OR dr.medication_id = ae.medication_id)
           ORDER BY ABS(EXTRACT(EPOCH FROM (dr.scheduled_time - ae.occurred_at))) ASC
           LIMIT 1
         ) AS nearest_dose_id,
         (
           SELECT ABS(EXTRACT(EPOCH FROM (dr.scheduled_time - ae.occurred_at)))::int
           FROM dose_records dr
           WHERE dr.id = (
             SELECT dr2.id
             FROM dose_records dr2
             WHERE dr2.client_id = ae.client_id
               AND (ae.medication_id IS NULL OR dr2.medication_id = ae.medication_id)
             ORDER BY ABS(EXTRACT(EPOCH FROM (dr2.scheduled_time - ae.occurred_at))) ASC
             LIMIT 1
           )
         ) AS diff_seconds
  FROM adverse_events ae
  WHERE ae.dose_record_id IS NULL
)
UPDATE adverse_events ae
SET dose_record_id = c.nearest_dose_id
FROM candidates c
WHERE ae.id = c.adverse_event_id AND c.nearest_dose_id IS NOT NULL AND c.diff_seconds <= 43200;

-- Backfill flags for doses
UPDATE dose_records dr
SET has_adverse_event = EXISTS (
  SELECT 1 FROM adverse_events ae WHERE ae.dose_record_id = dr.id
);