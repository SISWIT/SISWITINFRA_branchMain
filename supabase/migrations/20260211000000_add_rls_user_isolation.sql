-- Row Level Security (RLS) for User Data Isolation
-- This migration ensures each user only sees their own data

-- Enable RLS on all data tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- ===== LEADS =====
-- Users can view only leads they own or created
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
CREATE POLICY "Users can view their own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = created_by);

-- Users can insert leads for themselves
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
CREATE POLICY "Users can create leads"
  ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND auth.uid() = created_by);

-- Users can update their own leads
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = owner_id);

-- Users can delete their own leads
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
CREATE POLICY "Users can delete their own leads"
  ON public.leads FOR DELETE
  USING (auth.uid() = owner_id);

-- ===== ACCOUNTS =====
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
CREATE POLICY "Users can view their own accounts"
  ON public.accounts FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create accounts" ON public.accounts;
CREATE POLICY "Users can create accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
CREATE POLICY "Users can update their own accounts"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
CREATE POLICY "Users can delete their own accounts"
  ON public.accounts FOR DELETE
  USING (auth.uid() = owner_id);

-- ===== CONTACTS =====
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
CREATE POLICY "Users can view their own contacts"
  ON public.contacts FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create contacts" ON public.contacts;
CREATE POLICY "Users can create contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
CREATE POLICY "Users can update their own contacts"
  ON public.contacts FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;
CREATE POLICY "Users can delete their own contacts"
  ON public.contacts FOR DELETE
  USING (auth.uid() = owner_id);

-- ===== OPPORTUNITIES =====
DROP POLICY IF EXISTS "Users can view their own opportunities" ON public.opportunities;
CREATE POLICY "Users can view their own opportunities"
  ON public.opportunities FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create opportunities" ON public.opportunities;
CREATE POLICY "Users can create opportunities"
  ON public.opportunities FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own opportunities" ON public.opportunities;
CREATE POLICY "Users can update their own opportunities"
  ON public.opportunities FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own opportunities" ON public.opportunities;
CREATE POLICY "Users can delete their own opportunities"
  ON public.opportunities FOR DELETE
  USING (auth.uid() = owner_id);

-- ===== ACTIVITIES =====
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
CREATE POLICY "Users can view their own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
CREATE POLICY "Users can create activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
CREATE POLICY "Users can update their own activities"
  ON public.activities FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;
CREATE POLICY "Users can delete their own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = owner_id);

-- ===== PRODUCTS =====
DROP POLICY IF EXISTS "Users can view products" ON public.products;
CREATE POLICY "Users can view products"
  ON public.products FOR SELECT
  USING (true); -- Products are shared

DROP POLICY IF EXISTS "Users can create products" ON public.products;
CREATE POLICY "Users can create products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their products" ON public.products;
CREATE POLICY "Users can update their products"
  ON public.products FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their products" ON public.products;
CREATE POLICY "Users can delete their products"
  ON public.products FOR DELETE
  USING (auth.uid() = created_by);

-- ===== QUOTES =====
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
CREATE POLICY "Users can view their own quotes"
  ON public.quotes FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create quotes" ON public.quotes;
CREATE POLICY "Users can create quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
CREATE POLICY "Users can update their own quotes"
  ON public.quotes FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.quotes;
CREATE POLICY "Users can delete their own quotes"
  ON public.quotes FOR DELETE
  USING (auth.uid() = owner_id);

-- ===== QUOTE ITEMS =====
DROP POLICY IF EXISTS "Users can view their quote items" ON public.quote_items;
CREATE POLICY "Users can view their quote items"
  ON public.quote_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quotes 
    WHERE quotes.id = quote_items.quote_id 
    AND (quotes.owner_id = auth.uid() OR quotes.created_by = auth.uid())
  ));

DROP POLICY IF EXISTS "Users can manage their quote items" ON public.quote_items;
CREATE POLICY "Users can manage their quote items"
  ON public.quote_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quotes 
    WHERE quotes.id = quote_items.quote_id 
    AND (quotes.owner_id = auth.uid() OR quotes.created_by = auth.uid())
  ));

-- ===== CONTRACTS =====
DROP POLICY IF EXISTS "Users can view their own contracts" ON public.contracts;
CREATE POLICY "Users can view their own contracts"
  ON public.contracts FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create contracts" ON public.contracts;
CREATE POLICY "Users can create contracts"
  ON public.contracts FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own contracts" ON public.contracts;
CREATE POLICY "Users can update their own contracts"
  ON public.contracts FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own contracts" ON public.contracts;
