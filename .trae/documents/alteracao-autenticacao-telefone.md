# Documentação Técnica - Alteração de Autenticação: Email para Telefone

## 1. Análise do Sistema Atual

### 1.1 Estrutura de Autenticação Atual
O sistema utiliza **Supabase Auth** com autenticação baseada em email e senha:

- **Login Farmácia**: Email + Senha → `loginPharmacy(email, password)`
- **Login Cliente**: Email + Senha → `loginClient(email, password)`
- **Cadastro Farmácia**: Nome, Email (obrigatório), Senha, Telefone (opcional), Endereço
- **Cadastro Cliente**: Nome, Email (obrigatório), Senha, Telefone (opcional), Data de nascimento

### 1.2 Banco de Dados Atual
```sql
-- Tabela pharmacies
email text NOT NULL UNIQUE,
phone text,  -- opcional

-- Tabela clients  
email text NOT NULL UNIQUE,
phone text,  -- opcional
```

### 1.3 Problemas Identificados
- Email é chave primária para autenticação Supabase
- Telefone atualmente é opcional em ambos os tipos de usuário
- Sistema depende exclusivamente de email para login
- Necessário reestruturar toda lógica de autenticação

## 2. Mudanças Necessárias

### 2.1 Banco de Dados

#### 2.1.1 Alteração de Schema
```sql
-- Tornar telefone obrigatório e email opcional
ALTER TABLE pharmacies 
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE clients 
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN email DROP NOT NULL;

-- Remover unique constraint de email (opcional)
ALTER TABLE pharmacies DROP CONSTRAINT pharmacies_email_key;
ALTER TABLE clients DROP CONSTRAINT clients_email_key;

-- Adicionar unique constraint em telefone
ALTER TABLE pharmacies ADD CONSTRAINT pharmacies_phone_key UNIQUE (phone);
ALTER TABLE clients ADD CONSTRAINT clients_phone_key UNIQUE (phone);
```

#### 2.1.2 Migração de Dados Existentes
```sql
-- Para usuários sem telefone, gerar telefones temporários
UPDATE pharmacies 
  SET phone = '+55119999999' || id::text 
  WHERE phone IS NULL;

UPDATE clients 
  SET phone = '+55119888888' || id::text 
  WHERE phone IS NULL;
```

### 2.2 Sistema de Autenticação

#### 2.2.1 Opções de Implementação

**Opção A: Autenticação por Telefone com SMS (Recomendada)**
- Usar Supabase Phone Auth com SMS
- Vantagem: Autenticação moderna e segura
- Desvantagem: Custo com SMS, dependência de serviço terceiro

**Opção B: Telefone como Username (Email Fake)**
- Manter estrutura Supabase atual
- Gerar email fake: `phone@system.local`
- Vantagem: Menor mudança de código
- Desvantagem: Email fake no sistema

**Opção C: Custom Authentication**
- Implementar auth própria com JWT
- Vantagem: Total controle
- Desvantagem: Complexidade e segurança

#### 2.2.2 Implementação Recomendada - Opção B
```typescript
// Novo sistema de autenticação
const generateEmailFromPhone = (phone: string): string => {
  return `phone_${phone.replace(/\D/g, '')}@system.local`;
};

const registerPharmacy = async (data: {
  name: string;
  phone: string;  // agora obrigatório
  email?: string; // agora opcional
  password: string;
  address?: string;
}) => {
  const emailForAuth = data.email || generateEmailFromPhone(data.phone);
  
  const { data: authData, error } = await supabase.auth.signUp({
    email: emailForAuth,
    password: data.password,
  });
  
  // Resto do código igual, mas salvando phone como obrigatório
};
```

### 2.3 Alterações nos Componentes

#### 2.3.1 PharmacyLogin.tsx
```typescript
// Estado do formulário
const [formData, setFormData] = useState({
  name: '',
  phone: '',     // agora obrigatório
  email: '',     // agora opcional
  password: '',
  address: '',
});

// Validação
if (isRegistering) {
  if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
  if (!formData.phone.trim()) errors.phone = 'Telefone é obrigatório';
  if (!formData.password.trim()) errors.password = 'Senha é obrigatória';
}

// Login continua com email, mas pode usar telefone também
const handleLogin = async (identifier: string, password: string) => {
  // Detectar se é telefone ou email
  const isPhone = /^[\d\s\(\)\-\+]+$/.test(identifier);
  const email = isPhone ? generateEmailFromPhone(identifier) : identifier;
  
  await loginPharmacy(email, password);
};
```

#### 2.3.2 ClientLogin.tsx
```typescript
// Permitir login com telefone ou email
const [formData, setFormData] = useState({
  identifier: '', // telefone ou email
  password: '',
});

// Modificar loginClient para aceitar telefone ou email
const loginClient = async (identifier: string, password: string) => {
  const isPhone = /^[\d\s\(\)\-\+]+$/.test(identifier);
  const email = isPhone ? generateEmailFromPhone(identifier) : identifier;
  
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  // ... resto do código
};
```

