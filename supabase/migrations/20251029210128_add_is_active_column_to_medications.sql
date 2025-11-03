/*
  # Add is_active Column to Medications Table

  ## Changes
  - Add `is_active` boolean column to medications table
  - Set default value to true for active medications
  - Update existing records to have is_active = true
  
  ## Purpose
  - Track whether a medication prescription is currently active
  - Allows for soft deletion or deactivation of medications
*/

-- Add is_active column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE medications ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Update existing records to be active
UPDATE medications SET is_active = true WHERE is_active IS NULL;
