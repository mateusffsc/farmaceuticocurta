-- Criar função para buscar cliente por telefone (para debug)
CREATE OR REPLACE FUNCTION public.get_client_by_phone(phone_param text)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  email text,
  auth_id uuid,
  pharmacy_id uuid,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.phone,
    c.email,
    c.auth_id,
    c.pharmacy_id,
    c.created_at
  FROM public.clients c
  WHERE c.phone = phone_param
  LIMIT 1;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_client_by_phone TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_by_phone TO anon;