#### 2.3.3 AddClientModal.tsx
```typescript
// Tornar telefone obrigatório
const [formData, setFormData] = useState({
  name: '',
  phone: '',     // agora obrigatório
  email: '',     // agora opcional
  password: '',
  date_of_birth: '',
  // ... resto
});

// Validação
if (!formData.phone.trim()) {
  newErrors.phone = 'Telefone é obrigatório';
}
// Email opcional, mas se preenchido deve ser válido
if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
  newErrors.email = 'Email inválido';
}
```

## 3. Impactos e Considerações

### 3.1 Impactos no Sistema

#### 3.1.1 Autenticação
- ✅ Login com telefone (principal) ou email
- ✅ Cadastro sem email obrigatório
- ✅ Validação de telefone único
- ⚠️ Email fake gerado automaticamente

#### 3.1.2 Interface do Usuário
- Labels mudam de "Email" para "Telefone ou Email"
- Validação de telefone brasileiro (+55)
- Máscara de telefone: (11) 99999-9999

#### 3.1.3 Dados Existentes
- Migração automática de telefones nulos
- Comunicação com usuários sobre mudança
- Possível necessidade de atualização cadastral

### 3.2 Segurança

#### 3.2.1 Validações Necessárias
```typescript
const validatePhone = (phone: string): boolean => {
  // Validar formato brasileiro
  const phoneRegex = /^\+55\d{10,11}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

const formatPhone = (phone: string): string => {
  // Remover tudo que não é dígito e adicionar +55
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11 
    ? `+55${digits}` 
    : phone;
};
```

#### 3.2.2 Considerações de Privacidade
- Telefone é dado pessoal sensível
- Implementar LGPD compliance
- Opção de exclusão de dados

## 4. Estratégia de Implementação

### 4.1 Fase 1: Preparação (1-2 dias)
1. Backup completo do banco
2. Criar scripts de migração
3. Testar em ambiente de staging

### 4.2 Fase 2: Backend (2-3 dias)
1. Alterar schema do banco
2. Atualizar tipos TypeScript
3. Modificar funções de auth
4. Criar funções auxiliares

### 4.3 Fase 3: Frontend (3-4 dias)
1. Atualizar formulários
2. Modificar validações
3. Adicionar máscaras de telefone
4. Testar fluxos completos

### 4.4 Fase 4: Migração (1 dia)
1. Executar migração de dados
2. Validar integridade
3. Comunicar usuários

### 4.5 Fase 5: Monitoramento (1 semana)
1. Monitorar erros de login
2. Acompanhar cadastros novos
3. Suporte a usuários

## 5. Código de Exemplo - Implementação Completa

### 5.1 Auth Store Atualizado
```typescript
// Função auxiliar para gerenciar telefone/email
const getAuthEmail = (identifier: string): string => {
  const isPhone = /^[\d\s\(\)\-\+]+$/.test(identifier);
  if (isPhone) {
    const formattedPhone = formatPhone(identifier);
    return `phone_${formattedPhone.replace(/\D/g, '')}@system.local`;
  }
  return identifier;
};

// Login adaptado
loginPharmacy: async (identifier: string, password: string) => {
  const email = getAuthEmail(identifier);
  
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  // Resto do código igual...
};

// Cadastro adaptado
registerPharmacy: async (data: {
  name: string;
  phone: string; // obrigatório
  email?: string; // opcional
  password: string;
  address?: string;
}) => {
  const emailForAuth = data.email || getAuthEmail(data.phone);
  
  // Resto do código com telefone obrigatório...
};
```

## 6. Testes Recomendados

### 6.1 Testes Unitários
- Validação de telefone
- Formatação de telefone
- Geração de email fake
- Login com telefone/email

### 6.2 Testes de Integração
- Fluxo completo de cadastro
- Login com telefone
- Migração de dados
- Validações de unicidade

### 6.3 Testes de Usabilidade
- Formulários mobile
- Máscaras de telefone
- Mensagens de erro
- Fluxo intuitivo

## 7. Considerações Finais

### 7.1 Prós da Mudança
- ✅ Mais acessível para usuários sem email
- ✅ Telefone é mais pessoal e verificável
- ✅ Melhor para comunidades menos digitalizadas
- ✅ Alinhado com práticas de apps modernos

### 7.2 Contras e Riscos
- ⚠️ Mudança significativa no sistema
- ⚠️ Necessita migração de dados
- ⚠️ Email fake pode causar confusão
- ⚠️ Maior complexidade no código

### 7.3 Próximos Passos
1. Aprovar estratégia com stakeholders
2. Criar ambiente de testes
3. Implementar mudanças gradualmente
4. Monitorar métricas de adoção
5. Coletar feedback dos usuários

---

**Estimativa Total: 7-10 dias de desenvolvimento + 1 semana de monitoramento**

**Recomendação**: Implementar a Opção B (Telefone como Username) por ser a mais viável tecnicamente e menos disruptiva para o sistema atual.