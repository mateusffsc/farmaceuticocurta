BEGIN;

-- Adicionar colunas de recorrência
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS recurrence_type text NOT NULL DEFAULT 'continuous'
    CHECK (recurrence_type IN ('continuous','weekly','biweekly','monthly','custom')),
  ADD COLUMN IF NOT EXISTS recurrence_custom_dates text;

-- Índice único para evitar duplicações de dose no mesmo horário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_dose_records_med_sched'
  ) THEN
    CREATE UNIQUE INDEX uniq_dose_records_med_sched
      ON public.dose_records (medication_id, scheduled_time);
  END IF;
END $$;

-- Atualizar função de geração para suportar recorrência
CREATE OR REPLACE FUNCTION public.fn_generate_dose_records_for_medication(p_med_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_med RECORD;
  v_start DATE;
  v_end DATE;
  v_sched_array TEXT[];
  v_dates DATE[];
  v_custom_array TEXT[];
BEGIN
  SELECT m.* INTO v_med
  FROM public.medications m
  WHERE m.id = p_med_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Medicamento não encontrado';
  END IF;

  IF v_med.treatment_duration_days IS NULL OR v_med.treatment_duration_days < 1 THEN
    RETURN;
  END IF;

  IF v_med.schedules IS NULL OR btrim(v_med.schedules) = '' THEN
    RETURN;
  END IF;

  v_sched_array := regexp_split_to_array(v_med.schedules, '\s*,\s*');
  v_start := v_med.start_date::date;
  v_end := v_start + (v_med.treatment_duration_days - 1);

  -- Construir vetor de datas conforme a recorrência
  IF v_med.recurrence_type = 'continuous' THEN
    v_dates := ARRAY(SELECT d::date FROM generate_series(v_start, v_end, interval '1 day') AS d);
  ELSIF v_med.recurrence_type = 'weekly' THEN
    v_dates := ARRAY(SELECT d::date FROM generate_series(v_start, v_end, interval '1 week') AS d);
  ELSIF v_med.recurrence_type = 'biweekly' THEN
    v_dates := ARRAY(SELECT d::date FROM generate_series(v_start, v_end, interval '15 day') AS d);
  ELSIF v_med.recurrence_type = 'monthly' THEN
    v_dates := ARRAY(SELECT d::date FROM generate_series(v_start, v_end, interval '1 month') AS d);
  ELSIF v_med.recurrence_type = 'custom' THEN
    IF v_med.recurrence_custom_dates IS NULL OR btrim(v_med.recurrence_custom_dates) = '' THEN
      RETURN;
    END IF;
    v_custom_array := regexp_split_to_array(v_med.recurrence_custom_dates, '\s*,\s*');
    v_dates := ARRAY(
      SELECT (d::date)
      FROM unnest(v_custom_array) AS d
      WHERE (d::date) BETWEEN v_start AND v_end
    );
  ELSE
    -- fallback: tratar como contínuo
    v_dates := ARRAY(SELECT d::date FROM generate_series(v_start, v_end, interval '1 day') AS d);
  END IF;

  -- Inserir uma dose por horário em cada data planejada
  INSERT INTO public.dose_records (medication_id, pharmacy_id, client_id, scheduled_time, status)
  SELECT p_med_id,
         v_med.pharmacy_id,
         v_med.client_id,
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
  FROM unnest(v_dates) AS d
  CROSS JOIN LATERAL (
    SELECT (s::time) AS t FROM unnest(v_sched_array) AS s
  ) AS times
  ON CONFLICT DO NOTHING;
END;
$$;

COMMIT;
