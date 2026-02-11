// CLM (Contract Lifecycle Management) Type Definitions

export type ContractStatus = 'draft' | 'pending_review' | 'pending_approval' | 'approved' | 'sent' | 'signed' | 'expired' | 'cancelled';
export type ESignatureStatus = 'pending' | 'signed' | 'rejected' | 'expired';

export interface ContractTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
  is_active?: boolean;
  is_public?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  contract_number?: string;
  name: string;
  template_id?: string;
  opportunity_id?: string;
  quote_id?: string;
  account_id?: string;
  contact_id?: string;
  status: ContractStatus;
  content?: string;
  start_date?: string;
  end_date?: string;
  value?: number;
  signed_at?: string;
  signed_by?: string;
  owner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ESignature {
  id: string;
  contract_id: string;
  recipient_email: string;
  recipient_name: string;
  status: ESignatureStatus;
  signed_at?: string;
  rejection_reason?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractScan {
  id: string;
  contract_id: string;
  file_path?: string;
  file_name?: string;
  content_type?: string;
  file_size?: number;
  ocr_text?: string;
  scan_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Status colors
export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending_approval: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  signed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const ESIGNATURE_STATUS_COLORS: Record<ESignatureStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  signed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};
