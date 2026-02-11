// ERP Type Definitions

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';
export type ProductionOrderStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type FinancialRecordType = 'income' | 'expense' | 'asset' | 'liability' | 'equity';

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  payment_terms?: string;
  rating?: number;
  is_active?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  quantity_on_hand?: number;
  quantity_reserved?: number;
  quantity_available?: number;
  reorder_level?: number;
  reorder_quantity?: number;
  unit_cost?: number;
  warehouse_location?: string;
  status?: InventoryStatus;
  supplier_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface PurchaseOrder {
  id: string;
  po_number?: string;
  supplier_id: string;
  status?: PurchaseOrderStatus;
  order_date?: string;
  due_date?: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  subtotal?: number;
  tax_amount?: number;
  shipping_cost?: number;
  total?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_item_id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_cost: number;
  total?: number;
  sort_order?: number;
  created_at: string;
}

export interface ProductionOrder {
  id: string;
  production_order_number?: string;
  inventory_item_id?: string;
  status?: ProductionOrderStatus;
  quantity_ordered?: number;
  quantity_produced?: number;
  start_date?: string;
  due_date?: string;
  completion_date?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  inventory_item?: InventoryItem;
}

export interface FinancialRecord {
  id: string;
  transaction_date?: string;
  type?: FinancialRecordType;
  category?: string;
  description?: string;
  amount?: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Status colors
export const INVENTORY_STATUS_COLORS: Record<InventoryStatus, string> = {
  in_stock: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  low_stock: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  out_of_stock: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  discontinued: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export const PURCHASE_ORDER_STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  received: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const PRODUCTION_ORDER_STATUS_COLORS: Record<ProductionOrderStatus, string> = {
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const FINANCIAL_RECORD_TYPE_COLORS: Record<FinancialRecordType, string> = {
  income: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  expense: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  asset: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  liability: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  equity: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};
