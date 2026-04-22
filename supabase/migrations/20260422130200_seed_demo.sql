-- Seed the Greenfield Auto demo store + roster so the landing/demo continues to work
-- before real orgs sign up. Uses stable IDs (deterministic uuids) so re-seeding is idempotent.

insert into public.orgs (id, name, slug)
values ('11111111-0000-4000-8000-000000000001', 'Greenfield Auto Group', 'greenfield')
on conflict (id) do nothing;

insert into public.stores (id, org_id, name, timezone, city, state, ingest_slug)
values (
  '22222222-0000-4000-8000-000000000001',
  '11111111-0000-4000-8000-000000000001',
  'Greenfield Auto',
  'America/Boise',
  'Boise',
  'ID',
  'greenfield'
) on conflict (id) do nothing;

-- Roster — mirrors data.jsx INITIAL_REPS. Short codes + colors preserved.
insert into public.reps (id, store_id, name, short, color, goal_units, goal_gross, active)
values
  ('33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Marcus Hale',     'MH', '#2b6cb0', 12, 26000, true),
  ('33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Jessica Tran',    'JT', '#6b4fb8', 10, 22000, true),
  ('33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'Todd Ramirez',    'TR', '#0d0e10', 12, 28000, true),
  ('33333333-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', 'Derek Okafor',    'DO', '#b8842a', 12, 26000, true),
  ('33333333-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001', 'Priya Shah',      'PS', '#17a058', 11, 24000, true),
  ('33333333-0000-4000-8000-000000000006', '22222222-0000-4000-8000-000000000001', 'Mike Delacroix',  'MD', '#d43f3a', 11, 24000, true),
  ('33333333-0000-4000-8000-000000000007', '22222222-0000-4000-8000-000000000001', 'Aaron Webb',      'AW', '#3a8a7a', 10, 22000, true),
  ('33333333-0000-4000-8000-000000000008', '22222222-0000-4000-8000-000000000001', 'Leah Park',       'LP', '#c25c8f', 10, 22000, true)
on conflict (id) do nothing;

-- Seed demo sales to match the mock sold counts (april 2026).
-- This keeps pace numbers looking familiar in the demo after we cut over to real reads.
-- Using a predictable pattern: N sales per rep, spaced every 2-3 days, with gross matching mock totals roughly.
do $$
declare
  rep_row record;
  sold_n int;
  g_total numeric;
  i int;
begin
  for rep_row in
    select id, name, store_id,
           case
             when name = 'Marcus Hale'    then 14 when name = 'Jessica Tran'   then 11
             when name = 'Todd Ramirez'   then 7  when name = 'Derek Okafor'   then 6
             when name = 'Priya Shah'     then 10 when name = 'Mike Delacroix' then 9
             when name = 'Aaron Webb'     then 5  when name = 'Leah Park'      then 8
             else 0
           end as n,
           case
             when name = 'Marcus Hale'    then 31200 when name = 'Jessica Tran'   then 24800
             when name = 'Todd Ramirez'   then 14200 when name = 'Derek Okafor'   then 11400
             when name = 'Priya Shah'     then 22100 when name = 'Mike Delacroix' then 18600
             when name = 'Aaron Webb'     then 9800  when name = 'Leah Park'      then 17400
             else 0
           end as g
    from public.reps
    where store_id = '22222222-0000-4000-8000-000000000001'
  loop
    sold_n := rep_row.n;
    g_total := rep_row.g;
    if sold_n = 0 then continue; end if;
    for i in 1..sold_n loop
      insert into public.sales (rep_id, store_id, sold_at, sold_at_date, vehicle, gross, kind, source)
      values (
        rep_row.id,
        rep_row.store_id,
        ('2026-04-' || lpad(greatest(1, 21 - (i * 21 / sold_n))::text, 2, '0') || 'T14:00:00Z')::timestamptz,
        ('2026-04-' || lpad(greatest(1, 21 - (i * 21 / sold_n))::text, 2, '0'))::date,
        'Demo Vehicle ' || i,
        round(g_total::numeric / sold_n, 2),
        case when i % 3 = 0 then 'new'::sale_kind else 'used'::sale_kind end,
        'walk-in'::sale_source
      )
      on conflict do nothing;
    end loop;
  end loop;
end $$;

-- Seed today's activity for each rep (mirrors activityToday in data.jsx)
insert into public.activities (rep_id, store_id, activity_date, calls, texts, appts_set, appts_shown)
values
  ('33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', current_date, 28, 44, 3, 2),
  ('33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', current_date, 22, 38, 2, 2),
  ('33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', current_date, 18, 27, 2, 1),
  ('33333333-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', current_date - 2, 0, 0, 0, 0),
  ('33333333-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001', current_date, 19, 31, 2, 1),
  ('33333333-0000-4000-8000-000000000006', '22222222-0000-4000-8000-000000000001', current_date, 15, 22, 1, 1),
  ('33333333-0000-4000-8000-000000000007', '22222222-0000-4000-8000-000000000001', current_date - 1, 6, 12, 0, 0),
  ('33333333-0000-4000-8000-000000000008', '22222222-0000-4000-8000-000000000001', current_date, 20, 29, 2, 1)
on conflict (rep_id, activity_date) do update set
  calls = excluded.calls, texts = excluded.texts,
  appts_set = excluded.appts_set, appts_shown = excluded.appts_shown;
