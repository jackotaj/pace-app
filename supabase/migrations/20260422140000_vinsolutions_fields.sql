-- Adds VinSolutions/Reynolds-style fields: deal_number and sale_id on sales.
-- These are the correct dedup keys (one deal = one sale, even if multiple lead rows exist).

alter table public.sales
  add column if not exists deal_number text,
  add column if not exists sale_id text,
  add column if not exists front_gross numeric(12,2),
  add column if not exists back_gross numeric(12,2);

-- Uniques: one sale per store per deal_number, one per store per sale_id (when not null).
create unique index if not exists sales_store_deal_uniq
  on public.sales(store_id, deal_number)
  where deal_number is not null and deleted_at is null;

create unique index if not exists sales_store_saleid_uniq
  on public.sales(store_id, sale_id)
  where sale_id is not null and deleted_at is null;
