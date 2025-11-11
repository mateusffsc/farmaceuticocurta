/*
  # Fix trigger security for adverse_events sync

  - Ensure trigger functions run with SECURITY DEFINER so updates to dose_records
    happen regardless of the calling role/RLS.
  - Set search_path to public to avoid schema resolution issues.
*/

-- Insert
CREATE OR REPLACE FUNCTION fn_adverse_event_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('search_path', 'public', true);

  IF NEW.dose_record_id IS NOT NULL THEN
    UPDATE dose_records
      SET has_adverse_event = true
      WHERE id = NEW.dose_record_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Update
CREATE OR REPLACE FUNCTION fn_adverse_event_after_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('search_path', 'public', true);

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
$$;

-- Delete
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