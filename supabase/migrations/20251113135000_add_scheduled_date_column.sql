DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dose_records'
      AND column_name = 'scheduled_date'
  ) THEN
    ALTER TABLE public.dose_records
      ADD COLUMN scheduled_date date
      GENERATED ALWAYS AS (((scheduled_time AT TIME ZONE 'UTC')::date)) STORED;
  END IF;
END
$$;

COMMENT ON COLUMN public.dose_records.scheduled_date IS 'Data derivada de scheduled_time (UTC), sem horário';