CREATE POLICY "Users can delete their own contracts"
  ON public.contracts FOR DELETE
  USING (auth.uid() = owner_id);

-- ===== CONTRACT TEMPLATES =====
DROP POLICY IF EXISTS "Users can view templates" ON public.contract_templates;
CREATE POLICY "Users can view templates"
  ON public.contract_templates FOR SELECT
  USING (auth.uid() = created_by OR is_public = true); -- Own or public templates

DROP POLICY IF EXISTS "Users can create templates" ON public.contract_templates;
CREATE POLICY "Users can create templates"
  ON public.contract_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their templates" ON public.contract_templates;
CREATE POLICY "Users can update their templates"
  ON public.contract_templates FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their templates" ON public.contract_templates;
CREATE POLICY "Users can delete their templates"
  ON public.contract_templates FOR DELETE
  USING (auth.uid() = created_by);

-- ===== INVENTORY ITEMS =====
DROP POLICY IF EXISTS "Users can view their inventory" ON public.inventory_items;
CREATE POLICY "Users can view their inventory"
  ON public.inventory_items FOR SELECT
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create inventory items" ON public.inventory_items;
CREATE POLICY "Users can create inventory items"
  ON public.inventory_items FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their inventory" ON public.inventory_items;
CREATE POLICY "Users can update their inventory"
  ON public.inventory_items FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their inventory" ON public.inventory_items;
CREATE POLICY "Users can delete their inventory"
  ON public.inventory_items FOR DELETE
  USING (auth.uid() = created_by);

-- ===== PURCHASE ORDERS =====
DROP POLICY IF EXISTS "Users can view their purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can view their purchase orders"
  ON public.purchase_orders FOR SELECT
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can create purchase orders"
  ON public.purchase_orders FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can update their purchase orders"
  ON public.purchase_orders FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can delete their purchase orders"
  ON public.purchase_orders FOR DELETE
  USING (auth.uid() = created_by);

-- ===== PURCHASE ORDER ITEMS =====
DROP POLICY IF EXISTS "Users can view their PO items" ON public.purchase_order_items;
CREATE POLICY "Users can view their PO items"
  ON public.purchase_order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.purchase_orders 
    WHERE purchase_orders.id = purchase_order_items.purchase_order_id 
    AND purchase_orders.created_by = auth.uid()
  ));

-- ===== PRODUCTION ORDERS =====
DROP POLICY IF EXISTS "Users can view their production orders" ON public.production_orders;
CREATE POLICY "Users can view their production orders"
  ON public.production_orders FOR SELECT
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create production orders" ON public.production_orders;
CREATE POLICY "Users can create production orders"
  ON public.production_orders FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their production orders" ON public.production_orders;
CREATE POLICY "Users can update their production orders"
  ON public.production_orders FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their production orders" ON public.production_orders;
CREATE POLICY "Users can delete their production orders"
  ON public.production_orders FOR DELETE
  USING (auth.uid() = created_by);

-- ===== FINANCIAL RECORDS =====
DROP POLICY IF EXISTS "Users can view their financial records" ON public.financial_records;
CREATE POLICY "Users can view their financial records"
  ON public.financial_records FOR SELECT
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create financial records" ON public.financial_records;
CREATE POLICY "Users can create financial records"
  ON public.financial_records FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their financial records" ON public.financial_records;
CREATE POLICY "Users can update their financial records"
  ON public.financial_records FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their financial records" ON public.financial_records;
CREATE POLICY "Users can delete their financial records"
  ON public.financial_records FOR DELETE
  USING (auth.uid() = created_by);

-- ===== SUPPLIERS =====
DROP POLICY IF EXISTS "Users can view suppliers" ON public.suppliers;
CREATE POLICY "Users can view suppliers"
  ON public.suppliers FOR SELECT
  USING (true); -- Suppliers are shared between all users

DROP POLICY IF EXISTS "Users can create suppliers" ON public.suppliers;
CREATE POLICY "Users can create suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their suppliers" ON public.suppliers;
CREATE POLICY "Users can update their suppliers"
  ON public.suppliers FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Add indexes for performance on owner_id and created_by columns
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_owner_id ON public.accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON public.contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_owner_id ON public.opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON public.activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_quotes_owner_id ON public.quotes(owner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_owner_id ON public.contracts(owner_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_created_by ON public.inventory_items(created_by);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON public.purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_production_orders_created_by ON public.production_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_financial_records_created_by ON public.financial_records(created_by);
