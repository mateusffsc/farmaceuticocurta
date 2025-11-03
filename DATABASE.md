# Documentação Completa do Banco de Dados - Sistema de Farmácia Online

## Índice
1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Diagrama de Relacionamentos](#diagrama-de-relacionamentos)
3. [Tabelas e Estruturas](#tabelas-e-estruturas)
4. [Políticas de Segurança (RLS)](#políticas-de-segurança-rls)
5. [Índices e Performance](#índices-e-performance)
6. [Migrações Aplicadas](#migrações-aplicadas)
7. [Queries Comuns](#queries-comuns)
8. [Considerações de Segurança](#considerações-de-segurança)

---

## Visão Geral da Arquitetura

### Tecnologia
- **Database:** PostgreSQL (Supabase)
- **Autenticação:** Supabase Auth
- **Segurança:** Row Level Security (RLS) habilitado em todas as tabelas
- **Arquitetura:** Multi-tenant (múltiplas farmácias isoladas)

### Modelo de Dados
O sistema utiliza uma arquitetura multi-tenant onde:
- Cada **farmácia** gerencia seus próprios **clientes**
- Cada **cliente** possui múltiplos **medicamentos**
- Cada **medicamento** gera múltiplos **registros de dose**
- **Eventos adversos** e **sinais vitais** são rastreados por cliente

### Princípios de Design
1. **Segurança por padrão:** RLS habilitado em todas as tabelas
2. **Isolamento de dados:** Farmácias não podem acessar dados de outras farmácias
3. **Auditabilidade:** Todos os registros têm timestamps de criação
4. **Integridade referencial:** Foreign keys com cascading deletes apropriados
5. **Performance:** Índices em colunas frequentemente consultadas

---

## Diagrama de Relacionamentos

```
auth.users (Supabase Auth)
    ↓
    ├─→ pharmacies (1:1)
    │       ↓
    │       ├─→ clients (1:N)
    │       │       ↓
    │       │       ├─→ medications (1:N)
    │       │       │       ↓
    │       │       │       └─→ dose_records (1:N)
    │       │       │
    │       │       ├─→ adverse_events (1:N)
    │       │       ├─→ dose_corrections (1:N)
    │       │       └─→ vital_signs (1:N)
    │       │
    │       └─→ [Todas as tabelas mantêm pharmacy_id para isolamento]
    │
    └─→ clients (1:1)
            └─→ [Cliente acessa seus próprios dados]
```

---

## Tabelas e Estruturas

### 1. `pharmacies`
Armazena informações das farmácias cadastradas no sistema.

**Colunas:**
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
auth_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE
name                text NOT NULL
email               text NOT NULL UNIQUE
phone               text
address             text
created_at          timestamptz DEFAULT now() NOT NULL
```

**Propósito:**
- Identificação única de cada farmácia
- Vínculo com sistema de autenticação do Supabase
- Informações de contato e localização

**Constraints:**
- `auth_id` é UNIQUE (1 farmácia por usuário auth)
- `email` é UNIQUE (não permite emails duplicados)
- `auth_id` com CASCADE DELETE (deleta farmácia se usuário for deletado)

**Relacionamentos:**
- 1:N com `clients` (uma farmácia tem muitos clientes)
- 1:N com `medications` (uma farmácia gerencia muitos medicamentos)
- 1:N com `dose_records`, `adverse_events`, `vital_signs`

---

### 2. `clients`
Armazena informações dos clientes (pacientes) cadastrados pelas farmácias.

**Colunas:**
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
pharmacy_id         uuid REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL
auth_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE
name                text NOT NULL
email               text NOT NULL UNIQUE
phone               text
date_of_birth       date
created_at          timestamptz DEFAULT now() NOT NULL
```

**Propósito:**
- Registro de pacientes no sistema
- Vínculo com farmácia responsável
- Dados pessoais e autenticação

**Constraints:**
- `auth_id` é UNIQUE (1 cliente por usuário auth)
- `email` é UNIQUE
- `pharmacy_id` com CASCADE DELETE (deleta cliente se farmácia for deletada)
- `auth_id` com CASCADE DELETE (deleta cliente se usuário for deletado)

**Relacionamentos:**
- N:1 com `pharmacies` (muitos clientes para uma farmácia)
- 1:N com `medications` (um cliente tem muitos medicamentos)
- 1:N com `dose_records`, `adverse_events`, `vital_signs`

**Observações:**
- CPF é usado como identificador de login (armazenado no email durante cadastro)
- Data de nascimento é opcional mas recomendada

---

### 3. `medications`
Armazena as prescrições de medicamentos para cada cliente.

**Colunas:**
```sql
id                          uuid PRIMARY KEY DEFAULT gen_random_uuid()
pharmacy_id                 uuid REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL
client_id                   uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL
name                        text NOT NULL
dosage                      text NOT NULL
schedules                   text NOT NULL
total_quantity              integer
treatment_duration_days     integer NOT NULL
start_date                  date NOT NULL
notes                       text
is_active                   boolean DEFAULT true NOT NULL
created_at                  timestamptz DEFAULT now() NOT NULL
```

**Propósito:**
- Registro de medicamentos prescritos
- Controle de posologia e cronograma
- Rastreamento de tratamentos ativos/inativos

**Formato de Dados:**
- `schedules`: String separada por vírgulas no formato "HH:MM" (ex: "08:00,14:00,20:00")
- `dosage`: Texto livre (ex: "500mg", "10ml", "2 comprimidos")
- `treatment_duration_days`: Define por quantos dias o tratamento deve durar

**Flags de Estado:**
- `is_active`: Controla se o medicamento está ativo (soft delete)

**Relacionamentos:**
- N:1 com `pharmacies` e `clients`
- 1:N com `dose_records` (um medicamento gera muitas doses)
- 1:N com `adverse_events` (eventos podem estar ligados a medicamentos)

**Observações:**
- Medicamentos podem ser adicionados por farmácia OU pelo próprio cliente
- Desativação preserva histórico (não deleta registros)

---

### 4. `dose_records`
Registra cada dose individual programada e seu status de tomada.

**Colunas:**
```sql
id                      uuid PRIMARY KEY DEFAULT gen_random_uuid()
medication_id           uuid REFERENCES medications(id) ON DELETE CASCADE NOT NULL
pharmacy_id             uuid REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL
client_id               uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL
scheduled_time          timestamptz NOT NULL
actual_time             timestamptz
status                  text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'taken', 'skipped'))
has_adverse_event       boolean DEFAULT false
has_correction          boolean DEFAULT false
created_at              timestamptz DEFAULT now() NOT NULL
```

**Propósito:**
- Rastreamento individual de cada dose
- Comparação entre horário programado vs. horário real
- Cálculo de aderência ao tratamento

**Status Possíveis:**
- `pending`: Dose ainda não tomada, aguardando
- `taken`: Dose confirmada pelo cliente
- `skipped`: Dose não tomada (marcada automaticamente após deadline)

**Campos Calculados:**
- `actual_time`: Preenchido quando cliente marca como tomada
- `has_adverse_event`: Flag se há eventos adversos relacionados
- `has_correction`: Flag se há correções de dose relacionadas

**Relacionamentos:**
- N:1 com `medications`, `pharmacies`, `clients`
- 1:N com `dose_corrections` (uma dose pode ter correções)
- 1:1 opcional com `adverse_events` (dose pode causar evento)

**Lógica de Negócio:**
- Doses são geradas automaticamente ao criar medicamento
- Sistema marca como `skipped` automaticamente se não tomada até 23:59:59
- Cliente pode marcar como `taken` a qualquer momento
- Diferença entre `scheduled_time` e `actual_time` indica atraso

---

### 5. `adverse_events`
Registra eventos adversos, reações e sintomas reportados pelos clientes.

**Colunas:**
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
client_id           uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE
medication_id       uuid REFERENCES medications(id) ON DELETE SET NULL
dose_record_id      uuid REFERENCES dose_records(id) ON DELETE SET NULL
pharmacy_id         uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE
event_type          text NOT NULL CHECK (event_type IN
                    ('symptom', 'side_effect', 'allergic_reaction', 'other'))
severity            text NOT NULL CHECK (severity IN
                    ('mild', 'moderate', 'severe'))
description         text NOT NULL
occurred_at         timestamptz NOT NULL DEFAULT now()
created_at          timestamptz DEFAULT now()
```

**Propósito:**
- Rastreamento de segurança do paciente
- Identificação de reações adversas a medicamentos
- Comunicação de problemas para a farmácia

**Tipos de Evento:**
- `symptom`: Sintoma geral
- `side_effect`: Efeito colateral conhecido
- `allergic_reaction`: Reação alérgica
- `other`: Outros tipos de eventos

**Níveis de Severidade:**
- `mild`: Leve (desconforto mínimo)
- `moderate`: Moderado (requer atenção)
- `severe`: Severo (requer ação imediata)

**Relacionamentos:**
- N:1 com `clients`, `pharmacies` (obrigatório)
- N:1 com `medications`, `dose_records` (opcional, pode ser nulo)

**Observações:**
- `medication_id` e `dose_record_id` são opcionais (SET NULL on delete)
- Cliente pode reportar evento sem vincular a dose específica
- Farmácia recebe notificação de novos eventos

---

### 6. `dose_corrections`
Registra correções e erros na administração de doses.

**Colunas:**
```sql
id                      uuid PRIMARY KEY DEFAULT gen_random_uuid()
original_dose_id        uuid NOT NULL REFERENCES dose_records(id) ON DELETE CASCADE
client_id               uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE
medication_id           uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE
pharmacy_id             uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE
correction_type         text NOT NULL CHECK (correction_type IN
                        ('double_dose', 'wrong_medication', 'wrong_time',
                         'missed_then_taken', 'other'))
description             text NOT NULL
created_at              timestamptz DEFAULT now()
```

**Propósito:**
- Rastreamento de erros na administração
- Identificação de padrões de erro
- Melhoria da segurança do paciente

**Tipos de Correção:**
- `double_dose`: Tomou dose duplicada
- `wrong_medication`: Medicamento errado
- `wrong_time`: Horário muito diferente do programado
- `missed_then_taken`: Perdeu dose mas tomou depois
- `other`: Outros tipos de erro

**Relacionamentos:**
- N:1 com `dose_records` (dose original que teve problema)
- N:1 com `clients`, `medications`, `pharmacies`

**Observações:**
- Usado para análise de segurança
- Ajuda farmácia a identificar clientes que precisam de suporte adicional

---

### 7. `vital_signs`
Registra medições de sinais vitais dos clientes.

**Colunas:**
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
client_id           uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE
pharmacy_id         uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE
measured_at         timestamptz NOT NULL DEFAULT now()
systolic            integer
diastolic           integer
glucose             integer
notes               text
created_at          timestamptz DEFAULT now()
```

**Propósito:**
- Monitoramento de saúde do paciente
- Rastreamento de pressão arterial e glicemia
- Acompanhamento de tendências de saúde

**Medições:**
- `systolic`: Pressão sistólica (50-300 mmHg)
- `diastolic`: Pressão diastólica (30-200 mmHg)
- `glucose`: Glicemia (20-600 mg/dL)

**Constraints:**
- Pelo menos UMA medição deve ser fornecida (BP ou glicose)
- Validação de ranges para evitar valores impossíveis
- `measured_at` permite registro retroativo de medições

**Relacionamentos:**
- N:1 com `clients`, `pharmacies`

**Observações:**
- Cliente adiciona suas próprias medições
- Farmácia pode visualizar e acompanhar tendências
- Útil para medicamentos que afetam pressão/glicemia

---

## Políticas de Segurança (RLS)

### Princípios Gerais
- **Todas as tabelas têm RLS habilitado**
- **Isolamento por tenant:** Farmácias só veem seus dados
- **Privacidade do cliente:** Clientes só veem seus próprios dados
- **Auditabilidade:** Registros não podem ser deletados por clientes

### Políticas por Tabela

#### `pharmacies`
```sql
-- SELECT: Farmácia vê seu próprio perfil
"Pharmacies can view own profile"
  USING (auth.uid() = auth_id)

-- UPDATE: Farmácia atualiza seu próprio perfil
"Pharmacies can update own profile"
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id)

-- INSERT: Qualquer usuário autenticado pode criar farmácia (registro)
"Anyone can insert pharmacy during registration"
  WITH CHECK (auth.uid() = auth_id)
```

#### `clients`
```sql
-- SELECT: Farmácia vê seus clientes OU cliente vê próprio perfil
"Pharmacies can view their clients"
  USING (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
    OR auth.uid() = auth_id
  )

-- INSERT: Apenas farmácia pode cadastrar clientes
"Pharmacies can insert clients"
  WITH CHECK (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
  )

-- UPDATE: Cliente atualiza próprio perfil
"Clients can update own profile"
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id)
```

#### `medications`
```sql
-- SELECT: Farmácia vê medicamentos de seus clientes OU cliente vê próprios
"Pharmacies can view their medications"
  USING (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
    OR client_id IN (SELECT id FROM clients WHERE auth_id = auth.uid())
  )

-- INSERT: Farmácia OU cliente pode adicionar medicamentos
"Pharmacies can insert medications"
  WITH CHECK (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
  )
"Clients can insert own medications"
  WITH CHECK (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  )

-- UPDATE: Farmácia ou cliente pode atualizar
"Pharmacies can update their medications"
  USING/WITH CHECK (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
  )
"Clients can update own medications"
  USING/WITH CHECK (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  )

-- DELETE: Apenas farmácia pode deletar
"Pharmacies can delete their medications"
  USING (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
  )
```

#### `dose_records`
```sql
-- SELECT: Farmácia vê doses de seus clientes OU cliente vê próprias
"Pharmacies can view their dose records"
  USING (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
    OR client_id IN (SELECT id FROM clients WHERE auth_id = auth.uid())
  )

-- INSERT: Apenas farmácia (doses geradas ao criar medicamento)
"Pharmacies can insert dose records"
  WITH CHECK (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
  )

-- UPDATE: Cliente E farmácia podem atualizar
"Clients can update their dose records"
  USING/WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE auth_id = auth.uid())
  )
"Pharmacies can update their dose records"
  USING/WITH CHECK (
    pharmacy_id IN (SELECT id FROM pharmacies WHERE auth_id = auth.uid())
  )
```

#### `adverse_events`
```sql
-- INSERT: Apenas cliente pode reportar eventos
"Clients can insert own adverse events"
  WITH CHECK (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  )

-- SELECT: Cliente vê próprios eventos, farmácia vê de seus clientes
"Clients can view own adverse events"
  USING (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  )
"Pharmacies can view client adverse events"
  USING (
    auth.uid() = (SELECT auth_id FROM pharmacies WHERE id = pharmacy_id)
  )
```

#### `dose_corrections`
```sql
-- Similar a adverse_events
-- Cliente insere e visualiza próprios
-- Farmácia visualiza de seus clientes
```

#### `vital_signs`
```sql
-- INSERT/UPDATE/DELETE: Cliente pode gerenciar próprios sinais
"Clients can insert/update/delete own vital signs"
  WITH CHECK (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  )

-- SELECT: Cliente vê próprios, farmácia vê de seus clientes
"Clients can view own vital signs"
  USING (
    auth.uid() = (SELECT auth_id FROM clients WHERE id = client_id)
  )
"Pharmacies can view client vital signs"
  USING (
    auth.uid() = (SELECT auth_id FROM pharmacies WHERE id = pharmacy_id)
  )

-- UPDATE/DELETE: Farmácia também pode gerenciar
"Pharmacies can update/delete client vital signs"
  USING/WITH CHECK (
    auth.uid() = (SELECT auth_id FROM pharmacies WHERE id = pharmacy_id)
  )
```

---

## Índices e Performance

### Índices Criados

#### `clients`
```sql
idx_clients_pharmacy_id     ON clients(pharmacy_id)
idx_clients_auth_id         ON clients(auth_id)
```

#### `medications`
```sql
idx_medications_pharmacy_id ON medications(pharmacy_id)
idx_medications_client_id   ON medications(client_id)
```

#### `dose_records`
```sql
idx_dose_records_medication_id      ON dose_records(medication_id)
idx_dose_records_client_id          ON dose_records(client_id)
idx_dose_records_scheduled_time     ON dose_records(scheduled_time)
idx_dose_records_status             ON dose_records(status)
```

#### `adverse_events`
```sql
idx_adverse_events_client           ON adverse_events(client_id)
idx_adverse_events_medication       ON adverse_events(medication_id)
idx_adverse_events_pharmacy         ON adverse_events(pharmacy_id)
idx_adverse_events_occurred_at      ON adverse_events(occurred_at DESC)
```

#### `dose_corrections`
```sql
idx_dose_corrections_client         ON dose_corrections(client_id)
idx_dose_corrections_medication     ON dose_corrections(medication_id)
idx_dose_corrections_pharmacy       ON dose_corrections(pharmacy_id)
idx_dose_corrections_dose           ON dose_corrections(original_dose_id)
```

#### `vital_signs`
```sql
idx_vital_signs_client_id           ON vital_signs(client_id)
idx_vital_signs_pharmacy_id         ON vital_signs(pharmacy_id)
idx_vital_signs_measured_at         ON vital_signs(measured_at DESC)
```

### Estratégias de Otimização

1. **Foreign Keys:** Todos indexados para JOINs rápidos
2. **Timestamps:** Índices descendentes para queries "mais recentes primeiro"
3. **Status fields:** Indexados para filtros rápidos (ex: status = 'pending')
4. **Composite indexes:** Considerar para queries complexas frequentes

---

## Migrações Aplicadas

### 1. `20251029203901_create_pharmacy_system_schema.sql`
**Objetivo:** Criação inicial do schema completo

**Conteúdo:**
- Criação das 4 tabelas principais: `pharmacies`, `clients`, `medications`, `dose_records`
- Habilitação de RLS em todas as tabelas
- Criação de políticas RLS básicas
- Criação de índices de performance
- Estabelecimento de foreign keys com cascading

**Impacto:** Schema base funcional para o sistema

---

### 2. `20251029205140_fix_clients_rls_policies.sql`
**Objetivo:** Correção de política RLS para permitir farmácia criar clientes

**Conteúdo:**
- Drop da política INSERT restritiva anterior
- Criação de política INSERT que permite farmácia criar clientes com qualquer auth_id
- Mantém segurança verificando pharmacy_id

**Impacto:** Farmácias podem cadastrar novos clientes corretamente

---

### 3. `20251029210128_add_is_active_column_to_medications.sql`
**Objetivo:** Adicionar controle de medicamentos ativos/inativos

**Conteúdo:**
- Adiciona coluna `is_active` boolean DEFAULT true
- Atualiza registros existentes para true
- Usa bloco DO $$ para verificação condicional

**Impacto:** Permite desativar medicamentos sem deletar histórico (soft delete)

---

### 4. `20251029211042_add_adverse_events_and_dose_corrections.sql`
**Objetivo:** Sistema de rastreamento de eventos adversos e correções

**Conteúdo:**
- Cria tabela `adverse_events` com tipos e severidades
- Cria tabela `dose_corrections` para erros de administração
- Adiciona flags `has_adverse_event` e `has_correction` em dose_records
- Cria políticas RLS para ambas tabelas
- Adiciona índices de performance

**Impacto:** Sistema completo de segurança e rastreamento de problemas

---

### 5. `20251029213628_allow_clients_to_add_medications.sql`
**Objetivo:** Permitir clientes adicionarem seus próprios medicamentos

**Conteúdo:**
- Adiciona política INSERT para clientes em medications
- Adiciona política UPDATE para clientes em medications
- Mantém políticas de farmácia existentes

**Impacto:** Clientes podem autogerenciar medicamentos (uso over-the-counter)

---

### 6. `20251101112342_add_vital_signs_tracking.sql`
**Objetivo:** Sistema de monitoramento de sinais vitais

**Conteúdo:**
- Cria tabela `vital_signs` com pressão arterial e glicemia
- Adiciona constraints de validação de ranges
- Requer pelo menos uma medição por registro
- Cria políticas RLS completas (cliente e farmácia)
- Adiciona índices de performance

**Impacto:** Monitoramento de saúde integrado ao sistema

---

## Queries Comuns

### Obter Medicamentos Ativos de um Cliente
```sql
SELECT * FROM medications
WHERE client_id = 'uuid-do-cliente'
  AND is_active = true
ORDER BY created_at DESC;
```

### Calcular Taxa de Aderência Mensal
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'taken') AS taken,
  COUNT(*) AS total,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'taken')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) AS adherence_rate
FROM dose_records
WHERE client_id = 'uuid-do-cliente'
  AND scheduled_time >= NOW() - INTERVAL '30 days';
```

### Buscar Doses Pendentes do Dia
```sql
SELECT
  dr.*,
  m.name AS medication_name,
  m.dosage
FROM dose_records dr
JOIN medications m ON m.id = dr.medication_id
WHERE dr.client_id = 'uuid-do-cliente'
  AND dr.status = 'pending'
  AND DATE(dr.scheduled_time) = CURRENT_DATE
ORDER BY dr.scheduled_time ASC;
```

### Marcar Dose como Tomada
```sql
UPDATE dose_records
SET
  status = 'taken',
  actual_time = NOW()
WHERE id = 'uuid-da-dose'
  AND client_id = 'uuid-do-cliente';
```

### Marcar Automaticamente Doses Perdidas (Dias Anteriores)
```sql
UPDATE dose_records
SET status = 'skipped'
WHERE client_id = 'uuid-do-cliente'
  AND status = 'pending'
  AND scheduled_time < (CURRENT_DATE - INTERVAL '1 day' + TIME '23:59:59');
```

### Buscar Eventos Adversos Recentes
```sql
SELECT
  ae.*,
  m.name AS medication_name,
  c.name AS client_name
FROM adverse_events ae
LEFT JOIN medications m ON m.id = ae.medication_id
JOIN clients c ON c.id = ae.client_id
WHERE ae.pharmacy_id = 'uuid-da-farmacia'
  AND ae.occurred_at >= NOW() - INTERVAL '7 days'
ORDER BY ae.occurred_at DESC;
```

### Histórico de Sinais Vitais
```sql
SELECT
  measured_at,
  systolic,
  diastolic,
  glucose,
  notes
FROM vital_signs
WHERE client_id = 'uuid-do-cliente'
ORDER BY measured_at DESC
LIMIT 30;
```

### Clientes com Baixa Aderência
```sql
SELECT
  c.id,
  c.name,
  COUNT(*) FILTER (WHERE dr.status = 'taken') AS taken,
  COUNT(*) AS total,
  ROUND(
    COUNT(*) FILTER (WHERE dr.status = 'taken')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) AS adherence_rate
FROM clients c
JOIN dose_records dr ON dr.client_id = c.id
WHERE c.pharmacy_id = 'uuid-da-farmacia'
  AND dr.scheduled_time >= NOW() - INTERVAL '30 days'
GROUP BY c.id, c.name
HAVING
  COUNT(*) FILTER (WHERE dr.status = 'taken')::numeric /
  NULLIF(COUNT(*), 0) < 0.80
ORDER BY adherence_rate ASC;
```

### Gerar Doses para Novo Medicamento
```sql
-- Exemplo: Medicamento com horários "08:00,14:00,20:00" por 30 dias
WITH schedule_times AS (
  SELECT
    unnest(string_to_array('08:00,14:00,20:00', ',')) AS time_str
),
dose_dates AS (
  SELECT generate_series(
    '2025-11-01'::date,
    '2025-11-01'::date + INTERVAL '30 days',
    INTERVAL '1 day'
  )::date AS dose_date
)
INSERT INTO dose_records (
  medication_id,
  pharmacy_id,
  client_id,
  scheduled_time,
  status
)
SELECT
  'uuid-do-medicamento',
  'uuid-da-farmacia',
  'uuid-do-cliente',
  (dd.dose_date + st.time_str::time)::timestamptz,
  'pending'
FROM dose_dates dd
CROSS JOIN schedule_times st;
```

---

## Considerações de Segurança

### 1. Row Level Security (RLS)
- **Todas as tabelas protegidas:** Nenhuma tabela permite acesso direto sem RLS
- **Políticas restritivas:** Por padrão, nada é acessível até que política explícita permita
- **Verificação dupla:** USING (pode ler?) e WITH CHECK (pode escrever?)

### 2. Isolamento Multi-Tenant
- **pharmacy_id em todas as tabelas:** Garante isolamento entre farmácias
- **Queries verificam ownership:** Todas as políticas verificam se o recurso pertence ao usuário
- **Não há cross-tenant access:** Impossível acessar dados de outra farmácia

### 3. Autenticação
- **Supabase Auth:** Sistema de autenticação gerenciado e seguro
- **auth.uid():** Função que retorna ID do usuário autenticado
- **auth.users:** Tabela protegida pelo Supabase, não acessível diretamente

### 4. Integridade de Dados
- **Foreign Keys:** Garantem relações válidas entre tabelas
- **CHECK Constraints:** Validam valores permitidos (ex: status, severidade)
- **NOT NULL:** Previne dados incompletos em campos críticos
- **UNIQUE:** Previne duplicações (email, auth_id)

### 5. Cascading Deletes
- **ON DELETE CASCADE:** Registros dependentes são deletados automaticamente
- **ON DELETE SET NULL:** Preserva registros mesmo se referência for deletada
- **Exemplo:** Deletar cliente → deleta medicamentos → deleta doses

### 6. Auditoria
- **created_at em todas as tabelas:** Rastreia quando registro foi criado
- **measured_at, occurred_at:** Timestamps de eventos específicos
- **actual_time vs scheduled_time:** Rastreia atrasos na tomada

### 7. Validações de Dados
- **Vital Signs:** Ranges válidos para pressão e glicemia
- **At least one measurement:** Não permite registros vazios
- **Status enums:** Apenas valores predefinidos aceitos
- **UUID generation:** Chaves primárias geradas automaticamente

### 8. Proteção contra Modificações
- **Eventos adversos:** Clientes não podem deletar (preserva histórico)
- **Dose corrections:** Registros permanentes para auditoria
- **Medications:** Soft delete via is_active (preserva histórico)

### 9. Exposição de Dados
- **Clientes:** Apenas veem seus próprios dados
- **Farmácias:** Apenas veem dados de seus clientes
- **Sem dados públicos:** Nada é acessível sem autenticação

### 10. Edge Functions
- **update-missed-doses:** Usa service role key (acesso total)
- **Execução automática:** Pode ser agendada via cron job
- **Bypass RLS:** Service role ignora RLS (cuidado!)

---

## Resumo para IA

### Contexto do Sistema
Sistema de gerenciamento de medicamentos multi-tenant (PostgreSQL/Supabase) com:
- Farmácias gerenciam múltiplos clientes
- Clientes rastreiam medicamentos e doses
- Eventos adversos e sinais vitais monitorados
- RLS habilitado em todas as 7 tabelas principais

### Tabelas Principais
1. **pharmacies:** Cadastro de farmácias (auth via email/senha)
2. **clients:** Pacientes (auth via CPF, vinculados a farmácia)
3. **medications:** Prescrições (schedules = "HH:MM,HH:MM", is_active flag)
4. **dose_records:** Doses individuais (status: pending/taken/skipped, auto-update)
5. **adverse_events:** Reações adversas (tipo, severidade, descrição)
6. **dose_corrections:** Erros de administração
7. **vital_signs:** Pressão arterial e glicemia

### Fluxos Principais
- **Cadastro:** Farmácia → Clientes → Medicamentos → Doses (auto-geradas)
- **Cliente:** Login com CPF → Marcar doses → Reportar eventos → Registrar sinais vitais
- **Farmácia:** Login → Ver clientes → Gerenciar medicamentos → Monitorar aderência
- **Automático:** Sistema marca doses perdidas diariamente (status = skipped)

### Segurança
- RLS ativo: Isolamento total entre farmácias e clientes
- Foreign keys: Integridade referencial com cascading
- Validações: CHECK constraints em enums e ranges
- Auditoria: Timestamps em todos os registros

### Performance
- Índices em: Foreign keys, timestamps, status fields
- Queries otimizadas para: Aderência, doses pendentes, eventos recentes

Este documento fornece base completa para entender, consultar e modificar o banco de dados.
