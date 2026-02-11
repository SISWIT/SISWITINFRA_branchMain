-- ERP Tables Creation
-- This migration creates all ERP-related tables with proper user isolation fields

-- ===== ENUMS =====
CREATE TYPE public.inventory_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'discontinued');
CREATE TYPE public.purchase_order_status AS ENUM ('draft', 'pending', 'approved', 'received', 'cancelled');
CREATE TYPE public.production_order_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.financial_record_type AS ENUM ('income', 'expense', 'asset', 'liability', 'equity');

-- ===== SUPPLIERS =====
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  payment_terms TEXT,
  rating DECIMAL(3,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== INVENTORY ITEMS =====
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  unit_cost DECIMAL(15,2),
  warehouse_location TEXT,
  status inventory_status DEFAULT 'in_stock',
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== PURCHASE ORDERS =====
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT NOT NULL,
  status purchase_order_status DEFAULT 'draft',
  order_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  shipping_cost DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== PURCHASE ORDER ITEMS =====
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(15,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== PRODUCTION ORDERS =====
CREATE TABLE IF NOT EXISTS public.production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_number TEXT UNIQUE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  status production_order_status DEFAULT 'planned',
  quantity_ordered INTEGER NOT NULL,
  quantity_produced INTEGER DEFAULT 0,
  start_date DATE,
  due_date DATE,
  completion_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== FINANCIAL RECORDS =====
CREATE TABLE IF NOT EXISTS public.financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type financial_record_type NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  reference_id TEXT,
  reference_type TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== INDEXES FOR PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_suppliers_created_by ON public.suppliers(created_by);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON public.inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier_id ON public.inventory_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON public.purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_item_id ON public.production_orders(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_po_number ON public.production_orders(production_order_number);
CREATE INDEX IF NOT EXISTS idx_financial_records_transaction_date ON public.financial_records(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_records_created_by ON public.financial_records(created_by);
