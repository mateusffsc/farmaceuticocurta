-- Migration para alterar autenticação: tornar telefone obrigatório e email opcional
-- Data: 2025-11-13

-- 1. Tornar telefone obrigatório e email opcional na tabela pharmacies
ALTER TABLE pharmacies 
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN email DROP NOT NULL;

-- 2. Tornar telefone obrigatório e email opcional na tabela clients
ALTER TABLE clients 
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN email DROP NOT NULL;

-- 3. Remover unique constraint de email (agora opcional)
ALTER TABLE pharmacies DROP CONSTRAINT IF EXISTS pharmacies_email_key;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_email_key;

-- 4. Adicionar unique constraint em telefone
ALTER TABLE pharmacies ADD CONSTRAINT pharmacies_phone_key UNIQUE (phone);
ALTER TABLE clients ADD CONSTRAINT clients_phone_key UNIQUE (phone);

-- 5. Migrar dados existentes - gerar telefones temporários para registros sem telefone
UPDATE pharmacies 
  SET phone = '+55119999999' || id::text 
  WHERE phone IS NULL OR phone = '';

UPDATE clients 
  SET phone = '+55119888888' || id::text 
  WHERE phone IS NULL OR phone = '';

-- 6. Adicionar índice para melhor performance nas buscas por telefone
CREATE INDEX IF NOT EXISTS idx_pharmacies_phone ON pharmacies(phone);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);

-- 7. Comentários para documentação
COMMENT ON COLUMN pharmacies.phone IS 'Telefone obrigatório - usado para autenticação';
COMMENT ON COLUMN pharmacies.email IS 'Email opcional - pode ser nulo';
COMMENT ON COLUMN clients.phone IS 'Telefone obrigatório - usado para autenticação';
COMMENT ON COLUMN clients.email IS 'Email opcional - pode ser nulo';