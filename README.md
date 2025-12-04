# Farmacêutico Curta

Plataforma web para acompanhamento de medicamentos e saúde de pacientes, conectando farmácias e clientes em um fluxo simples, seguro e multi-tenant.

## Visão Geral
- Foco em aderência ao tratamento: agenda de doses, marcação de tomadas e identificação de doses perdidas.
- Registro de sinais vitais e eventos adversos com histórico acessível.
- Farmácias gerenciam seus clientes, medicamentos e campanhas de anúncios.
- Autenticação por telefone ou email, com recuperação de senha via Edge Function.
- Arquitetura multi-tenant com isolamento por farmácia e RLS em todas as tabelas.

## Perfis de Usuário
- Farmácia
  - Cadastra e gerencia clientes.
  - Adiciona e atualiza medicamentos.
  - Acompanha aderência, sinais vitais e eventos.
  - Gerencia anúncios exibidos aos clientes.
- Cliente
  - Acessa sua agenda de medicação diária e mensal.
  - Marca doses como tomadas e registra eventos adversos.
  - Registra sinais vitais (pressão, glicemia) e acompanha histórico.

## Principais Funcionalidades
- Agenda de doses com status: pendente, tomada e perdida.
- Geração automática de registros de dose ao cadastrar medicamentos.
- Vinculação de eventos adversos à dose mais próxima e indicadores por dose.
- Histórico e visualizações de aderência ao tratamento.
- Campanhas de anúncios por farmácia, com ativação e ordenação.
- Recuperação de senha baseada em telefone via função de borda.

## Arquitetura e Tecnologias
- Frontend: React + Vite + TailwindCSS + Zustand.
- Backend: Supabase (Postgres, Auth, Realtime, Edge Functions).
- Segurança: Row Level Security (RLS) em todas as tabelas, políticas por perfil.
- Edge Functions:
  - `update-password`: atualização de senha via Admin Auth, com suporte a geração de link de recuperação.
  - Jobs e migrações de banco para manter dados coerentes (ex.: doses perdidas, flags de eventos).

## Banco de Dados
- Tabelas principais: `pharmacies`, `clients`, `medications`, `dose_records`.
- Extensões:
  - `adverse_events` e `dose_corrections` para rastrear problemas e correções de dose.
  - `vital_signs` para registros de pressão e glicemia.
- Índices e FKs com cascatas apropriadas.
- Políticas RLS garantindo que:
  - Farmácias veem e gerenciam dados de seus clientes.
  - Clientes veem e gerenciam apenas seus próprios dados.

## Autenticação
- Login por telefone (com geração de email técnico) ou email direto.
- Validação forte de formatos brasileiros de telefone.
- Recuperação de senha:
  - Em desenvolvimento, a página chama `POST /edge/update-password` e o Vite proxy encaminha para a função remota.
  - Em produção, a página deriva a URL da função a partir de `VITE_SUPABASE_URL`.
  - Função aceita JSON e atualiza a senha via Admin Auth.

## Desenvolvimento
- Requisitos:
  - Node.js LTS
  - Variáveis `.env` para Supabase:
    - `VITE_SUPABASE_URL` (ex.: `https://<ref>.supabase.co`)
    - `VITE_SUPABASE_ANON_KEY` (chave anônima)
- Scripts:
  - `npm run dev` — inicia servidor de desenvolvimento.
  - `npm run build` — build de produção.
  - `npm run preview` — pré-visualização do build.
  - `npm run lint` — lint do projeto.
  - `npm run typecheck` — checagem de tipos.
- Proxy em dev:
  - `vite.config.ts` encaminha `/edge/update-password` para a função de borda.

## Deploy
- Frontend: qualquer host estático (ex.: Netlify, Vercel, GitHub Pages) apontando para Supabase.
- Supabase:
  - Migrações SQL aplicadas via Studio/CLI.
  - Edge Functions publicadas via Dashboard ou CLI (`supabase functions deploy`).
- Configuração:
  - Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente de produção.

## Segurança e Privacidade
- RLS ativa por padrão, sem dados públicos.
- Sem armazenamento de segredos no repositório.
- Policies de leitura/escrita segmentadas por perfil (farmácia/cliente).

## Estado Atual
- Funcionalidades principais implementadas e integradas.
- Fluxo de recuperação de senha ajustado para usar `PUT` no Admin Auth, evitando erro 405.
- Melhorias contínuas de UX e métricas de aderência.

## Próximos Passos
- Notificações ao cliente para doses pendentes/perdidas.
- Relatórios avançados de aderência e saúde.
- Integrações com dispositivos de saúde.
