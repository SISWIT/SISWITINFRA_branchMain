-- Full project bootstrap migration for Supabase
-- Covers CRM, CPQ, CLM, ERP, Document Automation, Auth/Roles, RLS, and RPCs.

begin;

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- =====================================================================
-- Core auth-related tables
-- =====================================================================

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  company text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'employee', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.signup_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- CRM tables
-- =====================================================================

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  website text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  annual_revenue numeric(14, 2),
  employee_count integer,
  description text,
  owner_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  mobile text,
  job_title text,
  department text,
  account_id uuid references public.accounts(id) on delete set null,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  description text,
  owner_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_id uuid references public.accounts(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  stage text not null default 'new' check (stage in ('new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  amount numeric(14, 2),
  probability numeric(6, 2),
  expected_revenue numeric(14, 2),
  close_date date,
  lead_source text check (lead_source in ('website', 'referral', 'cold_call', 'advertisement', 'social_media', 'trade_show', 'other')),
  description text,
  next_step text,
  is_closed boolean not null default false,
  is_won boolean not null default false,
  closed_at timestamptz,
  owner_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  company text,
  job_title text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'unqualified', 'converted')),
  source text check (source in ('website', 'referral', 'cold_call', 'advertisement', 'social_media', 'trade_show', 'other')),
  website text,
  industry text,
  annual_revenue numeric(14, 2),
  employee_count integer,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  description text,
  converted_at timestamptz,
  converted_account_id uuid references public.accounts(id) on delete set null,
  converted_contact_id uuid references public.contacts(id) on delete set null,
  converted_opportunity_id uuid references public.opportunities(id) on delete set null,
  owner_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'task' check (type in ('call', 'email', 'meeting', 'task', 'note')),
  subject text not null,
  description text,
  due_date timestamptz,
  completed_at timestamptz,
  is_completed boolean not null default false,
  priority text,
  lead_id uuid references public.leads(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  owner_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- CPQ tables
-- =====================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  description text,
  category text,
  unit_price numeric(14, 2) not null default 0,
  cost_price numeric(14, 2),
  is_active boolean not null default true,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'rejected', 'sent', 'accepted', 'expired')),
  subtotal numeric(14, 2) not null default 0,
  discount_percent numeric(7, 4) not null default 0,
  discount_amount numeric(14, 2) not null default 0,
  tax_percent numeric(7, 4) not null default 0,
  tax_amount numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  valid_until date,
  terms text,
  notes text,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  owner_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  description text,
  quantity numeric(14, 4) not null default 1,
  unit_price numeric(14, 2) not null default 0,
  discount_percent numeric(7, 4) not null default 0,
  total numeric(14, 2) not null default 0,
  sort_order integer not null default 0,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- CLM tables
-- =====================================================================

create table if not exists public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  content text not null,
  is_active boolean not null default true,
  is_public boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  contract_number text,
  name text not null,
  template_id uuid references public.contract_templates(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'pending_approval', 'approved', 'sent', 'signed', 'expired', 'cancelled')),
  content text,
  start_date date,
  end_date date,
  value numeric(14, 2),
  signed_at timestamptz,
  signed_by uuid references auth.users(id) on delete set null,
  owner_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contract_esignatures (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  recipient_email text not null,
  recipient_name text not null,
  status text not null default 'pending' check (status in ('pending', 'signed', 'rejected', 'expired')),
  signed_at timestamptz,
  rejection_reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contract_scans (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  file_path text,
  file_name text,
  content_type text,
  file_size bigint,
  ocr_text text,
  scan_date timestamptz default now(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- ERP tables
-- =====================================================================

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  website text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  payment_terms text,
  rating numeric(4, 2),
  is_active boolean not null default true,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  sku text,
  name text,
  description text,
  category text,
  quantity_on_hand numeric(14, 4) not null default 0,
  quantity_reserved numeric(14, 4) not null default 0,
  quantity_available numeric(14, 4) not null default 0,
  reorder_level numeric(14, 4) not null default 0,
  reorder_quantity numeric(14, 4),
  unit_cost numeric(14, 2),
  warehouse_location text,
  status text default 'in_stock' check (status in ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
  supplier_id uuid references public.suppliers(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_min_identity check (product_id is not null or sku is not null or name is not null)
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text,
  order_number text,
  supplier_id uuid references public.suppliers(id) on delete set null,
  vendor_id uuid references public.accounts(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'ordered', 'received', 'cancelled')),
  order_date date,
  due_date date,
  expected_delivery_date date,
  actual_delivery_date date,
  subtotal numeric(14, 2) not null default 0,
  tax_amount numeric(14, 2) not null default 0,
  shipping_cost numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  total_amount numeric(14, 2) not null default 0,
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_orders_vendor_or_supplier check (supplier_id is not null or vendor_id is not null)
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  item_name text not null,
  description text,
  quantity numeric(14, 4) not null default 1,
  unit_cost numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  sort_order integer not null default 0,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_orders (
  id uuid primary key default gen_random_uuid(),
  production_order_number text,
  order_number text,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  quantity_ordered numeric(14, 4) not null default 0,
  quantity_to_produce numeric(14, 4) not null default 0,
  quantity_produced numeric(14, 4) not null default 0,
  start_date date,
  due_date date,
  completion_date timestamptz,
  completed_at timestamptz,
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_orders_item_or_product check (inventory_item_id is not null or product_id is not null)
);

create table if not exists public.financial_records (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  type text check (type in ('income', 'expense', 'asset', 'liability', 'equity')),
  transaction_type text check (transaction_type in ('income', 'expense', 'asset', 'liability', 'equity')),
  category text,
  description text not null default '',
  amount numeric(14, 2) not null default 0,
  reference_id text,
  reference_type text,
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- Document automation tables
-- =====================================================================

create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('proposal', 'invoice', 'agreement', 'report', 'policy', 'manual', 'other')),
  description text,
  content text not null,
  variables jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  is_public boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.auto_documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('proposal', 'invoice', 'agreement', 'report', 'policy', 'manual', 'other')),
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'approved', 'sent', 'signed', 'rejected', 'expired', 'published', 'archived')),
  content text,
  template_id uuid references public.document_templates(id) on delete set null,
  related_entity_type text,
  related_entity_id text,
  file_path text,
  file_name text,
  format text check (format in ('pdf', 'docx', 'doc', 'xlsx', 'txt', 'html')),
  file_size bigint,
  generated_from text default 'template',
  owner_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.auto_documents(id) on delete cascade,
  version_number integer not null default 1,
  content text,
  file_path text,
  file_name text,
  format text check (format in ('pdf', 'docx', 'doc', 'xlsx', 'txt', 'html')),
  file_size bigint,
  change_summary text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.document_permissions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.auto_documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission_type text not null check (permission_type in ('view', 'edit', 'comment', 'share')),
  shared_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, user_id)
);

