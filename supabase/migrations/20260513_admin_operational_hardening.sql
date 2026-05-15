-- Admin operational hardening for the rice factory ecommerce panel.
-- Run this in Supabase SQL Editor after reviewing existing live policies.

create extension if not exists pgcrypto;

create or replace function public.is_active_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select auth.uid() is not null;
$$;

alter table public.products
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id);

alter table public.order_items
  add column if not exists product_name text,
  add column if not exists product_slug text,
  add column if not exists product_image_url text,
  add column if not exists product_unit text,
  add column if not exists product_weight_kg numeric;

alter table public.reseller_applications
  add column if not exists admin_notes text;

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  movement_type text not null,
  quantity numeric not null,
  previous_stock numeric not null,
  new_stock numeric not null,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  table_name text not null,
  record_id uuid,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  invoice_number text not null unique,
  status text not null default 'issued',
  issued_at timestamptz not null default now(),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_status_check') then
    alter table public.orders
      add constraint orders_status_check
      check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'payments_status_check') then
    alter table public.payments
      add constraint payments_status_check
      check (status in ('pending', 'submitted', 'verified', 'rejected'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'products_stock_non_negative') then
    alter table public.products
      add constraint products_stock_non_negative check (stock >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'products_price_positive') then
    alter table public.products
      add constraint products_price_positive check (price > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'order_items_quantity_positive') then
    alter table public.order_items
      add constraint order_items_quantity_positive check (quantity > 0);
  end if;
end $$;

create unique index if not exists products_slug_key on public.products(slug);
create unique index if not exists articles_slug_key on public.articles(slug);
create unique index if not exists orders_order_code_key on public.orders(order_code);
create index if not exists orders_status_created_at_idx on public.orders(status, created_at desc);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists payments_order_id_status_idx on public.payments(order_id, status);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists products_active_featured_idx on public.products(is_active, is_featured, created_at desc);
create index if not exists customers_whatsapp_idx on public.customers(whatsapp);
create index if not exists inventory_movements_product_created_idx on public.inventory_movements(product_id, created_at desc);
create index if not exists audit_logs_table_record_idx on public.audit_logs(table_name, record_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'products_set_updated_at') then
    create trigger products_set_updated_at
      before update on public.products
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'orders_set_updated_at') then
    create trigger orders_set_updated_at
      before update on public.orders
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'payments_set_updated_at') then
    create trigger payments_set_updated_at
      before update on public.payments
      for each row execute function public.set_updated_at();
  end if;
end $$;

create or replace function public.admin_archive_product(product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_active_admin() then
    raise exception 'admin access required';
  end if;

  update public.products
  set is_active = false,
      archived_at = now(),
      archived_by = auth.uid()
  where id = product_id;
end;
$$;

-- Baseline RLS for low-risk public CMS/catalog tables.
alter table public.products enable row level security;
alter table public.faqs enable row level security;
alter table public.articles enable row level security;
alter table public.testimonials enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.audit_logs enable row level security;
alter table public.invoices enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
using (is_active is true and archived_at is null);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
on public.products for all
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "Public can read active faqs" on public.faqs;
create policy "Public can read active faqs"
on public.faqs for select
using (is_active is true);

drop policy if exists "Admins manage faqs" on public.faqs;
create policy "Admins manage faqs"
on public.faqs for all
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "Public can read active articles" on public.articles;
create policy "Public can read active articles"
on public.articles for select
using (is_active is true);

drop policy if exists "Admins manage articles" on public.articles;
create policy "Admins manage articles"
on public.articles for all
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "Public can read active testimonials" on public.testimonials;
create policy "Public can read active testimonials"
on public.testimonials for select
using (is_active is true);

drop policy if exists "Admins manage testimonials" on public.testimonials;
create policy "Admins manage testimonials"
on public.testimonials for all
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select
using (true);

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
on public.site_settings for all
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "Admins read admin profiles" on public.admin_profiles;
create policy "Admins read admin profiles"
on public.admin_profiles for select
using (id = auth.uid() or public.is_active_admin());

drop policy if exists "Admins manage inventory movements" on public.inventory_movements;
create policy "Admins manage inventory movements"
on public.inventory_movements for all
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "Admins read audit logs" on public.audit_logs;
create policy "Admins read audit logs"
on public.audit_logs for select
using (public.is_active_admin());

drop policy if exists "Admins manage invoices" on public.invoices;
create policy "Admins manage invoices"
on public.invoices for all
using (public.is_active_admin())
with check (public.is_active_admin());

-- Do not enable RLS for customers/orders/payments/order_items here until checkout
-- and public tracking are moved fully to SECURITY DEFINER RPC functions.
-- Enabling those tables prematurely would break the current client-side checkout.

-- Storage policy names assume buckets product_images and payment_proofs already exist.
drop policy if exists "Public reads product images" on storage.objects;
create policy "Public reads product images"
on storage.objects for select
using (bucket_id = 'product_images');

drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images"
on storage.objects for insert
with check (bucket_id = 'product_images' and public.is_active_admin());

drop policy if exists "Authenticated admins update product images" on storage.objects;
create policy "Authenticated admins update product images"
on storage.objects for update
using (bucket_id = 'product_images' and public.is_active_admin())
with check (bucket_id = 'product_images' and public.is_active_admin());

drop policy if exists "Public uploads payment proofs" on storage.objects;
create policy "Public uploads payment proofs"
on storage.objects for insert
with check (bucket_id = 'payment_proofs');

drop policy if exists "Admins read payment proofs" on storage.objects;
create policy "Admins read payment proofs"
on storage.objects for select
using (bucket_id = 'payment_proofs' and public.is_active_admin());
