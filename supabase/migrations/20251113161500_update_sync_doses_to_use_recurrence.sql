BEGIN;

CREATE OR REPLACE FUNCTION public.fn_sync_dose_records_on_medication_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_start DATE;
BEGIN
  -- Executar apenas quando mudam campos que afetam o agendamento
  IF NOT (
    NEW.schedules IS DISTINCT FROM OLD.schedules OR
    NEW.start_date IS DISTINCT FROM OLD.start_date OR
    NEW.treatment_duration_days IS DISTINCT FROM OLD.treatment_duration_days OR
    NEW.recurrence_type IS DISTINCT FROM OLD.recurrence_type OR
    COALESCE(NEW.recurrence_custom_dates, '') IS DISTINCT FROM COALESCE(OLD.recurrence_custom_dates, '')
  ) THEN
    RETURN NEW;
  END IF;

  v_start := GREATEST(NEW.start_date::date, v_today);

  -- Remover futuras doses pendentes
  DELETE FROM public.dose_records dr
  WHERE dr.medication_id = NEW.id
    AND dr.status = 'pending'
    AND (dr.scheduled_time AT TIME ZONE 'America/Sao_Paulo')::date >= v_start;

  -- Regenerar doses considerando recorrência
  PERFORM public.fn_generate_dose_records_for_medication(NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_medications_after_update_sync_doses ON public.medications;
CREATE TRIGGER trg_medications_after_update_sync_doses
AFTER UPDATE OF schedules, start_date, treatment_duration_days, recurrence_type, recurrence_custom_dates ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_dose_records_on_medication_update();

COMMIT;
