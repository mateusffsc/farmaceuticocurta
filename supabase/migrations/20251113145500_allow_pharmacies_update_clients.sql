BEGIN;

ALTER POLICY "Clients can update own profile" ON public.clients RENAME TO "Clients can update own profile (keep)";

CREATE POLICY "Pharmacies can update their clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (
    pharmacy_id IN (
      SELECT id FROM public.pharmacies WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    pharmacy_id IN (
      SELECT id FROM public.pharmacies WHERE auth_id = auth.uid()
    )
  );

COMMIT;