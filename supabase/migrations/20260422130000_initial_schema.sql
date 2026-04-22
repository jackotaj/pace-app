-- Pace initial schema
-- Multi-tenant: org → store → rep. Every table scoped via store_id → org_id.
-- RLS enforces isolation; RLS policies added in 20260422130100_rls.sql.

-- ── Extensions ─────────────────────────────────────────────

create extension if not exists "pg_trgm";
create extension if not exists "citext";

-- ── Enums ──────────────────────────────────────────────────
do $$ begin
  create type role_type as enum ('admin', 'manager', 'rep');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sale_kind as enum ('new', 'used');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sale_source as enum ('walk-in', 'web', 'curb', 'referral', 'phone', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ingest_source as enum ('csv_upload', 'email', 'api', 'manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ingest_status as enum ('pending', 'previewing', 'committed', 'errored', 'discarded');
exception when duplicate_object then null; end $$;

-- ── Orgs ───────────────────────────────────────────────────
create table if not exists public.orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        citext unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ── Stores ─────────────────────────────────────────────────
create table if not exists public.stores (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  name        text not null,
  timezone    text not null default 'America/New_York',
  city        text,
  state       text,
  -- inbound ingest address local part; unique global (pace.direct/ingest.pace.direct)
  ingest_slug citext unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists stores_org_id_idx on public.stores(org_id);

-- ── Reps ───────────────────────────────────────────────────
-- user_id is nullable: a manager can add a rep before that rep has signed in.
create table if not exists public.reps (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,
  name         text not null,
  email        citext,
  short        text,                                   -- 2-letter initials for Avatar
  color        text not null default '#6b4fb8',
  focus        text,                                   -- 'new' | 'used' | 'both'
  active       boolean not null default true,
  hired_at     date,
  -- current-month goals (simple v1; later: goals table per month)
  goal_units   int not null default 0,
  goal_gross   numeric(12,2) not null default 0,
  -- per-rep conversion ratios (after ≥30 appts; before that org default)
  ratios       jsonb not null default '{"close":0.20,"show":0.65,"set":0.15,"contact":0.30}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  unique (store_id, email)
);
create index if not exists reps_store_id_idx on public.reps(store_id);
create index if not exists reps_user_id_idx  on public.reps(user_id);

-- ── Memberships ────────────────────────────────────────────
-- Bridge between auth.users and orgs/stores with a role.
-- A manager has org-level membership (store_id null) OR store-level.
-- A rep has (store_id set, role='rep').
create table if not exists public.memberships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  org_id      uuid not null references public.orgs(id) on delete cascade,
  store_id    uuid references public.stores(id) on delete cascade,
  role        role_type not null,
  created_at  timestamptz not null default now()
);
-- partial unique indexes: one row per (user, org) when store is NULL (org-wide),
-- one row per (user, org, store) when store is set.
create unique index if not exists memberships_user_org_orgwide_uniq
  on public.memberships(user_id, org_id)
  where store_id is null;
create unique index if not exists memberships_user_org_store_uniq
  on public.memberships(user_id, org_id, store_id)
  where store_id is not null;
create index if not exists memberships_user_id_idx on public.memberships(user_id);
create index if not exists memberships_org_id_idx  on public.memberships(org_id);

-- ── Goals (per-rep, per-month) ─────────────────────────────
-- For v1 we read current-month goals from reps.goal_* directly.
-- Historical / future months land here.
create table if not exists public.goals (
  id          uuid primary key default gen_random_uuid(),
  rep_id      uuid not null references public.reps(id) on delete cascade,
  year_month  text not null,                            -- 'YYYY-MM'
  units       int not null default 0,
  gross       numeric(12,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (rep_id, year_month)
);
create index if not exists goals_rep_id_idx on public.goals(rep_id);

-- ── Sales ──────────────────────────────────────────────────
-- sold_at_date is computed in store timezone by ingest/insert.
create table if not exists public.sales (
  id               uuid primary key default gen_random_uuid(),
  rep_id           uuid not null references public.reps(id) on delete cascade,
  store_id         uuid not null references public.stores(id) on delete cascade,
  sold_at          timestamptz not null,
  sold_at_date     date not null,
  vin              text,
  vehicle          text,                                 -- freeform: "2024 Toyota RAV4"
  gross            numeric(12,2) not null default 0,
  kind             sale_kind not null default 'used',
  source           sale_source not null default 'other',
  ingest_run_id    uuid,                                 -- FK added below after ingest_runs exists
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
-- dedup: one sale per (store, VIN, day) — null VINs allowed but treated as duplicates only on full row match
create unique index if not exists sales_store_vin_date_uniq
  on public.sales(store_id, vin, sold_at_date)
  where vin is not null and deleted_at is null;
create index if not exists sales_rep_id_idx on public.sales(rep_id);
create index if not exists sales_store_date_idx on public.sales(store_id, sold_at_date desc);

-- ── Activities (one row per rep per day) ───────────────────
create table if not exists public.activities (
  id              uuid primary key default gen_random_uuid(),
  rep_id          uuid not null references public.reps(id) on delete cascade,
  store_id        uuid not null references public.stores(id) on delete cascade,
  activity_date   date not null,
  calls           int not null default 0,
  texts           int not null default 0,
  appts_set       int not null default 0,
  appts_shown     int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (rep_id, activity_date)
);
create index if not exists activities_rep_id_date_idx on public.activities(rep_id, activity_date desc);

-- ── Ingest runs ────────────────────────────────────────────
create table if not exists public.ingest_runs (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores(id) on delete cascade,
  source         ingest_source not null,
  status         ingest_status not null default 'pending',
  triggered_by   uuid references auth.users(id),
  filename       text,
  from_email     text,
  ran_at         timestamptz not null default now(),
  committed_at   timestamptz,
  rows_total     int not null default 0,
  rows_added     int not null default 0,
  rows_skipped   int not null default 0,
  rows_errored   int not null default 0,
  preview        jsonb,                                  -- staged rows awaiting confirm
  error_log      jsonb
);
create index if not exists ingest_runs_store_id_idx on public.ingest_runs(store_id);

-- FK sales → ingest_runs now that the table exists
alter table public.sales
  drop constraint if exists sales_ingest_run_id_fkey;
alter table public.sales
  add constraint sales_ingest_run_id_fkey
  foreign key (ingest_run_id) references public.ingest_runs(id) on delete set null;

-- ── updated_at trigger helper ──────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger orgs_updated        before update on public.orgs        for each row execute function public.set_updated_at();
  create trigger stores_updated      before update on public.stores      for each row execute function public.set_updated_at();
  create trigger reps_updated        before update on public.reps        for each row execute function public.set_updated_at();
  create trigger goals_updated       before update on public.goals       for each row execute function public.set_updated_at();
  create trigger activities_updated  before update on public.activities  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
