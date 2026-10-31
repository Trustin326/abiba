create extension if not exists pgcrypto;
create table if not exists public.contacts(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,name text not null check(char_length(name) between 1 and 160),email text not null check(char_length(email)<=320),company text not null default '',stage text not null default 'Lead' check(stage in('Lead','Qualified','Client')),value numeric(12,2) not null default 0 check(value>=0),created_at timestamptz not null default now());
create table if not exists public.tasks(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,title text not null check(char_length(title) between 1 and 500),due text not null default 'Whenever',priority text not null default 'Medium' check(priority in('Low','Medium','High')),done boolean not null default false,created_at timestamptz not null default now());
create table if not exists public.offers(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,title text not null check(char_length(title) between 1 and 200),category text not null default 'Service',price numeric(12,2) not null default 0 check(price>=0),status text not null default 'Draft' check(status in('Draft','Ready')),created_at timestamptz not null default now());
alter table public.contacts enable row level security;alter table public.tasks enable row level security;alter table public.offers enable row level security;
drop policy if exists "owner contacts" on public.contacts;
create policy "owner contacts" on public.contacts for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "owner tasks" on public.tasks;
create policy "owner tasks" on public.tasks for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "owner offers" on public.offers;
create policy "owner offers" on public.offers for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create index if not exists contacts_owner_created on public.contacts(user_id,created_at desc);create index if not exists tasks_owner_created on public.tasks(user_id,created_at desc);create index if not exists offers_owner_created on public.offers(user_id,created_at desc);
-- Payment records are server-managed only. Never write these from the browser.
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_key text not null,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text unique,
  status text not null check (status in ('pending','paid','failed','refunded','disputed')),
  amount_total integer check (amount_total is null or amount_total >= 0),
  currency text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create table if not exists public.entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null,
  purchase_id uuid not null references public.purchases(id) on delete restrict,
  status text not null check (status in ('active','revoked')),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_key)
);
alter table public.purchases enable row level security;
alter table public.entitlements enable row level security;
-- No client write policies for purchases or entitlements. A trusted server-side
-- Stripe webhook must verify the event and use a server-only service role key.
drop policy if exists "owners read entitlements" on public.entitlements;
create policy "owners read entitlements" on public.entitlements
  for select to authenticated using (auth.uid() = user_id);
create index if not exists purchases_owner_created on public.purchases(user_id, created_at desc);
-- App records are synchronized by the authenticated client under owner-only RLS.
-- Payment records are written only by the trusted server-side webhook.

-- Preserve the minimum purchase ledger if a customer deletes their account.
-- This migration also upgrades projects where the original NOT NULL FK exists.
alter table public.purchases alter column user_id drop not null;
alter table public.purchases drop constraint if exists purchases_user_id_fkey;
alter table public.purchases add constraint purchases_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
