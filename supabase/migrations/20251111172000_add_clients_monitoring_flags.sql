/*
  # Add Monitoring Flags to Clients

  ## Overview
  Adds boolean flags to the `clients` table to indicate whether a client
  needs monitoring for blood pressure (PA) and glucose.

  ## New Columns
    - `monitor_bp` boolean NOT NULL DEFAULT false
    - `monitor_glucose` boolean NOT NULL DEFAULT false

  ## Notes
  - Booleans are represented as `true` or `false` in SQL.
  - Default set to `false` for existing records.
*/

-- Add monitoring flags to clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS monitor_bp boolean NOT NULL DEFAULT false;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS monitor_glucose boolean NOT NULL DEFAULT false;

-- Optional helper indexes for filtering (commented out; enable if needed)
-- CREATE INDEX IF NOT EXISTS idx_clients_monitor_bp ON clients(monitor_bp);
-- CREATE INDEX IF NOT EXISTS idx_clients_monitor_glucose ON clients(monitor_glucose);

-- Example queries:
-- SELECT * FROM clients WHERE monitor_bp = true;
-- SELECT * FROM clients WHERE monitor_glucose = true;
-- SELECT * FROM clients WHERE monitor_bp = true OR monitor_glucose = true;