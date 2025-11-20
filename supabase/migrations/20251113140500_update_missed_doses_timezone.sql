DROP FUNCTION IF EXISTS public.update_missed_doses_for_client(uuid);

CREATE OR REPLACE FUNCTION public.update_missed_doses_for_client(client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  UPDATE public.dose_records dr
  SET status = 'skipped'
  WHERE dr.client_id = update_missed_doses_for_client.client_id
    AND dr.status = 'pending'
    AND dr.scheduled_date < v_today
    AND NOT EXISTS (
      SELECT 1 FROM public.dose_corrections dc WHERE dc.original_dose_id = dr.id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_missed_doses_for_client TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_missed_doses_for_client TO anon;