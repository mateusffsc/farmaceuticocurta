/*
  # Add Adverse Events and Dose Corrections Tracking

  ## Overview
  This migration adds functionality to track medication adverse events (symptoms/reactions) 
  and incorrect dose administration scenarios.

  ## 1. New Tables
    
    ### `adverse_events`
    Tracks symptoms, side effects, and reactions reported by clients
    - `id` (uuid, primary key)
    - `client_id` (uuid, foreign key to clients)
    - `medication_id` (uuid, foreign key to medications, nullable)
    - `dose_record_id` (uuid, foreign key to dose_records, nullable)
    - `pharmacy_id` (uuid, foreign key to pharmacies)
    - `event_type` (text) - Type: symptom, side_effect, allergic_reaction, other
    - `severity` (text) - Severity: mild, moderate, severe
    - `description` (text) - Detailed description of the event
    - `occurred_at` (timestamptz) - When the event occurred
    - `created_at` (timestamptz)
    
    ### `dose_corrections`
    Tracks cases where incorrect doses were taken
    - `id` (uuid, primary key)
    - `original_dose_id` (uuid, foreign key to dose_records)
    - `client_id` (uuid, foreign key to clients)
    - `medication_id` (uuid, foreign key to medications)
    - `pharmacy_id` (uuid, foreign key to pharmacies)
    - `correction_type` (text) - Type: double_dose, wrong_medication, wrong_time, other
    - `description` (text) - Details about the error
    - `created_at` (timestamptz)

  ## 2. Updates to existing tables
    - Add `has_adverse_event` boolean to dose_records (default false)
    - Add `has_correction` boolean to dose_records (default false)

  ## 3. Security
    - Enable RLS on both new tables
    - Clients can insert and view their own records
    - Pharmacies can view records for their clients
    - Clients cannot delete or modify records after creation (for data integrity)
    - Pharmacies can view but not modify client-reported events

  ## 4. Important Notes
    - All events are timestamped for proper tracking
    - Events can be linked to specific doses or medications
    - Severity levels help prioritize pharmacy review
    - Correction tracking helps identify patterns and improve safety
*/

-- Add flags to dose_records table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dose_records' AND column_name = 'has_adverse_event'
  ) THEN
    ALTER TABLE dose_records ADD COLUMN has_adverse_event boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dose_records' AND column_name = 'has_correction'
  ) THEN
    ALTER TABLE dose_records ADD COLUMN has_correction boolean DEFAULT false;
  END IF;
END $$;

-- Create adverse_events table
CREATE TABLE IF NOT EXISTS adverse_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  medication_id uuid REFERENCES medications(id) ON DELETE SET NULL,
  dose_record_id uuid REFERENCES dose_records(id) ON DELETE SET NULL,
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('symptom', 'side_effect', 'allergic_reaction', 'other')),
  severity text NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  description text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE adverse_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can insert own adverse events"
  ON adverse_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id));

CREATE POLICY "Clients can view own adverse events"
  ON adverse_events FOR SELECT
  TO authenticated
  USING (auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id));

CREATE POLICY "Pharmacies can view client adverse events"
  ON adverse_events FOR SELECT
  TO authenticated
  USING (
    auth.uid() = (SELECT auth_id FROM pharmacies WHERE id = pharmacy_id)
  );

-- Create dose_corrections table
CREATE TABLE IF NOT EXISTS dose_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_dose_id uuid NOT NULL REFERENCES dose_records(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  correction_type text NOT NULL CHECK (correction_type IN ('double_dose', 'wrong_medication', 'wrong_time', 'missed_then_taken', 'other')),
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dose_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can insert own dose corrections"
  ON dose_corrections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id));

CREATE POLICY "Clients can view own dose corrections"
  ON dose_corrections FOR SELECT
  TO authenticated
  USING (auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id));

CREATE POLICY "Pharmacies can view client dose corrections"
  ON dose_corrections FOR SELECT
  TO authenticated
  USING (
    auth.uid() = (SELECT auth_id FROM pharmacies WHERE id = pharmacy_id)
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_adverse_events_client ON adverse_events(client_id);
CREATE INDEX IF NOT EXISTS idx_adverse_events_medication ON adverse_events(medication_id);
CREATE INDEX IF NOT EXISTS idx_adverse_events_pharmacy ON adverse_events(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_adverse_events_occurred_at ON adverse_events(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_dose_corrections_client ON dose_corrections(client_id);
CREATE INDEX IF NOT EXISTS idx_dose_corrections_medication ON dose_corrections(medication_id);
CREATE INDEX IF NOT EXISTS idx_dose_corrections_pharmacy ON dose_corrections(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_dose_corrections_dose ON dose_corrections(original_dose_id);