// Shared type definitions used by CRM and CPQ modules.

export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  unit_price: number;
  cost_price?: number;
  sku?: string;
  is_active?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id?: string;
  quote_id?: string;
  product_id?: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  total?: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Quote<
  TStatus extends string = string,
  TAccount = unknown,
  TContact = unknown,
  TOpportunity = unknown,
> {
  id: string;
  quote_number?: string;
  opportunity_id?: string;
  account_id?: string;
  contact_id?: string;
  status: TStatus;
  subtotal?: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_percent?: number;
  tax_amount?: number;
  total?: number;
  valid_until?: string;
  terms?: string;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  owner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  account?: TAccount;
  accounts?: TAccount;
  contact?: TContact;
  contacts?: TContact;
  opportunity?: TOpportunity;
  opportunities?: TOpportunity;
  items?: QuoteItem[];
}
