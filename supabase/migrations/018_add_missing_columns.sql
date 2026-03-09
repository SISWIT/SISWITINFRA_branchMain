-- Add missing columns that might have been accidentally deleted

-- Suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS zip VARCHAR(20);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2);

-- Inventory Items
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS quantity_reserved INTEGER DEFAULT 0;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS quantity_available INTEGER DEFAULT 0;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS reorder_level INTEGER;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS average_cost NUMERIC(15,2);
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS warehouse_location VARCHAR(255);

-- Products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS family VARCHAR(100);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS list_price NUMERIC(15,2);

-- Purchase Orders
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS expected_delivery_date TIMESTAMPTZ;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS actual_delivery_date TIMESTAMPTZ;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15,2);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(15,2);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC(15,2);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15,2);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(100);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS vendor_id UUID;

-- Purchase Order Items
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS quantity_ordered INTEGER;
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(15,2);
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS total_price NUMERIC(15,2);

-- Production Orders
ALTER TABLE public.production_orders ADD COLUMN IF NOT EXISTS quantity_to_produce INTEGER;
ALTER TABLE public.production_orders ADD COLUMN IF NOT EXISTS quantity_produced INTEGER DEFAULT 0;
ALTER TABLE public.production_orders ADD COLUMN IF NOT EXISTS actual_end_date TIMESTAMPTZ;
ALTER TABLE public.production_orders ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE public.production_orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Financial Records
ALTER TABLE public.financial_records ADD COLUMN IF NOT EXISTS record_type VARCHAR(50);
ALTER TABLE public.financial_records ADD COLUMN IF NOT EXISTS record_date TIMESTAMPTZ;
ALTER TABLE public.financial_records ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE public.financial_records ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.financial_records ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50);
ALTER TABLE public.financial_records ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ;

-- Accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC(15,2);
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS number_of_employees INTEGER;

-- Activities
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

-- Quotes
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- Contract Templates
ALTER TABLE public.contract_templates ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS total_value NUMERIC(15,2);

-- Document ESignatures
ALTER TABLE public.document_esignatures ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);
ALTER TABLE public.document_esignatures ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255);
ALTER TABLE public.document_esignatures ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;
ALTER TABLE public.document_esignatures ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ;

-- Document Templates
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Auto Documents
ALTER TABLE public.auto_documents ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Document Permissions
ALTER TABLE public.document_permissions ADD COLUMN IF NOT EXISTS permission_type VARCHAR(50);
