-- Enable pgvector for similarity search
create extension if not exists vector;

-- ============================================================
-- brand_visual_dna: structured visual profile per entity
-- ============================================================
create table if not exists public.brand_visual_dna (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  entity_id uuid not null,
  entity_type text not null check (entity_type in ('brand','product','event')),
  dna jsonb not null default '{}'::jsonb,
  prompt_seed text,
  source_image_count integer not null default 0,
  auto_train boolean not null default false,
  last_trained_at timestamptz,
  last_training_status text,
  last_training_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_id, entity_type)
);

create index if not exists brand_visual_dna_org_idx on public.brand_visual_dna (organization_id);
create index if not exists brand_visual_dna_entity_idx on public.brand_visual_dna (entity_id, entity_type);

alter table public.brand_visual_dna enable row level security;

create policy "Org members can view visual DNA"
  on public.brand_visual_dna
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = brand_visual_dna.organization_id
        and om.user_id = auth.uid()
    )
  );

create policy "Org admins can insert visual DNA"
  on public.brand_visual_dna
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = brand_visual_dna.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner','admin')
    )
  );

create policy "Org admins can update visual DNA"
  on public.brand_visual_dna
  for update
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = brand_visual_dna.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner','admin')
    )
  );

create policy "Org admins can delete visual DNA"
  on public.brand_visual_dna
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = brand_visual_dna.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner','admin')
    )
  );

create trigger update_brand_visual_dna_updated_at
  before update on public.brand_visual_dna
  for each row
  execute function public.update_updated_at_column();

-- ============================================================
-- brand_imagery_embeddings: per-image embeddings for similarity search
-- text-embedding-3-small returns 1536 dims
-- ============================================================
create table if not exists public.brand_imagery_embeddings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  entity_id uuid not null,
  entity_type text not null check (entity_type in ('brand','product','event')),
  section_id text,
  image_id text not null,
  image_url text not null,
  caption text,
  tags text[] not null default '{}',
  embedding vector(1536) not null,
  model_version text not null default 'openai/text-embedding-3-small',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_id, entity_type, image_id)
);

create index if not exists brand_imagery_embeddings_entity_idx
  on public.brand_imagery_embeddings (entity_id, entity_type);
create index if not exists brand_imagery_embeddings_org_idx
  on public.brand_imagery_embeddings (organization_id);
create index if not exists brand_imagery_embeddings_vec_idx
  on public.brand_imagery_embeddings using hnsw (embedding vector_cosine_ops);

alter table public.brand_imagery_embeddings enable row level security;

create policy "Org members can view imagery embeddings"
  on public.brand_imagery_embeddings
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = brand_imagery_embeddings.organization_id
        and om.user_id = auth.uid()
    )
  );

create policy "Org admins can insert imagery embeddings"
  on public.brand_imagery_embeddings
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = brand_imagery_embeddings.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner','admin')
    )
  );

create policy "Org admins can update imagery embeddings"
  on public.brand_imagery_embeddings
  for update
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = brand_imagery_embeddings.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner','admin')
    )
  );

create policy "Org admins can delete imagery embeddings"
  on public.brand_imagery_embeddings
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = brand_imagery_embeddings.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner','admin')
    )
  );

create trigger update_brand_imagery_embeddings_updated_at
  before update on public.brand_imagery_embeddings
  for each row
  execute function public.update_updated_at_column();

-- ============================================================
-- Similarity search RPC, scoped to a single entity
-- ============================================================
create or replace function public.match_brand_imagery (
  p_entity_id uuid,
  p_entity_type text,
  p_query_embedding vector(1536),
  p_match_count integer default 12
)
returns table (
  id uuid,
  image_id text,
  image_url text,
  caption text,
  tags text[],
  section_id text,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.image_id,
    e.image_url,
    e.caption,
    e.tags,
    e.section_id,
    1 - (e.embedding <=> p_query_embedding) as similarity
  from public.brand_imagery_embeddings e
  where e.entity_id = p_entity_id
    and e.entity_type = p_entity_type
    and exists (
      select 1 from public.organization_members om
      where om.organization_id = e.organization_id
        and om.user_id = auth.uid()
    )
  order by e.embedding <=> p_query_embedding
  limit p_match_count
$$;