-- Sincroniza dose_records quando horários/periodo do medicamento mudarem

CREATE OR REPLACE FUNCTION public.fn_sync_dose_records_on_medication_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sched_array TEXT[];
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_start DATE;
  v_end DATE;
BEGIN
  -- Preparar intervalos
  v_sched_array := regexp_split_to_array(NEW.schedules, '\s*,\s*');
  IF v_sched_array IS NULL OR array_length(v_sched_array, 1) IS NULL THEN
    RETURN NEW; -- sem horários, nada a fazer
  END IF;

  v_start := GREATEST(NEW.start_date::date, v_today);
  v_end := NEW.start_date::date + (NEW.treatment_duration_days - 1);

  -- Remover futuras doses pendentes (mantém histórico já tomado/perdido)
  DELETE FROM public.dose_records dr
  WHERE dr.medication_id = NEW.id
    AND dr.status = 'pending'
    AND (dr.scheduled_time AT TIME ZONE 'America/Sao_Paulo')::date >= v_start;

  -- Inserir novas doses para o período restante
  INSERT INTO public.dose_records (medication_id, pharmacy_id, client_id, scheduled_time, status)
  SELECT NEW.id,
         NEW.pharmacy_id,
         NEW.client_id,
         make_timestamptz(
           EXTRACT(YEAR FROM d)::int,
           EXTRACT(MONTH FROM d)::int,
           EXTRACT(DAY FROM d)::int,
           EXTRACT(HOUR FROM t)::int,
           EXTRACT(MINUTE FROM t)::int,
           0,
           'America/Sao_Paulo'
         ),
         'pending'
  FROM generate_series(v_start, v_end, interval '1 day') AS d
  CROSS JOIN LATERAL (
    SELECT (s::time) AS t FROM unnest(v_sched_array) AS s
  ) AS times
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_medications_after_update_sync_doses ON public.medications;
CREATE TRIGGER trg_medications_after_update_sync_doses
AFTER UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_dose_records_on_medication_update();

-- Índice único para evitar duplicações acidentais
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_dose_records_med_sched'
  ) THEN
    CREATE UNIQUE INDEX uniq_dose_records_med_sched
      ON public.dose_records (medication_id, scheduled_time);
  END IF;
END $$;