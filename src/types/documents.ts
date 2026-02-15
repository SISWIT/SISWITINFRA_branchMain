// Auto Documents Type Definitions

export type DocumentStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "sent"
  | "signed"
  | "rejected"
  | "expired"
  | "published"
  | "archived";

export type DocumentType = "proposal" | "invoice" | "agreement" | "report" | "policy" | "manual" | "other";
export type DocumentFormat = "pdf" | "docx" | "doc" | "xlsx" | "txt" | "html";
export type DocumentESignatureStatus = "pending" | "signed" | "rejected" | "expired";

export interface AutoDocument {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  content?: string;
  template_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  file_path?: string;
  file_name?: string;
  format?: DocumentFormat;
  file_size?: number;
  generated_from?: string;
  owner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  description?: string;
  content: string;
  variables?: Record<string, string | number | boolean | null>;
  is_active?: boolean;
  is_public?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content?: string;
  file_path?: string;
  file_name?: string;
  format?: DocumentFormat;
  file_size?: number;
  change_summary?: string;
  created_by?: string;
  created_at: string;
}

export interface DocumentPermission {
  id: string;
  document_id: string;
  user_id: string;
  permission_type: "view" | "edit" | "comment" | "share";
  shared_by?: string;
  created_at: string;
}

export interface DocumentESignature {
  id: string;
  document_id: string;
  recipient_name: string;
  recipient_email: string;
  status: DocumentESignatureStatus;
  signed_at?: string;
  rejection_reason?: string;
  expires_at?: string;
  sent_at?: string;
  reminder_count?: number;
  last_reminder_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  pending_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  sent: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  signed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  expired: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  published: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  proposal: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  invoice: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  agreement: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  report: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  policy: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  manual: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};
