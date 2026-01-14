-- CRM Enums
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'unqualified', 'converted');
CREATE TYPE public.lead_source AS ENUM ('website', 'referral', 'cold_call', 'advertisement', 'social_media', 'trade_show', 'other');
CREATE TYPE public.opportunity_stage AS ENUM ('new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE public.activity_type AS ENUM ('call', 'email', 'meeting', 'task', 'note');
CREATE TYPE public.quote_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'sent', 'accepted', 'expired');
CREATE TYPE public.contract_status AS ENUM ('draft', 'pending_review', 'pending_approval', 'approved', 'sent', 'signed', 'expired', 'cancelled');

-- Accounts (Companies)
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  annual_revenue DECIMAL(15,2),
  employee_count INTEGER,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contacts (People)
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  job_title TEXT,
  department TEXT,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  status lead_status NOT NULL DEFAULT 'new',
  source lead_source DEFAULT 'other',
  website TEXT,
  industry TEXT,
  annual_revenue DECIMAL(15,2),
  employee_count INTEGER,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  description TEXT,
  converted_at TIMESTAMPTZ,
  converted_account_id UUID REFERENCES public.accounts(id),
  converted_contact_id UUID REFERENCES public.contacts(id),
  converted_opportunity_id UUID,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Opportunities
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  stage opportunity_stage NOT NULL DEFAULT 'new',
  amount DECIMAL(15,2) DEFAULT 0,
  probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
  expected_revenue DECIMAL(15,2) GENERATED ALWAYS AS (amount * probability / 100) STORED,
  close_date DATE,
  lead_source lead_source,
  description TEXT,
  next_step TEXT,
  is_closed BOOLEAN DEFAULT false,
  is_won BOOLEAN DEFAULT false,
  closed_at TIMESTAMPTZ,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key from leads to opportunities
ALTER TABLE public.leads ADD CONSTRAINT leads_converted_opportunity_fk 
  FOREIGN KEY (converted_opportunity_id) REFERENCES public.opportunities(id);

-- Activities
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type activity_type NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal',
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products (for CPQ)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  description TEXT,
  category TEXT,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quotes (CPQ)
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id),
  contact_id UUID REFERENCES public.contacts(id),
  status quote_status NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(15,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  valid_until DATE,
  terms TEXT,
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quote Line Items
CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price * (1 - discount_percent / 100)) STORED,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract Templates (CLM)
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contracts (CLM)
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE,
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.contract_templates(id),
  opportunity_id UUID REFERENCES public.opportunities(id),
  quote_id UUID REFERENCES public.quotes(id),
  account_id UUID REFERENCES public.accounts(id),
  contact_id UUID REFERENCES public.contacts(id),
  status contract_status NOT NULL DEFAULT 'draft',
  content TEXT,
  start_date DATE,
  end_date DATE,
  value DECIMAL(15,2),
  signed_at TIMESTAMPTZ,
  signed_by TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees (can access all CRM data)
CREATE POLICY "Employees can view all accounts" ON public.accounts FOR SELECT USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can insert accounts" ON public.accounts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can update accounts" ON public.accounts FOR UPDATE USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can delete accounts" ON public.accounts FOR DELETE USING (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Employees can view all contacts" ON public.contacts FOR SELECT USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can insert contacts" ON public.contacts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can update contacts" ON public.contacts FOR UPDATE USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can delete contacts" ON public.contacts FOR DELETE USING (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Employees can view all leads" ON public.leads FOR SELECT USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can insert leads" ON public.leads FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can update leads" ON public.leads FOR UPDATE USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can delete leads" ON public.leads FOR DELETE USING (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Employees can view all opportunities" ON public.opportunities FOR SELECT USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can insert opportunities" ON public.opportunities FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can update opportunities" ON public.opportunities FOR UPDATE USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can delete opportunities" ON public.opportunities FOR DELETE USING (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Employees can view all activities" ON public.activities FOR SELECT USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can insert activities" ON public.activities FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can update activities" ON public.activities FOR UPDATE USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can delete activities" ON public.activities FOR DELETE USING (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Employees can view all products" ON public.products FOR SELECT USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can insert products" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can update products" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can delete products" ON public.products FOR DELETE USING (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Employees can view all quotes" ON public.quotes FOR SELECT USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can insert quotes" ON public.quotes FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can update quotes" ON public.quotes FOR UPDATE USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can delete quotes" ON public.quotes FOR DELETE USING (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Employees can view all quote items" ON public.quote_items FOR SELECT USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can insert quote items" ON public.quote_items FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can update quote items" ON public.quote_items FOR UPDATE USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can delete quote items" ON public.quote_items FOR DELETE USING (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Employees can view all contract templates" ON public.contract_templates FOR SELECT USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can insert contract templates" ON public.contract_templates FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can update contract templates" ON public.contract_templates FOR UPDATE USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can delete contract templates" ON public.contract_templates FOR DELETE USING (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Employees can view all contracts" ON public.contracts FOR SELECT USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can insert contracts" ON public.contracts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can update contracts" ON public.contracts FOR UPDATE USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "Employees can delete contracts" ON public.contracts FOR DELETE USING (public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Employees can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'employee'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Auto-update timestamps trigger
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON public.contract_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-generate quote numbers
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_number IS NULL THEN
    NEW.quote_number := 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quote_number BEFORE INSERT ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.generate_quote_number();

-- Function to auto-generate contract numbers
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL THEN
    NEW.contract_number := 'CT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_contract_number BEFORE INSERT ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.generate_contract_number();

-- Function to auto-update opportunity probability based on stage
CREATE OR REPLACE FUNCTION public.update_opportunity_probability()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.stage
    WHEN 'new' THEN NEW.probability := 10;
    WHEN 'qualified' THEN NEW.probability := 25;
    WHEN 'proposal' THEN NEW.probability := 50;
    WHEN 'negotiation' THEN NEW.probability := 75;
    WHEN 'closed_won' THEN 
      NEW.probability := 100;
      NEW.is_closed := true;
      NEW.is_won := true;
      NEW.closed_at := NOW();
    WHEN 'closed_lost' THEN 
      NEW.probability := 0;
      NEW.is_closed := true;
      NEW.is_won := false;
      NEW.closed_at := NOW();
    ELSE NEW.probability := NEW.probability;
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_opportunity_stage_probability BEFORE INSERT OR UPDATE OF stage ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_opportunity_probability();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION public.create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, old_values, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit triggers for key tables
CREATE TRIGGER audit_opportunities AFTER INSERT OR UPDATE OR DELETE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();
CREATE TRIGGER audit_quotes AFTER INSERT OR UPDATE OR DELETE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();
CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();