BEGIN;

CREATE OR REPLACE FUNCTION public.fn_update_remaining_doses(med_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.medications m
  SET remaining_doses = COALESCE((
    SELECT COUNT(*) FROM public.dose_records dr
    WHERE dr.medication_id = med_id
      AND dr.status = 'pending'
  ), 0)
  WHERE m.id = med_id;
END;
$$;

UPDATE public.medications m
SET remaining_doses = COALESCE((
  SELECT COUNT(*) FROM public.dose_records dr
  WHERE dr.medication_id = m.id
    AND dr.status = 'pending'
), 0);

COMMIT;