create table if not exists public.document_esignatures (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.auto_documents(id) on delete cascade,
  recipient_name text not null,
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending', 'signed', 'rejected', 'expired')),
  signed_at timestamptz,
  rejection_reason text,
  expires_at timestamptz,
  sent_at timestamptz,
  reminder_count integer not null default 0,
  last_reminder_at timestamptz,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- Schema reconciliation for existing deployments
-- Ensures required compatibility columns exist even when tables pre-exist.
-- =====================================================================

alter table if exists public.inventory_items
  add column if not exists product_id uuid references public.products(id) on delete set null,
  add column if not exists sku text,
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists quantity_on_hand numeric(14, 4) default 0,
  add column if not exists quantity_reserved numeric(14, 4) default 0,
  add column if not exists quantity_available numeric(14, 4) default 0,
  add column if not exists reorder_level numeric(14, 4) default 0,
  add column if not exists reorder_quantity numeric(14, 4),
  add column if not exists unit_cost numeric(14, 2),
  add column if not exists warehouse_location text,
  add column if not exists status text,
  add column if not exists supplier_id uuid references public.suppliers(id) on delete set null,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.purchase_orders
  add column if not exists po_number text,
  add column if not exists order_number text,
  add column if not exists supplier_id uuid references public.suppliers(id) on delete set null,
  add column if not exists vendor_id uuid references public.accounts(id) on delete set null,
  add column if not exists status text default 'draft',
  add column if not exists order_date date,
  add column if not exists due_date date,
  add column if not exists expected_delivery_date date,
  add column if not exists actual_delivery_date date,
  add column if not exists subtotal numeric(14, 2) default 0,
  add column if not exists tax_amount numeric(14, 2) default 0,
  add column if not exists shipping_cost numeric(14, 2) default 0,
  add column if not exists total numeric(14, 2) default 0,
  add column if not exists total_amount numeric(14, 2) default 0,
  add column if not exists notes text,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.production_orders
  add column if not exists production_order_number text,
  add column if not exists order_number text,
  add column if not exists inventory_item_id uuid references public.inventory_items(id) on delete set null,
  add column if not exists product_id uuid references public.products(id) on delete set null,
  add column if not exists status text default 'planned',
  add column if not exists quantity_ordered numeric(14, 4) default 0,
  add column if not exists quantity_to_produce numeric(14, 4) default 0,
  add column if not exists quantity_produced numeric(14, 4) default 0,
  add column if not exists start_date date,
  add column if not exists due_date date,
  add column if not exists completion_date timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists notes text,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.financial_records
  add column if not exists transaction_date date default current_date,
  add column if not exists type text,
  add column if not exists transaction_type text,
  add column if not exists category text,
  add column if not exists description text default '',
  add column if not exists amount numeric(14, 2) default 0,
  add column if not exists reference_id text,
  add column if not exists reference_type text,
  add column if not exists notes text,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.document_templates
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.auto_documents
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.document_esignatures
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.contract_templates
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.contracts
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.contract_esignatures
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.contract_scans
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- =====================================================================
-- Utility and compatibility functions/triggers
-- =====================================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select ur.role
  from public.user_roles ur
  where ur.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

create or replace function public.can_access_owned_record(row_owner uuid, row_creator uuid)
returns boolean
language sql
stable
as $$
  select auth.uid() is not null
    and (
      public.is_admin()
      or auth.uid() = row_owner
      or auth.uid() = row_creator
    );
$$;

create or replace function public.can_access_created_record(row_creator uuid)
returns boolean
language sql
stable
as $$
  select auth.uid() is not null
    and (
      public.is_admin()
      or auth.uid() = row_creator
    );
$$;

create or replace function public.sync_opportunity_metrics()
returns trigger
language plpgsql
as $$
begin
  if new.probability is null then
    new.probability := case new.stage
      when 'new' then 10
      when 'qualified' then 25
      when 'proposal' then 50
      when 'negotiation' then 75
      when 'closed_won' then 100
      when 'closed_lost' then 0
      else 0
    end;
  end if;

  if new.expected_revenue is null then
    new.expected_revenue := coalesce(new.amount, 0) * coalesce(new.probability, 0) / 100.0;
  end if;

  if new.stage = 'closed_won' then
    new.is_closed := true;
    new.is_won := true;
    if new.closed_at is null then
      new.closed_at := now();
    end if;
  elsif new.stage = 'closed_lost' then
    new.is_closed := true;
    new.is_won := false;
    if new.closed_at is null then
      new.closed_at := now();
    end if;
  else
    new.is_closed := coalesce(new.is_closed, false);
    if new.is_closed then
      new.is_won := coalesce(new.is_won, false);
      if new.closed_at is null then
        new.closed_at := now();
      end if;
    else
      new.is_won := false;
      new.closed_at := null;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sync_quote_totals()
returns trigger
language plpgsql
as $$
begin
  new.subtotal := coalesce(new.subtotal, 0);
  new.discount_percent := coalesce(new.discount_percent, 0);
  new.tax_percent := coalesce(new.tax_percent, 0);

  if new.discount_amount is null then
    new.discount_amount := round((new.subtotal * new.discount_percent / 100.0)::numeric, 2);
  end if;

  if new.tax_amount is null then
    new.tax_amount := round(((new.subtotal - coalesce(new.discount_amount, 0)) * new.tax_percent / 100.0)::numeric, 2);
  end if;

  if new.total is null then
    new.total := round((new.subtotal - coalesce(new.discount_amount, 0) + coalesce(new.tax_amount, 0))::numeric, 2);
  end if;

  if new.quote_number is null or btrim(new.quote_number) = '' then
    new.quote_number := 'Q-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  end if;

  return new;
end;
$$;

create or replace function public.sync_quote_item_totals()
returns trigger
language plpgsql
as $$
begin
  new.quantity := coalesce(new.quantity, 1);
  new.unit_price := coalesce(new.unit_price, 0);
  new.discount_percent := coalesce(new.discount_percent, 0);
  new.sort_order := coalesce(new.sort_order, 0);
  new.total := round((new.quantity * new.unit_price * (1 - (new.discount_percent / 100.0)))::numeric, 2);
  return new;
end;
$$;

create or replace function public.sync_inventory_item_fields()
returns trigger
language plpgsql
as $$
declare
  p record;
begin
  if new.product_id is not null then
    select pr.name, pr.sku, pr.category, pr.description, pr.unit_price
    into p
    from public.products pr
    where pr.id = new.product_id;

    if found then
      if new.name is null or btrim(new.name) = '' then
        new.name := p.name;
      end if;
      if new.sku is null or btrim(new.sku) = '' then
        new.sku := p.sku;
      end if;
      if new.category is null or btrim(new.category) = '' then
        new.category := p.category;
      end if;
      if new.description is null or btrim(new.description) = '' then
        new.description := p.description;
      end if;
      if new.unit_cost is null then
        new.unit_cost := p.unit_price;
      end if;
    end if;
  end if;

  new.quantity_on_hand := coalesce(new.quantity_on_hand, 0);
  new.quantity_reserved := coalesce(new.quantity_reserved, 0);
  new.quantity_available := new.quantity_on_hand - new.quantity_reserved;

  if new.status is null then
    if new.quantity_on_hand <= 0 then
      new.status := 'out_of_stock';
    elsif new.quantity_on_hand <= coalesce(new.reorder_level, 0) then
      new.status := 'low_stock';
    else
      new.status := 'in_stock';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sync_purchase_order_fields()
returns trigger
language plpgsql
as $$
declare
  mapped_id uuid;
begin
  if (new.order_number is null or btrim(new.order_number) = '') and new.po_number is not null then
    new.order_number := new.po_number;
  end if;

  if (new.po_number is null or btrim(new.po_number) = '') and new.order_number is not null then
    new.po_number := new.order_number;
  end if;

  new.subtotal := coalesce(new.subtotal, 0);
  new.tax_amount := coalesce(new.tax_amount, 0);
  new.shipping_cost := coalesce(new.shipping_cost, 0);

  if new.total is null then
    if new.total_amount is not null then
      new.total := new.total_amount;
    else
      new.total := new.subtotal + new.tax_amount + new.shipping_cost;
    end if;
  end if;

  if new.total_amount is null then
    new.total_amount := new.total;
  end if;

  if new.vendor_id is null and new.supplier_id is not null then
    mapped_id := null;
    select a.id
    into mapped_id
    from public.accounts a
    join public.suppliers s on lower(s.name) = lower(a.name)
    where s.id = new.supplier_id
    limit 1;
    new.vendor_id := mapped_id;
  end if;

  if new.supplier_id is null and new.vendor_id is not null then
    mapped_id := null;
    select s.id
    into mapped_id
    from public.suppliers s
    join public.accounts a on lower(s.name) = lower(a.name)
    where a.id = new.vendor_id
    limit 1;
    new.supplier_id := mapped_id;
  end if;

  return new;
end;
$$;

create or replace function public.sync_purchase_order_item_totals()
returns trigger
language plpgsql
as $$
begin
  new.quantity := coalesce(new.quantity, 1);
  new.unit_cost := coalesce(new.unit_cost, 0);
  new.sort_order := coalesce(new.sort_order, 0);
  new.total := round((new.quantity * new.unit_cost)::numeric, 2);
  return new;
end;
$$;

create or replace function public.sync_production_order_fields()
returns trigger
language plpgsql
as $$
declare
  inv_product_id uuid;
  inv_id uuid;
begin
  if (new.order_number is null or btrim(new.order_number) = '') and new.production_order_number is not null then
    new.order_number := new.production_order_number;
  end if;

  if (new.production_order_number is null or btrim(new.production_order_number) = '') and new.order_number is not null then
    new.production_order_number := new.order_number;
  end if;

  if new.production_order_number is null or btrim(new.production_order_number) = '' then
    new.production_order_number := 'PROD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
    new.order_number := new.production_order_number;
  end if;

  if new.quantity_ordered is null and new.quantity_to_produce is not null then
    new.quantity_ordered := new.quantity_to_produce;
  end if;

  if new.quantity_to_produce is null and new.quantity_ordered is not null then
    new.quantity_to_produce := new.quantity_ordered;
  end if;

  new.quantity_ordered := coalesce(new.quantity_ordered, 0);
  new.quantity_to_produce := coalesce(new.quantity_to_produce, 0);
  new.quantity_produced := coalesce(new.quantity_produced, 0);

  if new.product_id is null and new.inventory_item_id is not null then
    select ii.product_id into inv_product_id
    from public.inventory_items ii
    where ii.id = new.inventory_item_id
    limit 1;
    new.product_id := inv_product_id;
  end if;

  if new.inventory_item_id is null and new.product_id is not null then
    select ii.id into inv_id
    from public.inventory_items ii
    where ii.product_id = new.product_id
    order by ii.created_at desc
    limit 1;
    new.inventory_item_id := inv_id;
  end if;

  if new.status = 'completed' then
    if new.completion_date is null then
      new.completion_date := now();
    end if;
    if new.completed_at is null then
      new.completed_at := new.completion_date;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sync_financial_record_types()
returns trigger
language plpgsql
as $$
begin
  if new.type is null and new.transaction_type is not null then
    new.type := new.transaction_type;
  end if;

  if new.transaction_type is null and new.type is not null then
    new.transaction_type := new.type;
  end if;

  if new.type is null and new.transaction_type is null then
    new.type := 'expense';
    new.transaction_type := 'expense';
  end if;

  new.description := coalesce(new.description, '');
  new.amount := coalesce(new.amount, 0);
  new.transaction_date := coalesce(new.transaction_date, current_date);

  return new;
end;
$$;

create or replace function public.sync_document_status_from_signatures()
returns trigger
language plpgsql
as $$
declare
  target_document_id uuid;
  statuses text[];
  all_signed boolean;
  next_status text;
begin
  if tg_op = 'DELETE' then
    target_document_id := old.document_id;
  else
    target_document_id := new.document_id;
  end if;

  if target_document_id is null then
    return null;
  end if;

  select array_agg(des.status)
  into statuses
  from public.document_esignatures des
  where des.document_id = target_document_id;

  if statuses is null or array_length(statuses, 1) is null then
    return null;
  end if;

  if 'pending' = any(statuses) then
    next_status := 'sent';
  elsif 'rejected' = any(statuses) then
    next_status := 'rejected';
  elsif 'expired' = any(statuses) then
    next_status := 'expired';
  else
    select bool_and(sig_status = 'signed')
    into all_signed
    from unnest(statuses) as sig_status;

    if coalesce(all_signed, false) then
      next_status := 'signed';
    end if;
  end if;

  if next_status is not null then
    update public.auto_documents
    set status = next_status
    where id = target_document_id;
  end if;

  return null;
end;
$$;

create or replace function public.sync_signup_request_status_from_role()
returns trigger
language plpgsql
as $$
begin
  delete from public.signup_requests
  where user_id = new.user_id;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_name_value text;
  last_name_value text;
begin
  first_name_value := nullif(new.raw_user_meta_data ->> 'first_name', '');
  last_name_value := nullif(new.raw_user_meta_data ->> 'last_name', '');

  insert into public.profiles (user_id, first_name, last_name)
  values (new.id, first_name_value, last_name_value)
  on conflict (user_id)
  do update
  set first_name = excluded.first_name,
      last_name = excluded.last_name,
      updated_at = now();

  if not exists (select 1 from public.user_roles) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id) do nothing;
  else
    insert into public.signup_requests (user_id, email, first_name, last_name, status)
    values (new.id, new.email, first_name_value, last_name_value, 'pending')
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

