-- Criar função RPC para cliente deletar seus próprios medicamentos
CREATE OR REPLACE FUNCTION public.delete_client_medication(p_medication_id uuid, p_client_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_medication_exists boolean;
BEGIN
  -- Verificar se o medicamento existe e pertence ao cliente
  SELECT EXISTS (
    SELECT 1 
    FROM public.medications 
    WHERE id = p_medication_id 
    AND client_id = p_client_id
  ) INTO v_medication_exists;

  IF NOT v_medication_exists THEN
    RAISE EXCEPTION 'Medicamento não encontrado ou não pertence ao cliente';
  END IF;

  -- Deletar registros relacionados primeiro (para manter integridade)
  -- Deletar dose_corrections
  DELETE FROM public.dose_corrections 
  WHERE original_dose_id IN (
    SELECT id FROM public.dose_records WHERE medication_id = p_medication_id
  );

  -- Deletar adverse_events
  DELETE FROM public.adverse_events 
  WHERE medication_id = p_medication_id;

  -- Deletar medication_errors
  DELETE FROM public.medication_errors 
  WHERE medication_id = p_medication_id;

  -- Deletar symptom_logs
  DELETE FROM public.symptom_logs 
  WHERE medication_id = p_medication_id;

  -- Deletar symptoms_reports
  DELETE FROM public.symptoms_reports 
  WHERE medication_id = p_medication_id;

  -- Deletar dose_records
  DELETE FROM public.dose_records 
  WHERE medication_id = p_medication_id;

  -- Finalmente deletar o medicamento
  DELETE FROM public.medications 
  WHERE id = p_medication_id;

  RETURN true;
END;
$$;

-- Garantir permissões para a função
GRANT EXECUTE ON FUNCTION public.delete_client_medication TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_client_medication TO anon;