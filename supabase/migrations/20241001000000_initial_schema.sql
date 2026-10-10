-- =============================================================
-- CampusMart Phase 1 — Initial Schema Migration
-- Source of truth: 04-SUPABASE-DESIGN.md
-- =============================================================

-- ---------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- 2. ENUMS / CHECK CONSTRAINT DOMAINS
-- ---------------------------------------------------------------

-- Product condition
create type public.product_condition as enum (
  'new', 'like_new', 'good', 'fair', 'poor'
);

-- Product transaction mode
create type public.transaction_mode as enum (
  'sell', 'exchange', 'either'
);

-- Product status
create type public.product_status as enum (
  'available', 'reserved', 'sold'
);

-- Request type
create type public.request_type as enum (
  'buy', 'exchange'
);

-- Request status
create type public.request_status as enum (
  'pending', 'accepted', 'rejected', 'cancelled'
);

-- Report reason
create type public.report_reason as enum (
  'misleading_information',
  'prohibited_item',
  'suspected_scam',
  'duplicate_listing',
  'inappropriate_content',
  'other'
);

-- Report status
create type public.report_status as enum (
  'open', 'reviewing', 'resolved', 'dismissed'
);

-- User role
create type public.user_role as enum (
  'student', 'admin'
);

-- Interaction type
create type public.interaction_type as enum (
  'view', 'favourite'
);

-- ---------------------------------------------------------------
-- 3. TABLES
-- ---------------------------------------------------------------

