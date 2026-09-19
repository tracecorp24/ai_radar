create extension if not exists pgcrypto;

create table if not exists public.papers (
  id text primary key,
  external_id text unique not null,
  payload jsonb not null,
  first_seen_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.paper_assets (
  id uuid primary key default gen_random_uuid(),
  paper_id text not null references public.papers(id) on delete cascade,
  asset_type text not null check (asset_type in ('pdf', 'html', 'tex')),
  storage_path text,
  source_url text not null,
  content_hash text,
  file_size bigint,
  download_status text not null default 'available',
  created_at timestamptz not null default now(),
  unique (paper_id, asset_type)
);

create table if not exists public.trend_snapshots (
  id bigint generated always as identity primary key,
  paper_id text not null references public.papers(id) on delete cascade,
  captured_at timestamptz not null default now(),
  trend_score numeric not null,
  signals jsonb not null default '{}'::jsonb
);

create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  query text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  items_found integer not null default 0,
  items_created integer not null default 0,
  status text not null default 'running',
  error text
);

create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_id text not null references public.papers(id) on delete cascade,
  is_read boolean not null default false,
  collection text,
  created_at timestamptz not null default now(),
  primary key (user_id, paper_id)
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  topics jsonb not null default '[]'::jsonb,
  weights jsonb not null default '{"recency":35,"velocity":30,"relevance":20,"novelty":10,"author":5}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.papers enable row level security;
alter table public.paper_assets enable row level security;
alter table public.trend_snapshots enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.bookmarks enable row level security;
alter table public.user_preferences enable row level security;

create policy "Public can read papers" on public.papers for select using (true);
create policy "Public can read assets" on public.paper_assets for select using (true);
create policy "Public can read trends" on public.trend_snapshots for select using (true);
create policy "Users manage own bookmarks" on public.bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own preferences" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists papers_updated_at_idx on public.papers(updated_at desc);
create index if not exists snapshots_paper_date_idx on public.trend_snapshots(paper_id, captured_at desc);
