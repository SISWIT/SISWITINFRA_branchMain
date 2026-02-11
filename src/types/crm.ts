// CRM Type Definitions

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'advertisement' | 'social_media' | 'trade_show' | 'other';
export type OpportunityStage = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note';
export type QuoteStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent' | 'accepted' | 'expired';

export interface Account {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  annual_revenue?: number;
  employee_count?: number;
  description?: string;
  owner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  job_title?: string;
  department?: string;
  account_id?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  description?: string;
  owner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  account?: Account;
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  status: LeadStatus;
  source?: LeadSource;
  website?: string;
  industry?: string;
  annual_revenue?: number;
  employee_count?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  description?: string;
  converted_at?: string;
  converted_account_id?: string;
  converted_contact_id?: string;
  converted_opportunity_id?: string;
  owner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  name: string;
  account_id?: string;
  contact_id?: string;
  stage: OpportunityStage;
  amount?: number;
  probability?: number;
  expected_revenue?: number;
  close_date?: string;
  lead_source?: LeadSource;
  description?: string;
  next_step?: string;
  is_closed?: boolean;
  is_won?: boolean;
  closed_at?: string;
  owner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  account?: Account;
  contact?: Contact;
}

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  due_date?: string;
  completed_at?: string;
  is_completed?: boolean;
  priority?: string;
  lead_id?: string;
  account_id?: string;
  contact_id?: string;
  opportunity_id?: string;
  owner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  unit_price: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  quote_number?: string;
  opportunity_id?: string;
  account_id?: string;
  contact_id?: string;
  status: QuoteStatus;
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
  opportunity?: Opportunity;
  account?: Account;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id?: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  total?: number;
  sort_order?: number;
  created_at: string;
}



// Stage probabilities for auto-calculation
export const STAGE_PROBABILITIES: Record<OpportunityStage, number> = {
  new: 10,
  qualified: 25,
  proposal: 50,
  negotiation: 75,
  closed_won: 100,
  closed_lost: 0,
};

// Status colors
export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  qualified: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  unqualified: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  converted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export const OPPORTUNITY_STAGE_COLORS: Record<OpportunityStage, string> = {
  new: 'bg-blue-500',
  qualified: 'bg-cyan-500',
  proposal: 'bg-yellow-500',
  negotiation: 'bg-orange-500',
  closed_won: 'bg-green-500',
  closed_lost: 'bg-red-500',
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  accepted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};
