/*
  # Sync adverse_events with dose_records

  ## Overview
  - Adds `dose_record_id` column to `adverse_events` if missing.
  - Creates triggers to keep `dose_records.has_adverse_event` in sync when
    adverse events are inserted, updated, or deleted.
  - Adds index on `adverse_events.dose_record_id` for faster lookups.
*/

-- Ensure adverse_events has dose_record_id column (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'adverse_events' AND column_name = 'dose_record_id'
  ) THEN
    ALTER TABLE adverse_events
      ADD COLUMN dose_record_id uuid REFERENCES dose_records(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster synchronization checks
CREATE INDEX IF NOT EXISTS idx_adverse_events_dose_record_id
  ON adverse_events(dose_record_id);

-- Function: set has_adverse_event=true on insert
CREATE OR REPLACE FUNCTION fn_adverse_event_after_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.dose_record_id IS NOT NULL THEN
    UPDATE dose_records
      SET has_adverse_event = true
      WHERE id = NEW.dose_record_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: keep has_adverse_event accurate on update (when dose_record_id changes)
CREATE OR REPLACE FUNCTION fn_adverse_event_after_update()
RETURNS trigger AS $$
BEGIN
  -- If dose_record_id changed, recompute flags for both OLD and NEW
  IF OLD.dose_record_id IS DISTINCT FROM NEW.dose_record_id THEN
    IF OLD.dose_record_id IS NOT NULL THEN
      UPDATE dose_records dr
        SET has_adverse_event = EXISTS (
          SELECT 1 FROM adverse_events ae WHERE ae.dose_record_id = OLD.dose_record_id
        )
        WHERE dr.id = OLD.dose_record_id;
    END IF;

    IF NEW.dose_record_id IS NOT NULL THEN
      UPDATE dose_records dr
        SET has_adverse_event = true
        WHERE dr.id = NEW.dose_record_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: recompute has_adverse_event on delete
CREATE OR REPLACE FUNCTION fn_adverse_event_after_delete()
RETURNS trigger AS $$
BEGIN
  IF OLD.dose_record_id IS NOT NULL THEN
    UPDATE dose_records dr
      SET has_adverse_event = EXISTS (
        SELECT 1 FROM adverse_events ae WHERE ae.dose_record_id = OLD.dose_record_id
      )
      WHERE dr.id = OLD.dose_record_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist to avoid duplicates
DROP TRIGGER IF EXISTS trg_adverse_event_after_insert ON adverse_events;
DROP TRIGGER IF EXISTS trg_adverse_event_after_update ON adverse_events;
DROP TRIGGER IF EXISTS trg_adverse_event_after_delete ON adverse_events;

-- Create triggers
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

-- Backfill: ensure has_adverse_event reflects current adverse_events
UPDATE dose_records dr
SET has_adverse_event = EXISTS (
  SELECT 1 FROM adverse_events ae WHERE ae.dose_record_id = dr.id
);