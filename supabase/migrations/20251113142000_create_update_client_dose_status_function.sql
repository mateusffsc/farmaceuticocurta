DROP FUNCTION IF EXISTS public.update_client_dose_status(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.update_client_dose_status(
  client_id uuid,
  dose_id uuid,
  new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.dose_records dr
    WHERE dr.id = update_client_dose_status.dose_id
      AND dr.client_id = update_client_dose_status.client_id
  ) THEN
    RAISE EXCEPTION 'Dose não encontrada para o cliente';
  END IF;

  UPDATE public.dose_records dr
  SET status = update_client_dose_status.new_status,
      actual_time = CASE
        WHEN update_client_dose_status.new_status = 'taken' THEN (now() AT TIME ZONE 'America/Sao_Paulo')
        WHEN update_client_dose_status.new_status = 'skipped' THEN NULL
        ELSE actual_time
      END
  WHERE dr.id = update_client_dose_status.dose_id
    AND dr.client_id = update_client_dose_status.client_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_client_dose_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_client_dose_status TO anon;