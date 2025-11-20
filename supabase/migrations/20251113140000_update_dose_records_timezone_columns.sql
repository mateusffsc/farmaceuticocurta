BEGIN;

ALTER TABLE public.dose_records
  DROP COLUMN IF EXISTS scheduled_date;

ALTER TABLE public.dose_records
  ADD COLUMN scheduled_date date
  GENERATED ALWAYS AS (((scheduled_time AT TIME ZONE 'America/Sao_Paulo')::date)) STORED;

COMMENT ON COLUMN public.dose_records.scheduled_date IS 'Data local (America/Sao_Paulo) derivada de scheduled_time, sem horário';

ALTER TABLE public.dose_records
  DROP COLUMN IF EXISTS scheduled_time_of_day;

ALTER TABLE public.dose_records
  ADD COLUMN scheduled_time_of_day time
  GENERATED ALWAYS AS (((scheduled_time AT TIME ZONE 'America/Sao_Paulo')::time)) STORED;

COMMENT ON COLUMN public.dose_records.scheduled_time_of_day IS 'Horário local (America/Sao_Paulo) derivado de scheduled_time, sem data';

COMMIT;