-- --- profiles ---------------------------------------------------
create table public.profiles (
  id              uuid        primary key references auth.users(id) on delete cascade,
  full_name       text        not null check (char_length(full_name) between 2 and 80),
  college         text        not null check (char_length(college) between 2 and 150),
  department      text        check (department is null or char_length(department) <= 100),
  graduation_year smallint    check (graduation_year is null or graduation_year between 1900 and 2100),
  contact_text    text        check (contact_text is null or char_length(contact_text) <= 100),
  avatar_path     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.profiles is 'One-to-one extension of auth.users for student profile data.';

-- --- user_roles -------------------------------------------------
create table public.user_roles (
  user_id    uuid            not null references auth.users(id) on delete cascade,
  role       public.user_role not null,
  created_at timestamptz     not null default now(),
  primary key (user_id, role)
);

comment on table public.user_roles is 'Protected role assignments. Only trusted SQL/admin tooling writes here.';

-- --- categories -------------------------------------------------
create table public.categories (
  id         bigint generated always as identity primary key,
  name       text    not null unique,
  slug       text    not null unique,
  icon_key   text,
  is_active  boolean not null default true,
  sort_order integer not null default 0
);

comment on table public.categories is 'Controlled list of product categories. Public read only.';

-- --- products ---------------------------------------------------
create table public.products (
  id               uuid                     primary key default gen_random_uuid(),
  seller_id        uuid                     not null references public.profiles(id) on delete cascade,
  category_id      bigint                   not null references public.categories(id),
  title            text                     not null check (char_length(title) between 5 and 100),
  description      text                     not null check (char_length(description) between 20 and 2000),
  condition        public.product_condition  not null,
  price            numeric(10,2)            not null check (price > 0),
  age_months       integer                  check (age_months is null or age_months >= 0),
  transaction_mode public.transaction_mode   not null,
  location_text    text                     check (location_text is null or char_length(location_text) <= 120),
  image_path       text                     not null,
  status           public.product_status    not null default 'available',
  is_hidden        boolean                  not null default false,
  created_at       timestamptz              not null default now(),
  updated_at       timestamptz              not null default now()
);

comment on table public.products is 'Marketplace product listings. seller_id must always be set from auth.uid() — never from client input.';

-- Indexes per 04-SUPABASE-DESIGN.md
create index products_created_at_desc_idx  on public.products (created_at desc);
create index products_price_idx            on public.products (price);
create index products_category_id_idx      on public.products (category_id);
create index products_status_idx           on public.products (status);
create index products_seller_id_idx        on public.products (seller_id);
create index products_is_hidden_idx        on public.products (is_hidden);

-- Full-text search column (generated tsvector)
alter table public.products
  add column fts tsvector
    generated always as (
      to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
    ) stored;

create index products_fts_idx on public.products using gin(fts);

-- --- favourites -------------------------------------------------
create table public.favourites (
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  product_id uuid        not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

comment on table public.favourites is 'User saved/favourite products. Unique per (user_id, product_id).';

-- --- product_requests -------------------------------------------
create table public.product_requests (
  id                uuid                   primary key default gen_random_uuid(),
  product_id        uuid                   not null references public.products(id) on delete cascade,
  buyer_id          uuid                   not null references public.profiles(id) on delete cascade,
  request_type      public.request_type    not null,
  message           text                   not null check (char_length(message) between 10 and 500),
  offered_item_text text                   check (offered_item_text is null or char_length(offered_item_text) <= 300),
  status            public.request_status  not null default 'pending',
  created_at        timestamptz            not null default now(),
  updated_at        timestamptz            not null default now()
);

comment on table public.product_requests is 'Buy or exchange interest from buyers. Not a payment or transaction.';
create index product_requests_product_id_idx on public.product_requests (product_id);
create index product_requests_buyer_id_idx   on public.product_requests (buyer_id);

-- --- reports ----------------------------------------------------
create table public.reports (
  id          uuid                  primary key default gen_random_uuid(),
  product_id  uuid                  not null references public.products(id) on delete cascade,
  reporter_id uuid                  not null references public.profiles(id) on delete cascade,
  reason      public.report_reason  not null,
  details     text                  check (details is null or char_length(details) <= 1000),
  status      public.report_status  not null default 'open',
  created_at  timestamptz           not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid                  references public.profiles(id) on delete set null
);

comment on table public.reports is 'Moderation complaints about product listings.';

-- Partial unique index: one open/reviewing report per user per product (REP-01)
create unique index reports_one_open_per_user_product_idx
  on public.reports (reporter_id, product_id)
  where status in ('open', 'reviewing');

create index reports_product_id_idx  on public.reports (product_id);
create index reports_reporter_id_idx on public.reports (reporter_id);
create index reports_status_idx      on public.reports (status);

-- --- interactions -----------------------------------------------
create table public.interactions (
  id               bigint generated always as identity primary key,
  user_id          uuid                    references public.profiles(id) on delete cascade,
  product_id       uuid                    not null references public.products(id) on delete cascade,
  interaction_type public.interaction_type not null,
  created_at       timestamptz             not null default now()
);

comment on table public.interactions is 'Optional event log for future recommendation work. Logging failure must not block primary actions.';
create index interactions_product_id_idx on public.interactions (product_id);
create index interactions_user_id_idx    on public.interactions (user_id);

-- ---------------------------------------------------------------
-- 4. UPDATED_AT TRIGGER
-- ---------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

create trigger product_requests_updated_at
  before update on public.product_requests
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------
-- 5. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, college)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student'),
    coalesce(new.raw_user_meta_data->>'college', 'Unknown College')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- 6. ADMIN HELPER FUNCTION
-- ---------------------------------------------------------------
create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = check_user and role = 'admin'
  );
$$;

-- Revoke public execute; grant only to authenticated and anon roles
revoke execute on function public.is_admin from public;
grant execute on function public.is_admin to authenticated;
grant execute on function public.is_admin to anon;

-- ---------------------------------------------------------------
-- 7. STATISTICS FUNCTION (STAT-01)
-- ---------------------------------------------------------------
create or replace function public.get_marketplace_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'active_listings',     (select count(*) from public.products where status in ('available','reserved') and is_hidden = false),
    'sold_products',       (select count(*) from public.products where status = 'sold' and is_hidden = false),
    'registered_students', (select count(*) from public.profiles),
    'active_categories',   (select count(*) from public.categories where is_active = true)
  );
$$;

revoke execute on function public.get_marketplace_stats from public;
grant execute on function public.get_marketplace_stats to authenticated;
grant execute on function public.get_marketplace_stats to anon;

-- ---------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ---------------------------------------------------------------

-- Enable RLS on all public tables
alter table public.profiles          enable row level security;
alter table public.user_roles        enable row level security;
alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.favourites        enable row level security;
alter table public.product_requests  enable row level security;
alter table public.reports           enable row level security;
alter table public.interactions      enable row level security;

