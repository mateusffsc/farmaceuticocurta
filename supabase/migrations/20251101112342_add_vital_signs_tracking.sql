/*
  # Add Vital Signs Tracking

  ## Overview
  This migration creates a system for clients to track their daily vital signs (blood pressure and glucose levels).

  ## New Tables
    1. `vital_signs`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `pharmacy_id` (uuid, references pharmacies)
      - `measured_at` (timestamptz) - when the measurement was taken
      - `systolic` (integer) - systolic blood pressure (optional)
      - `diastolic` (integer) - diastolic blood pressure (optional)
      - `glucose` (integer) - glucose level in mg/dL (optional)
      - `notes` (text) - optional notes about the measurement
      - `created_at` (timestamptz)

  ## Security
    - Enable RLS on vital_signs table
    - Clients can view their own vital signs
    - Clients can insert their own vital signs
    - Pharmacies can view vital signs of their clients
    - Both can update/delete their respective records

  ## Important Notes
    - At least one measurement (BP or glucose) must be provided
    - Measurements are optional but encouraged for health monitoring
    - Pharmacies can monitor client health trends
*/

-- Create vital_signs table
CREATE TABLE IF NOT EXISTS vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  measured_at timestamptz NOT NULL DEFAULT now(),
  systolic integer,
  diastolic integer,
  glucose integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_systolic CHECK (systolic IS NULL OR (systolic >= 50 AND systolic <= 300)),
  CONSTRAINT valid_diastolic CHECK (diastolic IS NULL OR (diastolic >= 30 AND diastolic <= 200)),
  CONSTRAINT valid_glucose CHECK (glucose IS NULL OR (glucose >= 20 AND glucose <= 600)),
  CONSTRAINT at_least_one_measurement CHECK (
    systolic IS NOT NULL OR diastolic IS NOT NULL OR glucose IS NOT NULL
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vital_signs_client_id ON vital_signs(client_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_pharmacy_id ON vital_signs(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_measured_at ON vital_signs(measured_at DESC);

-- Enable RLS
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;

-- Clients can view their own vital signs
CREATE POLICY "Clients can view own vital signs"
  ON vital_signs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  );

-- Clients can insert their own vital signs
CREATE POLICY "Clients can insert own vital signs"
  ON vital_signs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  );

-- Clients can update their own vital signs
CREATE POLICY "Clients can update own vital signs"
  ON vital_signs FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  );

-- Clients can delete their own vital signs
CREATE POLICY "Clients can delete own vital signs"
  ON vital_signs FOR DELETE
  TO authenticated
  USING (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  );

-- Pharmacies can view vital signs of their clients
CREATE POLICY "Pharmacies can view client vital signs"
  ON vital_signs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = (SELECT auth_id FROM pharmacies WHERE id = pharmacy_id)
  );

-- Pharmacies can update vital signs
CREATE POLICY "Pharmacies can update client vital signs"
  ON vital_signs FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (SELECT auth_id FROM pharmacies WHERE id = pharmacy_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT auth_id FROM pharmacies WHERE id = pharmacy_id)
  );

-- Pharmacies can delete vital signs
CREATE POLICY "Pharmacies can delete client vital signs"
  ON vital_signs FOR DELETE
  TO authenticated
  USING (
    auth.uid() = (SELECT auth_id FROM pharmacies WHERE id = pharmacy_id)
  );