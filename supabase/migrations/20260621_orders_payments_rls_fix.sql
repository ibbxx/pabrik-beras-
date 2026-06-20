-- Enable RLS for order-related tables (just in case they are not enabled, or if they are enabled)
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.customers enable row level security;
alter table public.order_items enable row level security;

-- Policies for public.orders
drop policy if exists "Public select orders" on public.orders;
create policy "Public select orders" on public.orders
  for select using (true);

drop policy if exists "Public insert orders" on public.orders;
create policy "Public insert orders" on public.orders
  for insert with check (true);

drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders" on public.orders
  for all using (auth.uid() is not null) with check (auth.uid() is not null);


-- Policies for public.payments
drop policy if exists "Public select payments" on public.payments;
create policy "Public select payments" on public.payments
  for select using (true);

drop policy if exists "Public insert payments" on public.payments;
create policy "Public insert payments" on public.payments
  for insert with check (true);

drop policy if exists "Public update payments" on public.payments;
create policy "Public update payments" on public.payments
  for update using (true) with check (true);

drop policy if exists "Admins manage payments" on public.payments;
create policy "Admins manage payments" on public.payments
  for all using (auth.uid() is not null) with check (auth.uid() is not null);


-- Policies for public.customers
drop policy if exists "Public select customers" on public.customers;
create policy "Public select customers" on public.customers
  for select using (true);

drop policy if exists "Public insert customers" on public.customers;
create policy "Public insert customers" on public.customers
  for insert with check (true);

drop policy if exists "Admins manage customers" on public.customers;
create policy "Admins manage customers" on public.customers
  for all using (auth.uid() is not null) with check (auth.uid() is not null);


-- Policies for public.order_items
drop policy if exists "Public select order_items" on public.order_items;
create policy "Public select order_items" on public.order_items
  for select using (true);

drop policy if exists "Public insert order_items" on public.order_items;
create policy "Public insert order_items" on public.order_items
  for insert with check (true);

drop policy if exists "Admins manage order_items" on public.order_items;
create policy "Admins manage order_items" on public.order_items
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