-- ---- profiles RLS ----
-- Anyone can read public profile fields (required for seller summaries on product cards)
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

-- Owners can update only their own profile
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- user_roles RLS ----
-- Users can only read their own role
create policy "user_roles_select_own"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- No insert/update/delete for any client (admin assigns via trusted SQL/Dashboard)

-- ---- categories RLS ----
-- Public read for active categories
create policy "categories_select_active"
  on public.categories for select
  using (is_active = true);

-- ---- products RLS ----
-- Public can read visible (non-hidden) products
create policy "products_select_visible"
  on public.products for select
  using (
    is_hidden = false
    or seller_id = auth.uid()
    or public.is_admin()
  );

-- Authenticated users can insert their own products (seller_id locked to auth.uid())
create policy "products_insert_own"
  on public.products for insert
  to authenticated
  with check (seller_id = auth.uid());

-- Owners can update their own products; cannot change seller_id or is_hidden
create policy "products_update_own"
  on public.products for update
  to authenticated
  using (seller_id = auth.uid())
  with check (
    seller_id = auth.uid()
    and is_hidden = false    -- owners cannot set is_hidden; admin does via separate policy
  );

-- Admin can update any product (including is_hidden)
create policy "products_update_admin"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Owners can delete their own products
create policy "products_delete_own"
  on public.products for delete
  to authenticated
  using (seller_id = auth.uid());

-- Admin can delete any product
create policy "products_delete_admin"
  on public.products for delete
  to authenticated
  using (public.is_admin());

-- ---- favourites RLS ----
-- Users can only see their own favourites
create policy "favourites_select_own"
  on public.favourites for select
  to authenticated
  using (user_id = auth.uid());

-- Users can only insert their own favourites
create policy "favourites_insert_own"
  on public.favourites for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can only delete their own favourites
create policy "favourites_delete_own"
  on public.favourites for delete
  to authenticated
  using (user_id = auth.uid());

-- ---- product_requests RLS ----
-- Buyer can see their own requests; seller can see requests for their products; admin sees all
create policy "requests_select_participant"
  on public.product_requests for select
  to authenticated
  using (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.products p
      where p.id = product_requests.product_id
        and p.seller_id = auth.uid()
    )
    or public.is_admin()
  );

-- Authenticated user can insert a request IF they are NOT the product owner AND product is not sold
create policy "requests_insert_non_owner"
  on public.product_requests for insert
  to authenticated
  with check (
    buyer_id = auth.uid()
    and not exists (
      select 1 from public.products p
      where p.id = product_id
        and p.seller_id = auth.uid()
    )
    and exists (
      select 1 from public.products p
      where p.id = product_id
        and p.status != 'sold'
    )
  );

-- Buyer can update only status to 'cancelled' on their own pending requests
create policy "requests_update_buyer_cancel"
  on public.product_requests for update
  to authenticated
  using (buyer_id = auth.uid())
  with check (
    buyer_id = auth.uid()
    and status = 'cancelled'
  );

-- Seller can accept/reject requests for their products
create policy "requests_update_seller"
  on public.product_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  )
  with check (
    status in ('accepted', 'rejected')
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );

-- Admin can update any request
create policy "requests_update_admin"
  on public.product_requests for update
  to authenticated
  using (public.is_admin());

-- ---- reports RLS ----
-- Reporter can see their own reports; admin sees all
create policy "reports_select_own_or_admin"
  on public.reports for select
  to authenticated
  using (
    reporter_id = auth.uid()
    or public.is_admin()
  );

-- Authenticated non-owners can insert a report
create policy "reports_insert_non_owner"
  on public.reports for insert
  to authenticated
  with check (
    reporter_id = auth.uid()
    and not exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );

-- Admin can update any report
create policy "reports_update_admin"
  on public.reports for update
  to authenticated
  using (public.is_admin());

-- ---- interactions RLS ----
-- Users can insert their own interactions
create policy "interactions_insert_own"
  on public.interactions for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can read their own interactions
create policy "interactions_select_own"
  on public.interactions for select
  to authenticated
  using (user_id = auth.uid());
