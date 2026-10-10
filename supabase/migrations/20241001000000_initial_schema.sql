-- =============================================================
-- CampusMart Phase 1 — Safe & Idempotent Schema Migration
-- Can be safely run on empty OR partially initialized databases
-- =============================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. ENUMS (Created safely if they do not already exist)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'product_condition') then
    create type public.product_condition as enum ('new', 'like_new', 'good', 'fair', 'poor');
  end if;
  if not exists (select 1 from pg_type where typname = 'transaction_mode') then
    create type public.transaction_mode as enum ('sell', 'exchange', 'either');
  end if;
  if not exists (select 1 from pg_type where typname = 'product_status') then
    create type public.product_status as enum ('available', 'reserved', 'sold');
  end if;
  if not exists (select 1 from pg_type where typname = 'request_type') then
    create type public.request_type as enum ('buy', 'exchange');
  end if;
  if not exists (select 1 from pg_type where typname = 'request_status') then
    create type public.request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'report_reason') then
    create type public.report_reason as enum ('misleading_information', 'prohibited_item', 'suspected_scam', 'duplicate_listing', 'inappropriate_content', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('student', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'interaction_type') then
    create type public.interaction_type as enum ('view', 'favourite');
  end if;
end $$;

-- 3. TABLES (CREATE IF NOT EXISTS)

-- --- profiles ---
create table if not exists public.profiles (
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

-- --- user_roles ---
create table if not exists public.user_roles (
  user_id    uuid            not null references auth.users(id) on delete cascade,
  role       public.user_role not null,
  created_at timestamptz     not null default now(),
  primary key (user_id, role)
);

-- --- categories ---
create table if not exists public.categories (
  id         bigint generated always as identity primary key,
  name       text    not null unique,
  slug       text    not null unique,
  icon_key   text,
  is_active  boolean not null default true,
  sort_order integer not null default 0
);

-- --- products ---
create table if not exists public.products (
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

-- --- favourites ---
create table if not exists public.favourites (
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  product_id uuid        not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- --- product_requests ---
create table if not exists public.product_requests (
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

-- --- reports ---
create table if not exists public.reports (
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

-- --- interactions ---
create table if not exists public.interactions (
  id               bigint generated always as identity primary key,
  user_id          uuid                    references public.profiles(id) on delete cascade,
  product_id       uuid                    not null references public.products(id) on delete cascade,
  interaction_type public.interaction_type not null,
  created_at       timestamptz             not null default now()
);

-- Indexes
create index if not exists products_created_at_desc_idx  on public.products (created_at desc);
create index if not exists products_price_idx            on public.products (price);
create index if not exists products_category_id_idx      on public.products (category_id);
create index if not exists products_status_idx           on public.products (status);
create index if not exists products_seller_id_idx        on public.products (seller_id);
create index if not exists products_is_hidden_idx        on public.products (is_hidden);
create index if not exists product_requests_product_id_idx on public.product_requests (product_id);
create index if not exists product_requests_buyer_id_idx   on public.product_requests (buyer_id);
create index if not exists reports_product_id_idx  on public.reports (product_id);
create index if not exists reports_reporter_id_idx on public.reports (reporter_id);
create index if not exists reports_status_idx      on public.reports (status);

-- 4. FUNCTIONS & TRIGGERS
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products for each row execute function public.handle_updated_at();

drop trigger if exists product_requests_updated_at on public.product_requests;
create trigger product_requests_updated_at before update on public.product_requests for each row execute function public.handle_updated_at();

-- Auto-create profile trigger on Auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, college, department)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student'),
    coalesce(new.raw_user_meta_data->>'college', 'Campus'),
    new.raw_user_meta_data->>'department'
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    college = coalesce(excluded.college, public.profiles.college);

  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin helper function
create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = check_user and role = 'admin'
  );
$$;

-- 5. ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.favourites enable row level security;
alter table public.product_requests enable row level security;
alter table public.reports enable row level security;
alter table public.interactions enable row level security;

-- 6. RLS POLICIES (Safe drop + re-create)
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own" on public.user_roles for select using (auth.uid() = user_id);

drop policy if exists "categories_select_active" on public.categories;
create policy "categories_select_active" on public.categories for select using (true);

drop policy if exists "products_select_visible" on public.products;
create policy "products_select_visible" on public.products for select using (is_hidden = false or seller_id = auth.uid() or public.is_admin());

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own" on public.products for insert to authenticated with check (seller_id = auth.uid());

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own" on public.products for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid() and is_hidden = false);

drop policy if exists "products_update_admin" on public.products;
create policy "products_update_admin" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own" on public.products for delete to authenticated using (seller_id = auth.uid());

drop policy if exists "products_delete_admin" on public.products;
create policy "products_delete_admin" on public.products for delete to authenticated using (public.is_admin());

drop policy if exists "favourites_select_own" on public.favourites;
create policy "favourites_select_own" on public.favourites for select to authenticated using (user_id = auth.uid());

drop policy if exists "favourites_insert_own" on public.favourites;
create policy "favourites_insert_own" on public.favourites for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "favourites_delete_own" on public.favourites;
create policy "favourites_delete_own" on public.favourites for delete to authenticated using (user_id = auth.uid());

drop policy if exists "requests_select_participant" on public.product_requests;
create policy "requests_select_participant" on public.product_requests for select to authenticated using (buyer_id = auth.uid() or exists (select 1 from public.products p where p.id = product_requests.product_id and p.seller_id = auth.uid()) or public.is_admin());

drop policy if exists "requests_insert_non_owner" on public.product_requests;
create policy "requests_insert_non_owner" on public.product_requests for insert to authenticated with check (buyer_id = auth.uid() and not exists (select 1 from public.products p where p.id = product_id and p.seller_id = auth.uid()) and exists (select 1 from public.products p where p.id = product_id and p.status != 'sold'));

drop policy if exists "requests_update_buyer_cancel" on public.product_requests;
create policy "requests_update_buyer_cancel" on public.product_requests for update to authenticated using (buyer_id = auth.uid()) with check (buyer_id = auth.uid() and status = 'cancelled');

drop policy if exists "requests_update_seller" on public.product_requests;
create policy "requests_update_seller" on public.product_requests for update to authenticated using (exists (select 1 from public.products p where p.id = product_id and p.seller_id = auth.uid())) with check (status in ('accepted', 'rejected') and exists (select 1 from public.products p where p.id = product_id and p.seller_id = auth.uid()));

drop policy if exists "requests_update_admin" on public.product_requests;
create policy "requests_update_admin" on public.product_requests for update to authenticated using (public.is_admin());

drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin" on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "reports_insert_non_owner" on public.reports;
create policy "reports_insert_non_owner" on public.reports for insert to authenticated with check (reporter_id = auth.uid() and not exists (select 1 from public.products p where p.id = product_id and p.seller_id = auth.uid()));

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports for update to authenticated using (public.is_admin());

drop policy if exists "interactions_insert_own" on public.interactions;
create policy "interactions_insert_own" on public.interactions for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "interactions_select_own" on public.interactions;
create policy "interactions_select_own" on public.interactions for select to authenticated using (user_id = auth.uid());
