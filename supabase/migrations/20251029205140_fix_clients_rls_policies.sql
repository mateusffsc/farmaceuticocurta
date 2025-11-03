/*
  # Fix RLS Policies for Clients Table

  ## Changes
  - Drop existing INSERT policy for clients that was too restrictive
  - Add new INSERT policy that allows pharmacies to create clients with any auth_id
  - This enables the pharmacy to create client records during the registration flow
  
  ## Security
  - Still maintains security by verifying the pharmacy_id belongs to the authenticated pharmacy
  - Pharmacies can only create clients under their own pharmacy_id
*/

-- Drop existing restrictive insert policy
DROP POLICY IF EXISTS "Pharmacies can insert clients" ON clients;

-- Create new insert policy that allows pharmacies to create clients
CREATE POLICY "Pharmacies can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE auth_id = auth.uid()
    )
  );
