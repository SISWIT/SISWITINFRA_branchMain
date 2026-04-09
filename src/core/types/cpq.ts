// CPQ (Configure Price Quote) Type Definitions
import type { Quote as SharedQuote } from "./shared";

export type QuoteStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent' | 'accepted' | 'expired' | 'cancelled';

export interface QuoteAccount {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface QuoteContact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}

export interface QuoteOpportunity {
  id: string;
  name: string;
}

export type { Product, QuoteItem } from "./shared";
export type Quote = SharedQuote<QuoteStatus, QuoteAccount, QuoteContact, QuoteOpportunity>;

export interface QuoteTemplateItem {
  id: string;
  quote_template_id: string;
  product_id?: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  total?: number;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  terms?: string;
  notes?: string;
  validity_days: number;
  discount_percent: number;
  tax_percent: number;
  estimated_total: number;
  item_count: number;
  is_active: boolean;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: QuoteTemplateItem[];
}

// Status colors
export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'bg-secondary text-secondary-foreground',
  pending_approval: 'bg-warning/15 text-warning',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-destructive/15 text-destructive',
  sent: 'bg-info/15 text-info',
  accepted: 'bg-primary/15 text-primary',
  expired: 'bg-secondary text-secondary-foreground',
  cancelled: 'bg-destructive/15 text-destructive',
};
