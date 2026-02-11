// CPQ (Configure Price Quote) Type Definitions

export type QuoteStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent' | 'accepted' | 'expired';

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

export interface Quote {
  id: string;
  quote_number?: string;
  account_id?: string;
  contact_id?: string;
  opportunity_id?: string;
  status: QuoteStatus;
  valid_until?: string;
  terms?: string;
  notes?: string;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total: number;
  owner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  accounts?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  opportunities?: {
    id: string;
    name: string;
  };
}

export interface QuoteItem {
  id?: string;
  quote_id?: string;
  product_id: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

// Status colors
export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  accepted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};
