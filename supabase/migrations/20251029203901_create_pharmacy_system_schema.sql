/*
  # Pharmacy System Schema

  ## Overview
  Complete schema for pharmacy medication management system with multi-tenant architecture.

  ## New Tables

  ### 1. pharmacies
  - `id` (uuid, primary key) - Unique pharmacy identifier
  - `auth_id` (uuid, foreign key) - Reference to auth.users
  - `name` (text) - Pharmacy name
  - `email` (text, unique) - Pharmacy email
  - `phone` (text) - Contact phone
  - `address` (text) - Physical address
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. clients
  - `id` (uuid, primary key) - Unique client identifier
  - `pharmacy_id` (uuid, foreign key) - Reference to pharmacies
  - `auth_id` (uuid, foreign key) - Reference to auth.users
  - `name` (text) - Client name
  - `email` (text, unique) - Client email
  - `phone` (text) - Contact phone
  - `date_of_birth` (date) - Date of birth
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. medications
  - `id` (uuid, primary key) - Unique medication identifier
  - `pharmacy_id` (uuid, foreign key) - Reference to pharmacies
  - `client_id` (uuid, foreign key) - Reference to clients
  - `name` (text) - Medication name
  - `dosage` (text) - Dosage information
  - `schedules` (text) - Comma-separated time schedules (HH:MM format)
  - `total_quantity` (integer) - Total quantity prescribed
  - `treatment_duration_days` (integer) - Duration in days
  - `start_date` (date) - Treatment start date
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. dose_records
  - `id` (uuid, primary key) - Unique dose record identifier
  - `medication_id` (uuid, foreign key) - Reference to medications
  - `pharmacy_id` (uuid, foreign key) - Reference to pharmacies
  - `client_id` (uuid, foreign key) - Reference to clients
  - `scheduled_time` (timestamptz) - Scheduled dose time
  - `actual_time` (timestamptz) - Actual time taken (nullable)
  - `status` (text) - Status: 'pending', 'taken', 'skipped'
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - RLS enabled on all tables
  - Pharmacies can only access their own data
  - Clients can only access their own data
  - Authentication required for all operations
  - Proper foreign key constraints
  - Cascading deletes where appropriate

  ## Indexes
  - Added indexes on foreign keys for performance
  - Added indexes on commonly queried fields
*/

-- Create pharmacies table
CREATE TABLE IF NOT EXISTS pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  address text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  date_of_birth date,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  dosage text NOT NULL,
  schedules text NOT NULL,
  total_quantity integer,
  treatment_duration_days integer NOT NULL,
  start_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create dose_records table
CREATE TABLE IF NOT EXISTS dose_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  scheduled_time timestamptz NOT NULL,
  actual_time timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'skipped')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_pharmacy_id ON clients(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_clients_auth_id ON clients(auth_id);
CREATE INDEX IF NOT EXISTS idx_medications_pharmacy_id ON medications(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_medications_client_id ON medications(client_id);
CREATE INDEX IF NOT EXISTS idx_dose_records_medication_id ON dose_records(medication_id);
CREATE INDEX IF NOT EXISTS idx_dose_records_client_id ON dose_records(client_id);
CREATE INDEX IF NOT EXISTS idx_dose_records_scheduled_time ON dose_records(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_dose_records_status ON dose_records(status);

-- Enable Row Level Security
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pharmacies table
CREATE POLICY "Pharmacies can view own profile"
  ON pharmacies FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Pharmacies can update own profile"
  ON pharmacies FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Anyone can insert pharmacy during registration"
  ON pharmacies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_id);

-- RLS Policies for clients table
CREATE POLICY "Pharmacies can view their clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE auth_id = auth.uid()
    )
    OR auth.uid() = auth_id
  );

CREATE POLICY "Pharmacies can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view own profile"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Clients can update own profile"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- RLS Policies for medications table
CREATE POLICY "Pharmacies can view their medications"
  ON medications FOR SELECT
  TO authenticated
  USING (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE auth_id = auth.uid()
    )
    OR client_id IN (
      SELECT id FROM clients WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacies can insert medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacies can update their medications"
  ON medications FOR UPDATE
  TO authenticated
  USING (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacies can delete their medications"
  ON medications FOR DELETE
  TO authenticated
  USING (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE auth_id = auth.uid()
    )
  );

-- RLS Policies for dose_records table
CREATE POLICY "Pharmacies can view their dose records"
  ON dose_records FOR SELECT
  TO authenticated
  USING (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE auth_id = auth.uid()
    )
    OR client_id IN (
      SELECT id FROM clients WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacies can insert dose records"
  ON dose_records FOR INSERT
  TO authenticated
  WITH CHECK (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update their dose records"
  ON dose_records FOR UPDATE
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacies can update their dose records"
  ON dose_records FOR UPDATE
  TO authenticated
  USING (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE auth_id = auth.uid()
    )
  );
