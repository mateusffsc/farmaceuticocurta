-- Gera dose_records automaticamente quando um medicamento é inserido diretamente no banco

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
BEGIN
  SELECT m.* INTO v_med
  FROM public.medications m
  WHERE m.id = p_med_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Medicamento não encontrado';
  END IF;

  IF v_med.treatment_duration_days IS NULL OR v_med.treatment_duration_days < 1 THEN
    RETURN; -- nada a gerar
  END IF;

  IF v_med.schedules IS NULL OR btrim(v_med.schedules) = '' THEN
    RETURN; -- sem horários
  END IF;

  v_sched_array := regexp_split_to_array(v_med.schedules, '\s*,\s*');
  v_start := v_med.start_date::date;
  v_end := v_start + (v_med.treatment_duration_days - 1);

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
  FROM generate_series(v_start, v_end, interval '1 day') AS d
  CROSS JOIN LATERAL (
    SELECT (s::time) AS t FROM unnest(v_sched_array) AS s
  ) AS times;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_trg_medications_after_insert_generate_doses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.fn_generate_dose_records_for_medication(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_medications_after_insert_generate_doses ON public.medications;
CREATE TRIGGER trg_medications_after_insert_generate_doses
AFTER INSERT ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_medications_after_insert_generate_doses();

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT m.id
    FROM public.medications m
    WHERE m.treatment_duration_days IS NOT NULL
      AND m.treatment_duration_days > 0
      AND m.schedules IS NOT NULL
      AND btrim(m.schedules) <> ''
      AND NOT EXISTS (
        SELECT 1 FROM public.dose_records dr WHERE dr.medication_id = m.id
      )
  LOOP
    PERFORM public.fn_generate_dose_records_for_medication(r.id);
  END LOOP;
END $$;