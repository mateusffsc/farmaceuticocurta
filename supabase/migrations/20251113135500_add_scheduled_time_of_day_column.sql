DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dose_records'
      AND column_name = 'scheduled_time_of_day'
  ) THEN
    ALTER TABLE public.dose_records
      ADD COLUMN scheduled_time_of_day time
      GENERATED ALWAYS AS (((scheduled_time AT TIME ZONE 'UTC')::time)) STORED;
  END IF;
END
$$;

COMMENT ON COLUMN public.dose_records.scheduled_time_of_day IS 'Horário derivado de scheduled_time (UTC), sem data';