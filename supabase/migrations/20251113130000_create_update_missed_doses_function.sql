-- Dropar a função existente se houver
DROP FUNCTION IF EXISTS public.update_missed_doses_for_client(uuid);

-- Criar função RPC para atualizar doses perdidas de um cliente específico
CREATE OR REPLACE FUNCTION public.update_missed_doses_for_client(client_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar doses pendentes que já passaram do horário para 'skipped'
  UPDATE public.dose_records dr
  SET status = 'skipped'
  WHERE dr.client_id = update_missed_doses_for_client.client_id
    AND dr.status = 'pending'
    AND dr.scheduled_time < now() - interval '30 minutes'
    AND NOT EXISTS (
      SELECT 1 
      FROM public.dose_corrections dc 
      WHERE dc.original_dose_id = dr.id
    );
END;
$$;

-- Garantir permissões para a função
GRANT EXECUTE ON FUNCTION public.update_missed_doses_for_client TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_missed_doses_for_client TO anon;