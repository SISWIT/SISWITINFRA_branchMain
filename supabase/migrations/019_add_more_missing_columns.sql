-- Add remaining missing columns and foreign keys that were missed in previous migrations

-- Suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Purchase Orders
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100);

-- Foreign Key for Purchase Orders to Accounts (vendor_id usually maps to accounts or suppliers, but the query uses accounts)
-- Based on the error: "could not find the relation between purchase_orders and accounts"
ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_vendor_id_fkey;
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.accounts(id);

-- Purchase Order Items
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity_on_hand INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity_reserved INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity_available INTEGER DEFAULT 0;

-- Quotes
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS notes TEXT;

-- Contracts
-- Foreign Key for Contracts to Accounts
-- Based on the error: "could not find the relation between contracts and accounts"
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS account_id UUID;
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_account_id_fkey;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);
