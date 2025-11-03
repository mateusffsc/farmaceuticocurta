/*
  # Allow Clients to Add Their Own Medications

  ## Overview
  This migration updates RLS policies to allow clients to insert and manage their own medications.

  ## Changes
    1. Security Updates
      - Add INSERT policy for clients on medications table
      - Add UPDATE policy for clients to edit their own medications
      - Clients can only manage medications for themselves
      - Pharmacy relationship is maintained for oversight

  ## Important Notes
    - Clients can only add medications for themselves
    - Pharmacies can still view and manage all client medications
    - All existing security policies remain in place
    - This enables self-service medication tracking
*/

-- Allow clients to insert their own medications
CREATE POLICY "Clients can insert own medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  );

-- Allow clients to update their own medications
CREATE POLICY "Clients can update own medications"
  ON medications FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  );