-- =====================================================================
-- Triggers
-- =====================================================================

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists set_user_roles_updated_at on public.user_roles;
create trigger set_user_roles_updated_at
before update on public.user_roles
for each row execute function public.touch_updated_at();

drop trigger if exists set_signup_requests_updated_at on public.signup_requests;
create trigger set_signup_requests_updated_at
before update on public.signup_requests
for each row execute function public.touch_updated_at();

drop trigger if exists set_accounts_updated_at on public.accounts;
create trigger set_accounts_updated_at
before update on public.accounts
for each row execute function public.touch_updated_at();

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
before update on public.contacts
for each row execute function public.touch_updated_at();

drop trigger if exists set_opportunities_updated_at on public.opportunities;
create trigger set_opportunities_updated_at
before update on public.opportunities
for each row execute function public.touch_updated_at();

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.touch_updated_at();

drop trigger if exists set_activities_updated_at on public.activities;
create trigger set_activities_updated_at
before update on public.activities
for each row execute function public.touch_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists set_quotes_updated_at on public.quotes;
create trigger set_quotes_updated_at
before update on public.quotes
for each row execute function public.touch_updated_at();

drop trigger if exists set_quote_items_updated_at on public.quote_items;
create trigger set_quote_items_updated_at
before update on public.quote_items
for each row execute function public.touch_updated_at();

