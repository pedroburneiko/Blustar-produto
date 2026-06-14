-- =============================================================================
-- BluStar — schema de persistência (Supabase)
-- =============================================================================
-- Fonte versionada do que precisa existir no projeto Supabase. Rode no SQL
-- Editor do Supabase. Se já existir uma versão antiga (ex.: a permissiva da
-- primeira passada), rode antes: drop table public.documents;
--
-- Passos manuais (fora deste arquivo):
--   1. Authentication → Sign In / Providers → habilitar "Anonymous sign-ins".
--   2. Rodar este SQL.
--   3. apps/workspace/.env.local:
--        VITE_SUPABASE_URL=...        (Settings → API → Project URL)
--        VITE_SUPABASE_ANON_KEY=...   (Settings → API → anon public key)
--      Nunca commitar .env.local. Nunca usar a service_role key no cliente.
--
-- Modelo: autenticação ANÔNIMA + RLS por dono (cada usuário anônimo só vê/edita
-- os próprios documentos). O app guarda o BrandDocument inteiro em `data` (jsonb).
-- =============================================================================

create table if not exists public.documents (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null default auth.uid(),
  name       text not null default 'Documento',
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "own select" on public.documents
  for select using (owner = auth.uid());

create policy "own insert" on public.documents
  for insert with check (owner = auth.uid());

create policy "own update" on public.documents
  for update using (owner = auth.uid()) with check (owner = auth.uid());

create policy "own delete" on public.documents
  for delete using (owner = auth.uid());
