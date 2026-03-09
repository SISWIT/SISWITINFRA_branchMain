-- Migration: Add CRM missing columns
-- Purpose: Add columns needed by useCRM.ts hooks that don't exist in the current schema
-- Date: 2026-03-09

-- ============================================
-- LEADS TABLE - Add missing columns
-- ============================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_status VARCHAR(50) DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_to_account_id UUID REFERENCES accounts(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_to_contact_id UUID REFERENCES contacts(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_to_opportunity_id UUID REFERENCES opportunities(id);

-- ============================================
-- ACCOUNTS TABLE - Add missing columns
-- ============================================
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_zip VARCHAR(20);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC(15,2);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS number_of_employees INTEGER;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS ownership VARCHAR(100);

-- ============================================
-- CONTACTS TABLE - Add missing columns
-- ============================================
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS zip VARCHAR(20);

-- ============================================
-- OPPORTUNITIES TABLE - Add missing columns
-- ============================================
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS expected_revenue NUMERIC(15,2);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS next_step TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS is_won BOOLEAN DEFAULT FALSE;

-- ============================================
-- ACTIVITIES TABLE - Add missing columns
-- ============================================
ALTER TABLE activities ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS related_to_type VARCHAR(50);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS related_to_id UUID;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id);

-- ============================================
-- QUOTES TABLE - Add missing columns
-- ============================================
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(15,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- ============================================
-- QUOTE LINE ITEMS TABLE - Add missing columns
-- ============================================
ALTER TABLE quote_line_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE quote_line_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE quote_line_items ADD COLUMN IF NOT EXISTS total NUMERIC(15,2);
ALTER TABLE quote_line_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- ============================================
-- ADD RLS POLICIES FOR NEW COLUMNS
-- ============================================

-- Enable RLS on tables if not already enabled
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;

-- Create policies for the new columns (matching existing patterns)
-- Leads policies
DROP POLICY IF EXISTS "leads_select_policy" ON leads;
CREATE POLICY "leads_select_policy" ON leads FOR SELECT USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
  OR auth.uid() IN (SELECT user_id FROM organization_memberships WHERE role IN ('owner', 'admin'))
);

DROP POLICY IF EXISTS "leads_insert_policy" ON leads;
CREATE POLICY "leads_insert_policy" ON leads FOR INSERT WITH CHECK (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "leads_update_policy" ON leads;
CREATE POLICY "leads_update_policy" ON leads FOR UPDATE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
);

DROP POLICY IF EXISTS "leads_delete_policy" ON leads;
CREATE POLICY "leads_delete_policy" ON leads FOR DELETE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
);

-- Accounts policies
DROP POLICY IF EXISTS "accounts_select_policy" ON accounts;
CREATE POLICY "accounts_select_policy" ON accounts FOR SELECT USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
  OR auth.uid() IN (SELECT user_id FROM organization_memberships WHERE role IN ('owner', 'admin'))
);

DROP POLICY IF EXISTS "accounts_insert_policy" ON accounts;
CREATE POLICY "accounts_insert_policy" ON accounts FOR INSERT WITH CHECK (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "accounts_update_policy" ON accounts;
CREATE POLICY "accounts_update_policy" ON accounts FOR UPDATE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
);

DROP POLICY IF EXISTS "accounts_delete_policy" ON accounts;
CREATE POLICY "accounts_delete_policy" ON accounts FOR DELETE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
);

-- Contacts policies
DROP POLICY IF EXISTS "contacts_select_policy" ON contacts;
CREATE POLICY "contacts_select_policy" ON contacts FOR SELECT USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
  OR auth.uid() IN (SELECT user_id FROM organization_memberships WHERE role IN ('owner', 'admin'))
);

DROP POLICY IF EXISTS "contacts_insert_policy" ON contacts;
CREATE POLICY "contacts_insert_policy" ON contacts FOR INSERT WITH CHECK (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "contacts_update_policy" ON contacts;
CREATE POLICY "contacts_update_policy" ON contacts FOR UPDATE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
);

DROP POLICY IF EXISTS "contacts_delete_policy" ON contacts;
CREATE POLICY "contacts_delete_policy" ON contacts FOR DELETE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
);