drop trigger if exists set_contract_templates_updated_at on public.contract_templates;
create trigger set_contract_templates_updated_at
before update on public.contract_templates
for each row execute function public.touch_updated_at();

drop trigger if exists set_contracts_updated_at on public.contracts;
create trigger set_contracts_updated_at
before update on public.contracts
for each row execute function public.touch_updated_at();

drop trigger if exists set_contract_esignatures_updated_at on public.contract_esignatures;
create trigger set_contract_esignatures_updated_at
before update on public.contract_esignatures
for each row execute function public.touch_updated_at();

drop trigger if exists set_contract_scans_updated_at on public.contract_scans;
create trigger set_contract_scans_updated_at
before update on public.contract_scans
for each row execute function public.touch_updated_at();

drop trigger if exists set_suppliers_updated_at on public.suppliers;
create trigger set_suppliers_updated_at
before update on public.suppliers
for each row execute function public.touch_updated_at();

drop trigger if exists set_inventory_items_updated_at on public.inventory_items;
create trigger set_inventory_items_updated_at
before update on public.inventory_items
for each row execute function public.touch_updated_at();

drop trigger if exists set_purchase_orders_updated_at on public.purchase_orders;
create trigger set_purchase_orders_updated_at
before update on public.purchase_orders
for each row execute function public.touch_updated_at();

drop trigger if exists set_purchase_order_items_updated_at on public.purchase_order_items;
create trigger set_purchase_order_items_updated_at
before update on public.purchase_order_items
for each row execute function public.touch_updated_at();

drop trigger if exists set_production_orders_updated_at on public.production_orders;
create trigger set_production_orders_updated_at
before update on public.production_orders
for each row execute function public.touch_updated_at();

drop trigger if exists set_financial_records_updated_at on public.financial_records;
create trigger set_financial_records_updated_at
before update on public.financial_records
for each row execute function public.touch_updated_at();

drop trigger if exists set_document_templates_updated_at on public.document_templates;
create trigger set_document_templates_updated_at
before update on public.document_templates
for each row execute function public.touch_updated_at();

drop trigger if exists set_auto_documents_updated_at on public.auto_documents;
create trigger set_auto_documents_updated_at
before update on public.auto_documents
for each row execute function public.touch_updated_at();

drop trigger if exists set_document_esignatures_updated_at on public.document_esignatures;
create trigger set_document_esignatures_updated_at
before update on public.document_esignatures
for each row execute function public.touch_updated_at();

drop trigger if exists trg_sync_opportunity_metrics on public.opportunities;
create trigger trg_sync_opportunity_metrics
before insert or update on public.opportunities
for each row execute function public.sync_opportunity_metrics();

drop trigger if exists trg_sync_quote_totals on public.quotes;
create trigger trg_sync_quote_totals
before insert or update on public.quotes
for each row execute function public.sync_quote_totals();

drop trigger if exists trg_sync_quote_item_totals on public.quote_items;
create trigger trg_sync_quote_item_totals
before insert or update on public.quote_items
for each row execute function public.sync_quote_item_totals();

drop trigger if exists trg_sync_inventory_items on public.inventory_items;
create trigger trg_sync_inventory_items
before insert or update on public.inventory_items
for each row execute function public.sync_inventory_item_fields();

drop trigger if exists trg_sync_purchase_orders on public.purchase_orders;
create trigger trg_sync_purchase_orders
before insert or update on public.purchase_orders
for each row execute function public.sync_purchase_order_fields();

drop trigger if exists trg_sync_purchase_order_items on public.purchase_order_items;
create trigger trg_sync_purchase_order_items
before insert or update on public.purchase_order_items
for each row execute function public.sync_purchase_order_item_totals();

drop trigger if exists trg_sync_production_orders on public.production_orders;
create trigger trg_sync_production_orders
before insert or update on public.production_orders
for each row execute function public.sync_production_order_fields();

drop trigger if exists trg_sync_financial_records on public.financial_records;
create trigger trg_sync_financial_records
before insert or update on public.financial_records
for each row execute function public.sync_financial_record_types();

drop trigger if exists trg_sync_document_status_from_esigs on public.document_esignatures;
create trigger trg_sync_document_status_from_esigs
after insert or update or delete on public.document_esignatures
for each row execute function public.sync_document_status_from_signatures();

drop trigger if exists trg_cleanup_signup_requests on public.user_roles;
create trigger trg_cleanup_signup_requests
after insert or update on public.user_roles
for each row execute function public.sync_signup_request_status_from_role();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =====================================================================
-- RPC functions used by dashboard
-- =====================================================================

