/*
  # Add remaining_doses and keep it in sync with dose_records

  ## Summary
  - Adds `remaining_doses` column to `medications`
  - Creates function to recompute remaining doses (count of pending doses)
  - Adds triggers on `dose_records` (INSERT/UPDATE/DELETE) to keep it synced
  - Backfills `remaining_doses` for existing medications

  ## Notes
  - SECURITY DEFINER with search_path 'public' to avoid RLS/role issues in triggers
*/

-- Add column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'medications'
      AND column_name = 'remaining_doses'
  ) THEN
    ALTER TABLE public.medications ADD COLUMN remaining_doses integer;
  END IF;
END $$;

-- Function to recompute remaining doses for a medication
CREATE OR REPLACE FUNCTION public.fn_update_remaining_doses(med_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.medications m
  SET remaining_doses = GREATEST(
    0,
    m.treatment_duration_days - (
      SELECT COUNT(*)
      FROM public.dose_records dr
      WHERE dr.medication_id = med_id
        AND dr.status = 'taken'
    )
  )
  WHERE m.id = med_id;
END;
$$;

-- Trigger function wrapper: uses NEW/OLD to call the updater
CREATE OR REPLACE FUNCTION public.fn_trg_update_remaining_doses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.fn_update_remaining_doses(OLD.medication_id);
    RETURN OLD;
  ELSE
    PERFORM public.fn_update_remaining_doses(NEW.medication_id);
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger: after INSERT on dose_records
DROP TRIGGER IF EXISTS trg_dose_records_after_insert_update_remaining ON public.dose_records;
CREATE TRIGGER trg_dose_records_after_insert_update_remaining
AFTER INSERT ON public.dose_records
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_update_remaining_doses();

-- Trigger: after UPDATE on dose_records
DROP TRIGGER IF EXISTS trg_dose_records_after_update_update_remaining ON public.dose_records;
CREATE TRIGGER trg_dose_records_after_update_update_remaining
AFTER UPDATE ON public.dose_records
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_update_remaining_doses();

-- Trigger: after DELETE on dose_records
DROP TRIGGER IF EXISTS trg_dose_records_after_delete_update_remaining ON public.dose_records;
CREATE TRIGGER trg_dose_records_after_delete_update_remaining
AFTER DELETE ON public.dose_records
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_update_remaining_doses();

-- Backfill for existing medications
UPDATE public.medications m
SET remaining_doses = GREATEST(
  0,
  m.treatment_duration_days - COALESCE((
    SELECT COUNT(*)
    FROM public.dose_records dr
    WHERE dr.medication_id = m.id
      AND dr.status = 'taken'
  ), 0)
);