-- Opportunities policies
DROP POLICY IF EXISTS "opportunities_select_policy" ON opportunities;
CREATE POLICY "opportunities_select_policy" ON opportunities FOR SELECT USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
  OR auth.uid() IN (SELECT user_id FROM organization_memberships WHERE role IN ('owner', 'admin'))
);

DROP POLICY IF EXISTS "opportunities_insert_policy" ON opportunities;
CREATE POLICY "opportunities_insert_policy" ON opportunities FOR INSERT WITH CHECK (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "opportunities_update_policy" ON opportunities;
CREATE POLICY "opportunities_update_policy" ON opportunities FOR UPDATE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
);

DROP POLICY IF EXISTS "opportunities_delete_policy" ON opportunities;
CREATE POLICY "opportunities_delete_policy" ON opportunities FOR DELETE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
);

-- Activities policies
DROP POLICY IF EXISTS "activities_select_policy" ON activities;
CREATE POLICY "activities_select_policy" ON activities FOR SELECT USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
  OR auth.uid() IN (SELECT user_id FROM organization_memberships WHERE role IN ('owner', 'admin'))
);

DROP POLICY IF EXISTS "activities_insert_policy" ON activities;
CREATE POLICY "activities_insert_policy" ON activities FOR INSERT WITH CHECK (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "activities_update_policy" ON activities;
CREATE POLICY "activities_update_policy" ON activities FOR UPDATE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
);

DROP POLICY IF EXISTS "activities_delete_policy" ON activities;
CREATE POLICY "activities_delete_policy" ON activities FOR DELETE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
);

-- Quotes policies
DROP POLICY IF EXISTS "quotes_select_policy" ON quotes;
CREATE POLICY "quotes_select_policy" ON quotes FOR SELECT USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
  OR auth.uid() IN (SELECT user_id FROM organization_memberships WHERE role IN ('owner', 'admin'))
);

DROP POLICY IF EXISTS "quotes_insert_policy" ON quotes;
CREATE POLICY "quotes_insert_policy" ON quotes FOR INSERT WITH CHECK (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "quotes_update_policy" ON quotes;
CREATE POLICY "quotes_update_policy" ON quotes FOR UPDATE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
);

DROP POLICY IF EXISTS "quotes_delete_policy" ON quotes;
CREATE POLICY "quotes_delete_policy" ON quotes FOR DELETE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR owner_id = auth.uid()
);

-- Quote line items policies
DROP POLICY IF EXISTS "quote_line_items_select_policy" ON quote_line_items;
CREATE POLICY "quote_line_items_select_policy" ON quote_line_items FOR SELECT USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
  OR auth.uid() IN (SELECT user_id FROM organization_memberships WHERE role IN ('owner', 'admin'))
);

DROP POLICY IF EXISTS "quote_line_items_insert_policy" ON quote_line_items;
CREATE POLICY "quote_line_items_insert_policy" ON quote_line_items FOR INSERT WITH CHECK (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "quote_line_items_update_policy" ON quote_line_items;
CREATE POLICY "quote_line_items_update_policy" ON quote_line_items FOR UPDATE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "quote_line_items_delete_policy" ON quote_line_items;
CREATE POLICY "quote_line_items_delete_policy" ON quote_line_items FOR DELETE USING (
  organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_website ON leads(website);
CREATE INDEX IF NOT EXISTS idx_leads_converted ON leads(converted_at);

CREATE INDEX IF NOT EXISTS idx_accounts_industry ON accounts(industry);
CREATE INDEX IF NOT EXISTS idx_accounts_annual_revenue ON accounts(annual_revenue);

CREATE INDEX IF NOT EXISTS idx_contacts_department ON contacts(department);
CREATE INDEX IF NOT EXISTS idx_contacts_city ON contacts(city);

CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_is_closed ON opportunities(is_closed);
CREATE INDEX IF NOT EXISTS idx_opportunities_is_won ON opportunities(is_won);

CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_priority ON activities(priority);
CREATE INDEX IF NOT EXISTS idx_activities_related_to ON activities(related_to_type, related_to_id);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_approved ON quotes(approved_at);

CREATE INDEX IF NOT EXISTS idx_quote_line_items_sort ON quote_line_items(sort_order);

-- Migration complete
SELECT 'CRM columns migration completed successfully' AS result;
