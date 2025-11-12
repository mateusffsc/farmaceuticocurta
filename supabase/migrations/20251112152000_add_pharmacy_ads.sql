/*
  # Pharmacy Ads

  ## Overview
  Creates `pharmacy_ads` to allow pharmacies to publish thin banner images shown on the client dashboard. Clicking a banner opens WhatsApp.

  ## Table
  - `id` uuid PK
  - `pharmacy_id` uuid FK -> pharmacies
  - `image_url` text NOT NULL
  - `whatsapp_phone` text NULL
  - `whatsapp_message` text NULL
  - `is_active` boolean DEFAULT true
  - `display_order` integer DEFAULT 0
  - `created_at` timestamptz DEFAULT now()

  ## Security
  - RLS enabled
  - Pharmacies can manage (CRUD) their own ads
  - Clients and pharmacies can SELECT ads belonging to the client's pharmacy
*/

CREATE TABLE IF NOT EXISTS pharmacy_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  whatsapp_phone text,
  whatsapp_message text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pharmacy_ads_pharmacy_id ON pharmacy_ads(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_ads_active_order ON pharmacy_ads(is_active, display_order);

-- RLS
ALTER TABLE pharmacy_ads ENABLE ROW LEVEL SECURITY;

-- SELECT: Pharmacies can view their ads; Clients can view ads of their pharmacy
CREATE POLICY "Pharmacies and clients can view pharmacy ads"
  ON pharmacy_ads FOR SELECT
  TO authenticated
  USING (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
    OR pharmacy_id IN (
      SELECT pharmacy_id FROM clients WHERE auth_id = auth.uid()
    )
  );

-- INSERT: Pharmacies can create ads for their pharmacy
CREATE POLICY "Pharmacies can insert own ads"
  ON pharmacy_ads FOR INSERT
  TO authenticated
  WITH CHECK (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
  );

-- UPDATE: Pharmacies can update their ads
CREATE POLICY "Pharmacies can update own ads"
  ON pharmacy_ads FOR UPDATE
  TO authenticated
  USING (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
  );

-- DELETE: Pharmacies can delete their ads
CREATE POLICY "Pharmacies can delete own ads"
  ON pharmacy_ads FOR DELETE
  TO authenticated
  USING (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
  );