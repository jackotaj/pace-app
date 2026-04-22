-- RLS: every table enforces org-level tenancy via memberships.
-- Rep-role users only see their own rep-scoped rows.
-- Service role bypasses RLS for server-side ingestion.

alter table public.orgs        enable row level security;
alter table public.stores      enable row level security;
alter table public.reps        enable row level security;
alter table public.memberships enable row level security;
alter table public.goals       enable row level security;
alter table public.sales       enable row level security;
alter table public.activities  enable row level security;
alter table public.ingest_runs enable row level security;

-- ── Helpers ────────────────────────────────────────────────
create or replace function public.user_org_ids(uid uuid)
returns setof uuid
language sql stable security definer
set search_path = public
as $$
  select org_id from public.memberships where user_id = uid;
$$;

create or replace function public.user_store_ids(uid uuid)
returns setof uuid
language sql stable security definer
set search_path = public
as $$
  -- managers: all stores in their org. reps: only their assigned store.
  select s.id from public.stores s
  where s.org_id in (select org_id from public.memberships where user_id = uid and role in ('admin','manager'))
  union
  select m.store_id from public.memberships m
  where m.user_id = uid and m.role = 'rep' and m.store_id is not null;
$$;

create or replace function public.user_rep_id(uid uuid, sid uuid)
returns uuid
language sql stable security definer
set search_path = public
as $$
  select id from public.reps where user_id = uid and store_id = sid limit 1;
$$;

create or replace function public.is_store_manager(uid uuid, sid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(
    select 1 from public.memberships m
    join public.stores s on s.org_id = m.org_id
    where m.user_id = uid and m.role in ('admin','manager') and s.id = sid
  );
$$;

-- ── orgs ────────────────────────────────────────────────────
drop policy if exists orgs_select on public.orgs;
create policy orgs_select on public.orgs
  for select using (id in (select public.user_org_ids(auth.uid())));

-- ── stores ──────────────────────────────────────────────────
drop policy if exists stores_select on public.stores;
create policy stores_select on public.stores
  for select using (id in (select public.user_store_ids(auth.uid())));

drop policy if exists stores_manager_write on public.stores;
create policy stores_manager_write on public.stores
  for all using (public.is_store_manager(auth.uid(), id))
  with check (public.is_store_manager(auth.uid(), id));

-- ── memberships ─────────────────────────────────────────────
drop policy if exists memberships_select_self on public.memberships;
create policy memberships_select_self on public.memberships
  for select using (user_id = auth.uid() or org_id in (
    select org_id from public.memberships where user_id = auth.uid() and role in ('admin','manager')
  ));

-- ── reps ────────────────────────────────────────────────────
-- managers: all reps in their store. reps: only their own row.
drop policy if exists reps_select on public.reps;
create policy reps_select on public.reps
  for select using (
    store_id in (select public.user_store_ids(auth.uid()))
  );

drop policy if exists reps_manager_write on public.reps;
create policy reps_manager_write on public.reps
  for all using (public.is_store_manager(auth.uid(), store_id))
  with check (public.is_store_manager(auth.uid(), store_id));

-- reps can update their own user_id link (for claim flow) — handled in RPC, not bare RLS.

-- ── goals ───────────────────────────────────────────────────
drop policy if exists goals_select on public.goals;
create policy goals_select on public.goals
  for select using (
    rep_id in (select id from public.reps where store_id in (select public.user_store_ids(auth.uid())))
  );

drop policy if exists goals_manager_write on public.goals;
create policy goals_manager_write on public.goals
  for all using (
    rep_id in (select id from public.reps where public.is_store_manager(auth.uid(), store_id))
  ) with check (
    rep_id in (select id from public.reps where public.is_store_manager(auth.uid(), store_id))
  );

-- ── sales ───────────────────────────────────────────────────
drop policy if exists sales_select on public.sales;
create policy sales_select on public.sales
  for select using (store_id in (select public.user_store_ids(auth.uid())));

drop policy if exists sales_manager_write on public.sales;
create policy sales_manager_write on public.sales
  for all using (public.is_store_manager(auth.uid(), store_id))
  with check (public.is_store_manager(auth.uid(), store_id));

-- ── activities ──────────────────────────────────────────────
-- reps can write their own; managers can write any in their store.
drop policy if exists activities_select on public.activities;
create policy activities_select on public.activities
  for select using (store_id in (select public.user_store_ids(auth.uid())));

drop policy if exists activities_insert on public.activities;
create policy activities_insert on public.activities
  for insert with check (
    (rep_id = public.user_rep_id(auth.uid(), store_id))
    or public.is_store_manager(auth.uid(), store_id)
  );

drop policy if exists activities_update on public.activities;
create policy activities_update on public.activities
  for update using (
    (rep_id = public.user_rep_id(auth.uid(), store_id))
    or public.is_store_manager(auth.uid(), store_id)
  );

-- ── ingest_runs ─────────────────────────────────────────────
drop policy if exists ingest_select on public.ingest_runs;
create policy ingest_select on public.ingest_runs
  for select using (store_id in (select public.user_store_ids(auth.uid())));

drop policy if exists ingest_manager_write on public.ingest_runs;
create policy ingest_manager_write on public.ingest_runs
  for all using (public.is_store_manager(auth.uid(), store_id))
  with check (public.is_store_manager(auth.uid(), store_id));
