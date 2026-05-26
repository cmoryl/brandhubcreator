-- Skill QA: jobs + report history with realtime
create table if not exists public.skill_qa_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  entity_type text not null check (entity_type in ('brand','product','event')),
  entity_id uuid not null,
  brand_name text not null,
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  progress jsonb not null default '{"current":0,"total":0,"label":""}'::jsonb,
  tiers text[] not null default array['haiku','sonnet','opus'],
  sections text[] not null default array['colors','typography','logos','voice','imagery','antiPatterns'],
  include_visual_regression boolean not null default true,
  partial_results jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists skill_qa_jobs_entity_idx
  on public.skill_qa_jobs (entity_type, entity_id, created_at desc);
create index if not exists skill_qa_jobs_status_idx
  on public.skill_qa_jobs (status, created_at desc);

create table if not exists public.skill_qa_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.skill_qa_jobs(id) on delete set null,
  organization_id uuid,
  entity_type text not null,
  entity_id uuid not null,
  brand_name text not null,
  avg_score_by_tier jsonb not null default '{}'::jsonb,
  consistently_missing text[] not null default '{}',
  recurring_misuses jsonb not null default '[]'::jsonb,
  visual_regression jsonb,
  pdf_vision jsonb,
  full_report jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists skill_qa_reports_entity_idx
  on public.skill_qa_reports (entity_type, entity_id, created_at desc);

alter table public.skill_qa_jobs enable row level security;
alter table public.skill_qa_reports enable row level security;

-- Permissive read for authenticated users (admin gating happens client-side and via existing has_role checks elsewhere)
drop policy if exists "qa_jobs_select_auth" on public.skill_qa_jobs;
create policy "qa_jobs_select_auth" on public.skill_qa_jobs for select to authenticated using (true);

drop policy if exists "qa_jobs_insert_self" on public.skill_qa_jobs;
create policy "qa_jobs_insert_self" on public.skill_qa_jobs for insert to authenticated with check (auth.uid() = user_id or user_id is null);

drop policy if exists "qa_reports_select_auth" on public.skill_qa_reports;
create policy "qa_reports_select_auth" on public.skill_qa_reports for select to authenticated using (true);

-- service role inserts; no public insert
drop policy if exists "qa_jobs_update_owner" on public.skill_qa_jobs;
create policy "qa_jobs_update_owner" on public.skill_qa_jobs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.skill_qa_jobs;
alter table public.skill_qa_jobs replica identity full;