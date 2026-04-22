-- Per-rep, per-month frozen snapshot of units / gross / close_rate.
-- Used by the month-end recap screen (phase 2) and historical reports.

create table if not exists public.month_snapshots (
  id              uuid primary key default gen_random_uuid(),
  rep_id          uuid not null references public.reps(id) on delete cascade,
  store_id        uuid not null references public.stores(id) on delete cascade,
  year_month      text not null,                      -- 'YYYY-MM'
  units           int not null default 0,
  gross           numeric(12,2) not null default 0,
  goal_units      int not null default 0,
  goal_gross      numeric(12,2) not null default 0,
  appts_shown     int not null default 0,
  close_rate      numeric(5,4) not null default 0,
  streak_max      int not null default 0,
  created_at      timestamptz not null default now(),
  unique (rep_id, year_month)
);

create index if not exists month_snapshots_store_yymm_idx
  on public.month_snapshots(store_id, year_month desc);

alter table public.month_snapshots enable row level security;

drop policy if exists month_snapshots_select on public.month_snapshots;
create policy month_snapshots_select on public.month_snapshots
  for select using (store_id in (select public.user_store_ids(auth.uid())));