create or replace function public.get_inventory_value()
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(
    sum(
      coalesce(ii.quantity_on_hand, 0) * coalesce(ii.unit_cost, p.unit_price, 0)
    ),
    0
  )
  from public.inventory_items ii
  left join public.products p on p.id = ii.product_id
  where public.is_admin() or ii.created_by = auth.uid();
$$;

create or replace function public.get_revenue_mtd(start_date date default date_trunc('month', now())::date, end_date date default now()::date)
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(sum(fr.amount), 0)
  from public.financial_records fr
  where fr.transaction_date between coalesce(start_date, date_trunc('month', now())::date) and coalesce(end_date, now()::date)
    and coalesce(fr.transaction_type, fr.type) = 'income'
    and (public.is_admin() or fr.created_by = auth.uid());
$$;

grant execute on function public.get_inventory_value() to authenticated;
grant execute on function public.get_revenue_mtd(date, date) to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- =====================================================================
-- Indexes
-- =====================================================================

create index if not exists idx_signup_requests_status on public.signup_requests(status);
create index if not exists idx_profiles_user_id on public.profiles(user_id);

create index if not exists idx_accounts_owner_created on public.accounts(owner_id, created_by);
create index if not exists idx_contacts_account_id on public.contacts(account_id);
create index if not exists idx_contacts_owner_created on public.contacts(owner_id, created_by);
create index if not exists idx_opportunities_account_id on public.opportunities(account_id);
create index if not exists idx_opportunities_stage on public.opportunities(stage);
create index if not exists idx_opportunities_owner_created on public.opportunities(owner_id, created_by);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_owner_created on public.leads(owner_id, created_by);
create index if not exists idx_activities_owner_created on public.activities(owner_id, created_by);
create index if not exists idx_activities_opportunity_id on public.activities(opportunity_id);

create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_products_sku on public.products(sku);
create index if not exists idx_quotes_owner_created on public.quotes(owner_id, created_by);
create index if not exists idx_quotes_status on public.quotes(status);
create index if not exists idx_quotes_account_id on public.quotes(account_id);
create index if not exists idx_quote_items_quote_id on public.quote_items(quote_id);
create index if not exists idx_quote_items_product_id on public.quote_items(product_id);

create index if not exists idx_contract_templates_creator_public on public.contract_templates(created_by, is_public);
create index if not exists idx_contracts_owner_created on public.contracts(owner_id, created_by);
create index if not exists idx_contracts_status on public.contracts(status);
create index if not exists idx_contracts_account_id on public.contracts(account_id);
create index if not exists idx_contract_esignatures_contract_id on public.contract_esignatures(contract_id);
create index if not exists idx_contract_esignatures_status on public.contract_esignatures(status);
create index if not exists idx_contract_scans_contract_id on public.contract_scans(contract_id);

create index if not exists idx_suppliers_active on public.suppliers(is_active);
create index if not exists idx_inventory_items_creator on public.inventory_items(created_by);
create index if not exists idx_inventory_items_product_id on public.inventory_items(product_id);
create index if not exists idx_inventory_items_status on public.inventory_items(status);
create index if not exists idx_purchase_orders_creator on public.purchase_orders(created_by);
create index if not exists idx_purchase_orders_status on public.purchase_orders(status);
create index if not exists idx_purchase_orders_vendor_id on public.purchase_orders(vendor_id);
create index if not exists idx_purchase_orders_supplier_id on public.purchase_orders(supplier_id);
create index if not exists idx_purchase_order_items_po_id on public.purchase_order_items(purchase_order_id);
create index if not exists idx_production_orders_creator on public.production_orders(created_by);
create index if not exists idx_production_orders_status on public.production_orders(status);
create index if not exists idx_production_orders_product_id on public.production_orders(product_id);
create index if not exists idx_financial_records_creator on public.financial_records(created_by);
create index if not exists idx_financial_records_date on public.financial_records(transaction_date);
create index if not exists idx_financial_records_transaction_type on public.financial_records(transaction_type);

create index if not exists idx_document_templates_creator_public on public.document_templates(created_by, is_public);
create index if not exists idx_auto_documents_owner_created on public.auto_documents(owner_id, created_by);
create index if not exists idx_auto_documents_status on public.auto_documents(status);
create index if not exists idx_auto_documents_template_id on public.auto_documents(template_id);
create index if not exists idx_document_versions_document_id on public.document_versions(document_id);
create index if not exists idx_document_permissions_document_id on public.document_permissions(document_id);
create index if not exists idx_document_permissions_user_id on public.document_permissions(user_id);
create index if not exists idx_document_esignatures_document_id on public.document_esignatures(document_id);
create index if not exists idx_document_esignatures_status on public.document_esignatures(status);

-- =====================================================================
-- RLS
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.signup_requests enable row level security;
alter table public.accounts enable row level security;
alter table public.contacts enable row level security;
alter table public.opportunities enable row level security;
alter table public.leads enable row level security;
alter table public.activities enable row level security;
alter table public.products enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.contract_templates enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_esignatures enable row level security;
alter table public.contract_scans enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory_items enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.production_orders enable row level security;
alter table public.financial_records enable row level security;
alter table public.document_templates enable row level security;
alter table public.auto_documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_permissions enable row level security;
alter table public.document_esignatures enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "profiles_insert_own_or_admin" on public.profiles;
create policy "profiles_insert_own_or_admin"
on public.profiles for insert
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

-- user_roles
drop policy if exists "user_roles_select_own_or_admin" on public.user_roles;
create policy "user_roles_select_own_or_admin"
on public.user_roles for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "user_roles_admin_insert" on public.user_roles;
create policy "user_roles_admin_insert"
on public.user_roles for insert
with check (public.is_admin());

drop policy if exists "user_roles_admin_update" on public.user_roles;
create policy "user_roles_admin_update"
on public.user_roles for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "user_roles_admin_delete" on public.user_roles;
create policy "user_roles_admin_delete"
on public.user_roles for delete
using (public.is_admin());

-- signup_requests
drop policy if exists "signup_requests_select_own_or_admin" on public.signup_requests;
create policy "signup_requests_select_own_or_admin"
on public.signup_requests for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "signup_requests_insert_own_or_admin" on public.signup_requests;
create policy "signup_requests_insert_own_or_admin"
on public.signup_requests for insert
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "signup_requests_admin_update" on public.signup_requests;
create policy "signup_requests_admin_update"
on public.signup_requests for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "signup_requests_admin_delete" on public.signup_requests;
create policy "signup_requests_admin_delete"
on public.signup_requests for delete
using (public.is_admin());

