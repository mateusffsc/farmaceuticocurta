# Manual de Uso - Sistema de Farmácia Online

## Índice
1. [Visão Geral](#visão-geral)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Painel do Cliente](#painel-do-cliente)
4. [Painel da Farmácia](#painel-da-farmácia)
5. [Funcionalidades Detalhadas](#funcionalidades-detalhadas)
6. [Perguntas Frequentes](#perguntas-frequentes)

---

## Visão Geral

Sistema completo de gerenciamento de medicamentos que conecta farmácias e clientes, permitindo acompanhamento em tempo real de tratamentos, aderência medicamentosa e sinais vitais.

### Principais Benefícios
- Controle completo de medicações
- Monitoramento de aderência ao tratamento
- Registro de sinais vitais (pressão arterial e glicemia)
- Alertas automáticos para doses perdidas
- Relatórios de eventos adversos
- Comunicação direta com a farmácia

---

## Acesso ao Sistema

### Login do Cliente
1. Acesse a página inicial
2. Clique em "Entrar como Cliente"
3. Digite seu CPF (apenas números)
4. Sistema verifica automaticamente sua conta

### Login da Farmácia
1. Acesse a página inicial
2. Clique em "Entrar como Farmácia"
3. Digite seu e-mail
4. Digite sua senha
5. Clique em "Entrar"

---

## Painel do Cliente

### Navegação Principal

O menu está organizado em 5 seções principais para facilitar o uso:

#### 1. Início
Tela principal com visão geral do dia atual.

**O que você vê:**
- Card de aderência com estatísticas do mês
- Lista de medicamentos do dia de hoje
- Horários programados para cada medicação
- Status de cada dose (tomada, perdida ou pendente)

**Ações disponíveis:**
- Marcar dose como tomada
- Ver detalhes da dose
- Adicionar novo medicamento
- Adicionar sinais vitais

#### 2. Agenda
Calendário mensal interativo com todos os medicamentos.

**Como usar:**
- Navegue entre os meses usando as setas
- Dias com medicamentos aparecem destacados
- Clique em um dia para ver os medicamentos daquele dia
- Indicadores visuais:
  - Ponto verde: todas as doses tomadas
  - Ponto amarelo: doses pendentes
  - Verde + amarelo: parcialmente tomado

**Informações exibidas:**
- Horário de cada dose
- Nome e dosagem do medicamento
- Status atual (tomado, perdido, pendente)
- Horário real de tomada (quando aplicável)

#### 3. Saúde
Registro e histórico de sinais vitais.

**Sinais monitorados:**
- Pressão arterial (sistólica/diastólica)
- Glicemia
- Data e hora de cada medição

**Como adicionar:**
1. Clique em "Adicionar Sinais Vitais"
2. Preencha os valores
3. Confirme o registro

**Visualização:**
- Lista completa de medições
- Ordenação por data (mais recente primeiro)
- Identificação visual de valores críticos

#### 4. Evolução
Gráficos e estatísticas do seu tratamento.

**Estatísticas exibidas:**
- Taxa de aderência geral
- Total de doses tomadas
- Total de doses perdidas
- Doses pendentes

**Gráficos:**
- Evolução da aderência ao longo do tempo
- Comparativos por medicamento
- Tendências semanais/mensais

#### 5. Avisos
Registro de eventos adversos e problemas.

**Tipos de eventos:**
- Reações adversas a medicamentos
- Efeitos colaterais
- Alergias
- Outros problemas relacionados ao tratamento

**Como reportar:**
1. Clique em "Reportar Problema"
2. Selecione o medicamento
3. Escolha o tipo de problema
4. Descreva o que aconteceu
5. Envie o relato

A farmácia receberá uma notificação automática.

### Gerenciamento de Medicamentos

#### Adicionar Medicamento
1. Na tela Início, clique no botão "+" (Adicionar Medicamento)
2. Preencha as informações:
   - Nome do medicamento
   - Dosagem (ex: 500mg, 10ml)
   - Frequência diária (quantas vezes por dia)
   - Horários (defina cada horário de tomada)
   - Data de início do tratamento
3. Clique em "Adicionar Medicamento"

**Dica:** O sistema gerará automaticamente os horários de dose para os próximos 30 dias.

#### Ver Detalhes da Dose
1. Clique em qualquer card de medicamento
2. Visualize:
   - Informações completas do medicamento
   - Histórico de tomadas
   - Correções de dose (se houver)
   - Eventos adversos relacionados

#### Marcar Dose como Tomada
1. Localize o medicamento na lista
2. Clique no botão de check (✓)
3. A dose será registrada com o horário atual
4. O card mudará para verde indicando "tomada"

**Importante:** Você pode marcar doses atrasadas, e o sistema registrará o horário real da tomada.

### Sistema Automático de Doses Perdidas

O sistema marca automaticamente como "perdida" qualquer dose que:
- Estava programada para dias anteriores
- Não foi marcada como tomada até às 23:59:59
- Ainda estava com status "pendente"

**Quando acontece:**
- Ao abrir o aplicativo
- Diariamente às 00:00 (processamento automático no servidor)

**Por que isso é importante:**
- Mantém seu histórico preciso
- Permite cálculo correto da aderência
- Ajuda a farmácia a identificar padrões

---

## Painel da Farmácia

### Dashboard Principal

**Visão geral:**
- Lista de todos os clientes cadastrados
- Status de cada cliente
- Indicadores de aderência
- Alertas de eventos adversos

### Gerenciamento de Clientes

#### Cadastrar Novo Cliente
1. Clique em "Adicionar Cliente"
2. Preencha os dados:
   - Nome completo
   - CPF (será usado para login)
   - Data de nascimento
   - Contato (opcional)
3. Clique em "Cadastrar"

**Após cadastro:**
- Cliente pode fazer login imediatamente usando o CPF
- Você pode adicionar medicamentos para o cliente
- Cliente aparecerá na lista principal

#### Ver Detalhes do Cliente
1. Clique em qualquer cliente da lista
2. Visualize:
   - Informações pessoais
   - Medicamentos ativos
   - Taxa de aderência
   - Sinais vitais recentes
   - Histórico de doses
   - Eventos adversos reportados

#### Gerenciar Medicamentos do Cliente
1. Abra os detalhes do cliente
2. Clique em "Ver Eventos e Medicamentos"
3. Adicione novos medicamentos
4. Edite medicamentos existentes
5. Desative medicamentos quando necessário

**Ações disponíveis:**
- Adicionar novo medicamento
- Editar dosagem ou frequência
- Desativar medicamento (não excluir, para manter histórico)
- Ver todas as doses programadas

### Monitoramento de Aderência

**Indicadores por cliente:**
- Porcentagem de aderência mensal
- Total de doses tomadas vs. programadas
- Padrões de horários de tomada
- Identificação de clientes em risco

**Alertas automáticos para:**
- Aderência abaixo de 80%
- Múltiplas doses perdidas consecutivas
- Eventos adversos reportados
- Longo período sem registros

### Análise de Eventos Adversos

**Visualização:**
- Lista completa de eventos por cliente
- Filtros por tipo de problema
- Data e hora do relato
- Medicamento associado
- Descrição detalhada

**Ações:**
- Revisar cada evento
- Contatar cliente se necessário
- Ajustar medicação
- Documentar intervenções

---

## Funcionalidades Detalhadas

### Sistema de Doses

**Como funciona:**
- Ao cadastrar um medicamento, o sistema gera automaticamente registros de dose
- Cada dose tem um horário programado
- Doses podem ter 3 status: pendente, tomada, perdida

**Estados da dose:**
1. **Pendente (amarelo):** Aguardando o cliente marcar como tomada
2. **Tomada (verde):** Cliente confirmou a tomada
3. **Perdida (vermelho):** Não foi tomada no prazo

**Correção de doses:**
- Se o cliente tomar o medicamento em horário diferente, o sistema registra
- Diferença entre horário programado e real é calculada
- Farmácia pode ver padrões de atraso

### Cálculo de Aderência

**Fórmula:**
```
Aderência = (Doses Tomadas / Total de Doses Programadas) × 100
```

**Períodos calculados:**
- Últimos 7 dias
- Últimos 30 dias
- Histórico completo

**Classificação:**
- 90-100%: Excelente (verde)
- 80-89%: Boa (amarelo)
- 70-79%: Regular (laranja)
- Abaixo de 70%: Crítica (vermelho)

### Notificações e Alertas

**Cliente recebe alertas para:**
- Horário de tomar medicamento (futuro)
- Doses atrasadas
- Resposta da farmácia a eventos reportados

**Farmácia recebe alertas para:**
- Novos eventos adversos
- Clientes com baixa aderência
- Clientes sem registros por período prolongado

### Segurança e Privacidade

**Proteção de dados:**
- Row Level Security (RLS) ativado em todas as tabelas
- Clientes só veem seus próprios dados
- Farmácia só vê dados dos seus clientes
- Senhas não são armazenadas em texto plano

**Políticas de acesso:**
- Cliente: acesso apenas aos próprios registros
- Farmácia: acesso aos clientes cadastrados por ela
- Nenhum dado é compartilhado entre farmácias

---

## Perguntas Frequentes

### Para Clientes

**P: Esqueci de marcar que tomei o remédio. Posso marcar depois?**
R: Sim, você pode marcar a qualquer momento. O sistema registrará o horário real da marcação.

**P: O que acontece se eu esquecer de marcar uma dose?**
R: Após às 23:59:59 do dia programado, a dose será automaticamente marcada como "perdida". Isso não é uma punição, apenas ajuda a manter seu histórico preciso.

**P: Posso adicionar meus próprios medicamentos?**
R: Sim! Clique no botão "+" na tela Início e preencha as informações do medicamento.

**P: Como vejo meu histórico completo?**
R: Use a seção "Agenda" para ver todos os dias com medicamentos programados. Clique em qualquer dia para ver detalhes.

**P: O que é aderência?**
R: É a porcentagem de doses que você tomou em relação ao total programado. Quanto maior, melhor está seu tratamento.

**P: Posso apagar um medicamento?**
R: O sistema não permite deletar medicamentos para manter seu histórico médico completo. A farmácia pode desativar medicamentos quando não são mais necessários.

### Para Farmácias

**P: Como cadastro um novo cliente?**
R: Clique em "Adicionar Cliente" no dashboard, preencha os dados e confirme. O CPF será usado como login do cliente.

**P: Cliente perdeu o CPF de acesso. O que fazer?**
R: Consulte o cadastro do cliente no sistema. O CPF está disponível nos detalhes do cliente.

**P: Como acompanho a aderência de um cliente?**
R: Abra os detalhes do cliente. A taxa de aderência aparece em destaque, junto com gráficos e estatísticas.

**P: Posso editar um medicamento já cadastrado?**
R: Sim, nos detalhes do cliente, clique no medicamento e selecione "Editar". Isso afetará apenas doses futuras.

**P: Como desativo um medicamento que o cliente parou de usar?**
R: Edite o medicamento e marque como inativo. Isso preserva o histórico mas remove das doses futuras.

**P: O que fazer quando recebo um alerta de evento adverso?**
R: Revise os detalhes na seção "Eventos Adversos" do cliente. Entre em contato se necessário e documente as ações tomadas.

**P: Posso ver sinais vitais dos clientes?**
R: Sim, nos detalhes do cliente há uma seção com todo o histórico de sinais vitais (pressão e glicemia).

---

## Suporte Técnico

Para dúvidas, problemas técnicos ou sugestões de melhorias, entre em contato com a equipe de suporte.

**Importante:** Este sistema é uma ferramenta de apoio ao tratamento. Em caso de emergência médica, procure atendimento médico imediato.

---

## Atualizações do Sistema

**Versão atual:** 1.0

**Últimas funcionalidades adicionadas:**
- Calendário mensal interativo
- Navegação simplificada (5 seções principais)
- Registro de sinais vitais
- Marcação automática de doses perdidas
- Interface otimizada para usuários 30+

**Em desenvolvimento:**
- Notificações push
- Exportação de relatórios em PDF
- Integração com dispositivos de medição
- Lembretes personalizáveis
