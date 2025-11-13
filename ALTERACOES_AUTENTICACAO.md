# Alterações no Sistema de Autenticação

## Resumo
O sistema de autenticação foi alterado para suportar **telefone como identificador principal**, mantendo a compatibilidade com email.

## Mudanças Implementadas

### 1. Migration do Banco de Dados
- **Arquivo**: `supabase/migrations/20251113120000_alter_auth_phone_required.sql`
- Tornou telefone obrigatório e email opcional nas tabelas `pharmacies` e `clients`
- Adicionou unique constraint no telefone
- Removeu unique constraint do email
- Gerou telefones temporários para registros existentes

### 2. Utilitários de Autenticação
- **Arquivo**: `src/lib/authUtils.ts`
- `isValidPhone()`: Valida telefone brasileiro (celular)
- `formatPhone()`: Formata telefone para padrão +5511999999999
- `generateEmailFromPhone()`: Gera email fake para Supabase Auth
- `getAuthEmail()`: Detecta se é telefone ou email e retorna o apropriado

### 3. Auth Store
- **Arquivo**: `src/store/useAuthStore.ts`
- Modificou funções `loginPharmacy`, `registerPharmacy` e `loginClient`
- Agora aceitam `identifier` (telefone ou email) no lugar de email exclusivo
- Mantém compatibilidade com Supabase Auth gerando emails fake quando necessário

### 4. Interfaces de Login
- **Arquivos**: `src/pages/PharmacyLogin.tsx` e `src/pages/ClientLogin.tsx`
- Campos de email agora aceitam telefone ou email
- Ícone muda dinamicamente (📧 para email, 📱 para telefone)
- Placeholder atualizado: "seu@email.com ou (11) 99999-9999"

### 5. Formulário de Cadastro de Clientes
- **Arquivo**: `src/components/AddClientModal.tsx`
- **Arquivo**: `src/pages/PharmacyDashboard.tsx` (função handleAddClient)
- Telefone agora é obrigatório no formulário
- Email é opcional (mas se preenchido, deve ser válido)
- Validação de telefone brasileiro implementada
- Mensagem informativa atualizada sobre login
- Gera email fake automaticamente quando cadastro é por telefone

## Como Funciona

### Login por Telefone
1. Usuário digita telefone: `(11) 99999-9999`
2. Sistema detecta que é telefone válido
3. Gera email fake: `phone_5511999999999@system.local`
4. Faz login no Supabase Auth com email fake
5. Busca usuário no banco pelo telefone formatado

### Login por Email
1. Usuário digita email: `usuario@email.com`
2. Sistema detecta que é email válido
3. Usa email diretamente no Supabase Auth
4. Busca usuário no banco pelo auth_id

### Cadastro por Telefone
1. Usuário digita telefone no campo identificador
2. Sistema usa telefone como identificador principal
3. Email fica null no banco de dados
4. Telefone é obrigatório e único

### Cadastro por Email
1. Usuário digita email no campo identificador
2. Sistema usa email como identificador
3. Telefone pode ser adicionado opcionalmente
4. Email pode ser null no banco

## Formatos de Telefone Aceitos
- `(11) 99999-9999`
- `11999999999`
- `+5511999999999`
- `5511999999999`

## Segurança
- Telefones são armazenados com código do país (+55)
- Emails fake não são expostos aos usuários
- Validação rigorosa de formato de telefone brasileiro
- Mantém criptografia de senha do Supabase Auth

## Testes Recomendados
1. Login com telefone existente
2. Login com email existente
3. Cadastro novo com telefone
4. Cadastro novo com email
5. Transição entre telas de login
6. Validação de telefone inválido
7. Verificação de unicidade de telefone

## Notas Importantes
- Sistema mantém retrocompatibilidade
- Usuários existentes continuam funcionando
- Telefone se torna identificador único principal
- Email agora é opcional em ambos os tipos de usuário