-- owner/creator scoped entities
drop policy if exists "accounts_select_scope" on public.accounts;
create policy "accounts_select_scope" on public.accounts for select
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "accounts_insert_scope" on public.accounts;
create policy "accounts_insert_scope" on public.accounts for insert
with check (
  auth.uid() is not null and (
    public.is_admin()
    or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
  )
);

drop policy if exists "accounts_update_scope" on public.accounts;
create policy "accounts_update_scope" on public.accounts for update
using (public.can_access_owned_record(owner_id, created_by))
with check (
  public.is_admin()
  or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "accounts_delete_scope" on public.accounts;
create policy "accounts_delete_scope" on public.accounts for delete
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "contacts_select_scope" on public.contacts;
create policy "contacts_select_scope" on public.contacts for select
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "contacts_insert_scope" on public.contacts;
create policy "contacts_insert_scope" on public.contacts for insert
with check (
  auth.uid() is not null and (
    public.is_admin()
    or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
  )
);

drop policy if exists "contacts_update_scope" on public.contacts;
create policy "contacts_update_scope" on public.contacts for update
using (public.can_access_owned_record(owner_id, created_by))
with check (
  public.is_admin()
  or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "contacts_delete_scope" on public.contacts;
create policy "contacts_delete_scope" on public.contacts for delete
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "opportunities_select_scope" on public.opportunities;
create policy "opportunities_select_scope" on public.opportunities for select
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "opportunities_insert_scope" on public.opportunities;
create policy "opportunities_insert_scope" on public.opportunities for insert
with check (
  auth.uid() is not null and (
    public.is_admin()
    or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
  )
);

drop policy if exists "opportunities_update_scope" on public.opportunities;
create policy "opportunities_update_scope" on public.opportunities for update
using (public.can_access_owned_record(owner_id, created_by))
with check (
  public.is_admin()
  or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "opportunities_delete_scope" on public.opportunities;
create policy "opportunities_delete_scope" on public.opportunities for delete
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "leads_select_scope" on public.leads;
create policy "leads_select_scope" on public.leads for select
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "leads_insert_scope" on public.leads;
create policy "leads_insert_scope" on public.leads for insert
with check (
  auth.uid() is not null and (
    public.is_admin()
    or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
  )
);

drop policy if exists "leads_update_scope" on public.leads;
create policy "leads_update_scope" on public.leads for update
using (public.can_access_owned_record(owner_id, created_by))
with check (
  public.is_admin()
  or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "leads_delete_scope" on public.leads;
create policy "leads_delete_scope" on public.leads for delete
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "activities_select_scope" on public.activities;
create policy "activities_select_scope" on public.activities for select
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "activities_insert_scope" on public.activities;
create policy "activities_insert_scope" on public.activities for insert
with check (
  auth.uid() is not null and (
    public.is_admin()
    or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
  )
);

drop policy if exists "activities_update_scope" on public.activities;
create policy "activities_update_scope" on public.activities for update
using (public.can_access_owned_record(owner_id, created_by))
with check (
  public.is_admin()
  or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "activities_delete_scope" on public.activities;
create policy "activities_delete_scope" on public.activities for delete
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "quotes_select_scope" on public.quotes;
create policy "quotes_select_scope" on public.quotes for select
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "quotes_insert_scope" on public.quotes;
create policy "quotes_insert_scope" on public.quotes for insert
with check (
  auth.uid() is not null and (
    public.is_admin()
    or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
  )
);

drop policy if exists "quotes_update_scope" on public.quotes;
create policy "quotes_update_scope" on public.quotes for update
using (public.can_access_owned_record(owner_id, created_by))
with check (
  public.is_admin()
  or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "quotes_delete_scope" on public.quotes;
create policy "quotes_delete_scope" on public.quotes for delete
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "contracts_select_scope" on public.contracts;
create policy "contracts_select_scope" on public.contracts for select
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "contracts_insert_scope" on public.contracts;
create policy "contracts_insert_scope" on public.contracts for insert
with check (
  auth.uid() is not null and (
    public.is_admin()
    or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
  )
);

drop policy if exists "contracts_update_scope" on public.contracts;
create policy "contracts_update_scope" on public.contracts for update
using (public.can_access_owned_record(owner_id, created_by))
with check (
  public.is_admin()
  or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "contracts_delete_scope" on public.contracts;
create policy "contracts_delete_scope" on public.contracts for delete
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "auto_documents_select_scope" on public.auto_documents;
create policy "auto_documents_select_scope" on public.auto_documents for select
using (public.can_access_owned_record(owner_id, created_by));

drop policy if exists "auto_documents_insert_scope" on public.auto_documents;
create policy "auto_documents_insert_scope" on public.auto_documents for insert
with check (
  auth.uid() is not null and (
    public.is_admin()
    or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
  )
);

drop policy if exists "auto_documents_update_scope" on public.auto_documents;
create policy "auto_documents_update_scope" on public.auto_documents for update
using (public.can_access_owned_record(owner_id, created_by))
with check (
  public.is_admin()
  or (coalesce(owner_id, auth.uid()) = auth.uid() and coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "auto_documents_delete_scope" on public.auto_documents;
create policy "auto_documents_delete_scope" on public.auto_documents for delete
using (public.can_access_owned_record(owner_id, created_by));

-- templates
drop policy if exists "contract_templates_select_scope" on public.contract_templates;
create policy "contract_templates_select_scope" on public.contract_templates for select
using (is_public or created_by = auth.uid() or public.is_admin());

drop policy if exists "contract_templates_insert_scope" on public.contract_templates;
create policy "contract_templates_insert_scope" on public.contract_templates for insert
with check (
  auth.uid() is not null
  and (public.is_admin() or coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "contract_templates_update_scope" on public.contract_templates;
create policy "contract_templates_update_scope" on public.contract_templates for update
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "contract_templates_delete_scope" on public.contract_templates;
create policy "contract_templates_delete_scope" on public.contract_templates for delete
using (created_by = auth.uid() or public.is_admin());

drop policy if exists "document_templates_select_scope" on public.document_templates;
create policy "document_templates_select_scope" on public.document_templates for select
using (is_public or created_by = auth.uid() or public.is_admin());

drop policy if exists "document_templates_insert_scope" on public.document_templates;
create policy "document_templates_insert_scope" on public.document_templates for insert
with check (
  auth.uid() is not null
  and (public.is_admin() or coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "document_templates_update_scope" on public.document_templates;
create policy "document_templates_update_scope" on public.document_templates for update
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "document_templates_delete_scope" on public.document_templates;
create policy "document_templates_delete_scope" on public.document_templates for delete
using (created_by = auth.uid() or public.is_admin());

-- products/suppliers
drop policy if exists "products_select_authenticated" on public.products;
create policy "products_select_authenticated" on public.products for select
using (auth.uid() is not null);

drop policy if exists "products_insert_scope" on public.products;
create policy "products_insert_scope" on public.products for insert
with check (
  auth.uid() is not null
  and (public.is_admin() or coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "products_update_scope" on public.products;
create policy "products_update_scope" on public.products for update
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "products_delete_scope" on public.products;
create policy "products_delete_scope" on public.products for delete
using (created_by = auth.uid() or public.is_admin());

drop policy if exists "suppliers_select_authenticated" on public.suppliers;
create policy "suppliers_select_authenticated" on public.suppliers for select
using (auth.uid() is not null);

drop policy if exists "suppliers_insert_scope" on public.suppliers;
create policy "suppliers_insert_scope" on public.suppliers for insert
with check (
  auth.uid() is not null
  and (public.is_admin() or coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "suppliers_update_scope" on public.suppliers;
create policy "suppliers_update_scope" on public.suppliers for update
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "suppliers_delete_scope" on public.suppliers;
create policy "suppliers_delete_scope" on public.suppliers for delete
using (created_by = auth.uid() or public.is_admin());

-- created_by scoped ERP entities
drop policy if exists "inventory_items_select_scope" on public.inventory_items;
create policy "inventory_items_select_scope" on public.inventory_items for select
using (public.can_access_created_record(created_by));

drop policy if exists "inventory_items_insert_scope" on public.inventory_items;
create policy "inventory_items_insert_scope" on public.inventory_items for insert
with check (
  auth.uid() is not null
  and (public.is_admin() or coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "inventory_items_update_scope" on public.inventory_items;
create policy "inventory_items_update_scope" on public.inventory_items for update
using (public.can_access_created_record(created_by))
with check (public.is_admin() or coalesce(created_by, auth.uid()) = auth.uid());

drop policy if exists "inventory_items_delete_scope" on public.inventory_items;
create policy "inventory_items_delete_scope" on public.inventory_items for delete
using (public.can_access_created_record(created_by));

drop policy if exists "purchase_orders_select_scope" on public.purchase_orders;
create policy "purchase_orders_select_scope" on public.purchase_orders for select
using (public.can_access_created_record(created_by));

drop policy if exists "purchase_orders_insert_scope" on public.purchase_orders;
create policy "purchase_orders_insert_scope" on public.purchase_orders for insert
with check (
  auth.uid() is not null
  and (public.is_admin() or coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "purchase_orders_update_scope" on public.purchase_orders;
create policy "purchase_orders_update_scope" on public.purchase_orders for update
using (public.can_access_created_record(created_by))
with check (public.is_admin() or coalesce(created_by, auth.uid()) = auth.uid());

drop policy if exists "purchase_orders_delete_scope" on public.purchase_orders;
create policy "purchase_orders_delete_scope" on public.purchase_orders for delete
using (public.can_access_created_record(created_by));

drop policy if exists "production_orders_select_scope" on public.production_orders;
create policy "production_orders_select_scope" on public.production_orders for select
using (public.can_access_created_record(created_by));

drop policy if exists "production_orders_insert_scope" on public.production_orders;
create policy "production_orders_insert_scope" on public.production_orders for insert
with check (
  auth.uid() is not null
  and (public.is_admin() or coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "production_orders_update_scope" on public.production_orders;
create policy "production_orders_update_scope" on public.production_orders for update
using (public.can_access_created_record(created_by))
with check (public.is_admin() or coalesce(created_by, auth.uid()) = auth.uid());

drop policy if exists "production_orders_delete_scope" on public.production_orders;
create policy "production_orders_delete_scope" on public.production_orders for delete
using (public.can_access_created_record(created_by));

drop policy if exists "financial_records_select_scope" on public.financial_records;
create policy "financial_records_select_scope" on public.financial_records for select
using (public.can_access_created_record(created_by));

drop policy if exists "financial_records_insert_scope" on public.financial_records;
create policy "financial_records_insert_scope" on public.financial_records for insert
with check (
  auth.uid() is not null
  and (public.is_admin() or coalesce(created_by, auth.uid()) = auth.uid())
);

drop policy if exists "financial_records_update_scope" on public.financial_records;
create policy "financial_records_update_scope" on public.financial_records for update
using (public.can_access_created_record(created_by))
with check (public.is_admin() or coalesce(created_by, auth.uid()) = auth.uid());

drop policy if exists "financial_records_delete_scope" on public.financial_records;
create policy "financial_records_delete_scope" on public.financial_records for delete
using (public.can_access_created_record(created_by));

-- quote items via parent quote
drop policy if exists "quote_items_select_scope" on public.quote_items;
create policy "quote_items_select_scope" on public.quote_items for select
using (
  exists (
    select 1
    from public.quotes q
    where q.id = quote_items.quote_id
      and public.can_access_owned_record(q.owner_id, q.created_by)
  )
);

drop policy if exists "quote_items_insert_scope" on public.quote_items;
create policy "quote_items_insert_scope" on public.quote_items for insert
with check (
  exists (
    select 1
    from public.quotes q
    where q.id = quote_items.quote_id
      and public.can_access_owned_record(q.owner_id, q.created_by)
  )
);

drop policy if exists "quote_items_update_scope" on public.quote_items;
create policy "quote_items_update_scope" on public.quote_items for update
using (
  exists (
    select 1
    from public.quotes q
    where q.id = quote_items.quote_id
      and public.can_access_owned_record(q.owner_id, q.created_by)
  )
)
with check (
  exists (
    select 1
    from public.quotes q
    where q.id = quote_items.quote_id
      and public.can_access_owned_record(q.owner_id, q.created_by)
  )
);

drop policy if exists "quote_items_delete_scope" on public.quote_items;
create policy "quote_items_delete_scope" on public.quote_items for delete
using (
  exists (
    select 1
    from public.quotes q
    where q.id = quote_items.quote_id
      and public.can_access_owned_record(q.owner_id, q.created_by)
  )
);

-- contract child entities via parent contract
drop policy if exists "contract_esignatures_select_scope" on public.contract_esignatures;
create policy "contract_esignatures_select_scope" on public.contract_esignatures for select
using (
  exists (
    select 1
    from public.contracts c
    where c.id = contract_esignatures.contract_id
      and public.can_access_owned_record(c.owner_id, c.created_by)
  )
);

drop policy if exists "contract_esignatures_insert_scope" on public.contract_esignatures;
create policy "contract_esignatures_insert_scope" on public.contract_esignatures for insert
with check (
  exists (
    select 1
    from public.contracts c
    where c.id = contract_esignatures.contract_id
      and public.can_access_owned_record(c.owner_id, c.created_by)
  )
);

drop policy if exists "contract_esignatures_update_scope" on public.contract_esignatures;
create policy "contract_esignatures_update_scope" on public.contract_esignatures for update
using (
  exists (
    select 1
    from public.contracts c
    where c.id = contract_esignatures.contract_id
      and public.can_access_owned_record(c.owner_id, c.created_by)
  )
)
with check (
  exists (
    select 1
    from public.contracts c
    where c.id = contract_esignatures.contract_id
      and public.can_access_owned_record(c.owner_id, c.created_by)
  )
);

drop policy if exists "contract_esignatures_delete_scope" on public.contract_esignatures;
create policy "contract_esignatures_delete_scope" on public.contract_esignatures for delete
using (
  exists (
    select 1
    from public.contracts c
    where c.id = contract_esignatures.contract_id
      and public.can_access_owned_record(c.owner_id, c.created_by)
  )
);

drop policy if exists "contract_scans_select_scope" on public.contract_scans;
create policy "contract_scans_select_scope" on public.contract_scans for select
using (
  exists (
    select 1
    from public.contracts c
    where c.id = contract_scans.contract_id
      and public.can_access_owned_record(c.owner_id, c.created_by)
  )
);

drop policy if exists "contract_scans_insert_scope" on public.contract_scans;
create policy "contract_scans_insert_scope" on public.contract_scans for insert
with check (
  exists (
    select 1
    from public.contracts c
    where c.id = contract_scans.contract_id
      and public.can_access_owned_record(c.owner_id, c.created_by)
  )
);

drop policy if exists "contract_scans_update_scope" on public.contract_scans;
create policy "contract_scans_update_scope" on public.contract_scans for update
using (
  exists (
    select 1
    from public.contracts c
    where c.id = contract_scans.contract_id
      and public.can_access_owned_record(c.owner_id, c.created_by)
  )
)
with check (
  exists (
    select 1
    from public.contracts c
    where c.id = contract_scans.contract_id
      and public.can_access_owned_record(c.owner_id, c.created_by)
  )
);

drop policy if exists "contract_scans_delete_scope" on public.contract_scans;
create policy "contract_scans_delete_scope" on public.contract_scans for delete
using (
  exists (
    select 1
    from public.contracts c
    where c.id = contract_scans.contract_id
      and public.can_access_owned_record(c.owner_id, c.created_by)
  )
);

-- purchase order items via parent order
drop policy if exists "purchase_order_items_select_scope" on public.purchase_order_items;
create policy "purchase_order_items_select_scope" on public.purchase_order_items for select
using (
  exists (
    select 1
    from public.purchase_orders po
    where po.id = purchase_order_items.purchase_order_id
      and public.can_access_created_record(po.created_by)
  )
);

drop policy if exists "purchase_order_items_insert_scope" on public.purchase_order_items;
create policy "purchase_order_items_insert_scope" on public.purchase_order_items for insert
with check (
  exists (
    select 1
    from public.purchase_orders po
    where po.id = purchase_order_items.purchase_order_id
      and public.can_access_created_record(po.created_by)
  )
);

drop policy if exists "purchase_order_items_update_scope" on public.purchase_order_items;
create policy "purchase_order_items_update_scope" on public.purchase_order_items for update
using (
  exists (
    select 1
    from public.purchase_orders po
    where po.id = purchase_order_items.purchase_order_id
      and public.can_access_created_record(po.created_by)
  )
)
with check (
  exists (
    select 1
    from public.purchase_orders po
    where po.id = purchase_order_items.purchase_order_id
      and public.can_access_created_record(po.created_by)
  )
);

drop policy if exists "purchase_order_items_delete_scope" on public.purchase_order_items;
create policy "purchase_order_items_delete_scope" on public.purchase_order_items for delete
using (
  exists (
    select 1
    from public.purchase_orders po
    where po.id = purchase_order_items.purchase_order_id
      and public.can_access_created_record(po.created_by)
  )
);

-- document child entities via parent auto document
drop policy if exists "document_esignatures_select_scope" on public.document_esignatures;
create policy "document_esignatures_select_scope" on public.document_esignatures for select
using (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_esignatures.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
);

drop policy if exists "document_esignatures_insert_scope" on public.document_esignatures;
create policy "document_esignatures_insert_scope" on public.document_esignatures for insert
with check (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_esignatures.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
);

drop policy if exists "document_esignatures_update_scope" on public.document_esignatures;
create policy "document_esignatures_update_scope" on public.document_esignatures for update
using (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_esignatures.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
)
with check (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_esignatures.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
);

drop policy if exists "document_esignatures_delete_scope" on public.document_esignatures;
create policy "document_esignatures_delete_scope" on public.document_esignatures for delete
using (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_esignatures.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
);

drop policy if exists "document_versions_select_scope" on public.document_versions;
create policy "document_versions_select_scope" on public.document_versions for select
using (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_versions.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
);

drop policy if exists "document_versions_insert_scope" on public.document_versions;
create policy "document_versions_insert_scope" on public.document_versions for insert
with check (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_versions.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
);

drop policy if exists "document_versions_update_scope" on public.document_versions;
create policy "document_versions_update_scope" on public.document_versions for update
using (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_versions.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
)
with check (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_versions.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
);

drop policy if exists "document_versions_delete_scope" on public.document_versions;
create policy "document_versions_delete_scope" on public.document_versions for delete
using (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_versions.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
);

drop policy if exists "document_permissions_select_scope" on public.document_permissions;
create policy "document_permissions_select_scope" on public.document_permissions for select
using (
  user_id = auth.uid()
  or shared_by = auth.uid()
  or exists (
    select 1
    from public.auto_documents d
    where d.id = document_permissions.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
);

drop policy if exists "document_permissions_insert_scope" on public.document_permissions;
create policy "document_permissions_insert_scope" on public.document_permissions for insert
with check (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_permissions.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
);

drop policy if exists "document_permissions_update_scope" on public.document_permissions;
create policy "document_permissions_update_scope" on public.document_permissions for update
using (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_permissions.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
)
with check (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_permissions.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
);

drop policy if exists "document_permissions_delete_scope" on public.document_permissions;
create policy "document_permissions_delete_scope" on public.document_permissions for delete
using (
  exists (
    select 1
    from public.auto_documents d
    where d.id = document_permissions.document_id
      and public.can_access_owned_record(d.owner_id, d.created_by)
  )
);

-- Realtime publication registration (safe no-op when already added).
do $$
begin
  begin
    alter publication supabase_realtime add table public.inventory_items;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.auto_documents;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.document_templates;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.document_esignatures;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end;
$$;

commit;
