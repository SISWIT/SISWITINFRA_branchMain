import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type {
  InventoryItem,
  PurchaseOrder,
  PurchaseOrderItem,
  ProductionOrder,
  FinancialRecord,
  Supplier,
} from "@/types/erp";
import { toast } from "sonner";

// ===== SUPPLIERS =====
export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Supplier[];
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (supplier: Omit<Partial<Supplier>, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("suppliers")
        .insert({
          name: supplier.name || "",
          email: supplier.email,
          phone: supplier.phone,
          website: supplier.website,
          address: supplier.address,
          city: supplier.city,
          state: supplier.state,
          country: supplier.country,
          postal_code: supplier.postal_code,
          payment_terms: supplier.payment_terms,
          rating: supplier.rating,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier created successfully");
    },
    onError: (error) => {
      toast.error("Error creating supplier: " + error.message);
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from("suppliers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating supplier: " + error.message);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting supplier: " + error.message);
    },
  });
}

// ===== INVENTORY ITEMS =====
export function useInventoryItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["inventory_items", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*, supplier:suppliers(*)")
        .eq("created_by", user.id)
        .order("name");
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (item: Omit<Partial<InventoryItem>, "id" | "created_at" | "updated_at" | "quantity_available">) => {
      const { data, error } = await supabase
        .from("inventory_items")
        .insert({
          sku: item.sku || "",
          name: item.name || "",
          description: item.description,
          category: item.category,
          quantity_on_hand: item.quantity_on_hand || 0,
          quantity_reserved: item.quantity_reserved || 0,
          reorder_level: item.reorder_level,
          reorder_quantity: item.reorder_quantity,
          unit_cost: item.unit_cost,
          warehouse_location: item.warehouse_location,
          status: item.status || "in_stock",
          supplier_id: item.supplier_id,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_items"] });
      toast.success("Inventory item created successfully");
    },
    onError: (error) => {
      toast.error("Error creating inventory item: " + error.message);
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("inventory_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_items"] });
      toast.success("Inventory item updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating inventory item: " + error.message);
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory_items"] });
      toast.success("Inventory item deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting inventory item: " + error.message);
    },
  });
}

// ===== PURCHASE ORDERS =====
export function usePurchaseOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["purchase_orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, supplier:suppliers(*)")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ["purchase_order", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, supplier:suppliers(*)")
        .eq("id", id)
        .single();
      if (error) throw error;

      const { data: items, error: itemsError } = await supabase
        .from("purchase_order_items")
        .select("*")
        .eq("purchase_order_id", id)
        .order("sort_order");
      if (itemsError) throw itemsError;

      return { ...data, items } as PurchaseOrder;
    },
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (po: Omit<Partial<PurchaseOrder>, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .insert({
          po_number: po.po_number,
          supplier_id: po.supplier_id || "",
          status: po.status || "draft",
          order_date: po.order_date,
          due_date: po.due_date,
          expected_delivery_date: po.expected_delivery_date,
          notes: po.notes,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast.success("Purchase order created successfully");
    },
    onError: (error) => {
      toast.error("Error creating purchase order: " + error.message);
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PurchaseOrder> & { id: string }) => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase_order"] });
      toast.success("Purchase order updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating purchase order: " + error.message);
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast.success("Purchase order deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting purchase order: " + error.message);
    },
  });
}

// ===== PURCHASE ORDER ITEMS =====
export function useCreatePurchaseOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      purchase_order_id: string;
      item_name: string;
      unit_cost: number;
      quantity?: number;
      inventory_item_id?: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from("purchase_order_items")
        .insert({
          purchase_order_id: item.purchase_order_id,
          item_name: item.item_name,
          unit_cost: item.unit_cost,
          quantity: item.quantity || 1,
          inventory_item_id: item.inventory_item_id,
          description: item.description,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase_order"] });
      toast.success("Purchase order item added successfully");
    },
    onError: (error) => {
      toast.error("Error adding purchase order item: " + error.message);
    },
  });
}

export function useDeletePurchaseOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("purchase_order_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase_order"] });
      toast.success("Purchase order item removed successfully");
    },
    onError: (error) => {
      toast.error("Error removing purchase order item: " + error.message);
    },
  });
}

// ===== PRODUCTION ORDERS =====
export function useProductionOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["production_orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("production_orders")
        .select("*, inventory_item:inventory_items(*)")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProductionOrder[];
    },
  });
}

export function useCreateProductionOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (order: Omit<Partial<ProductionOrder>, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("production_orders")
        .insert({
          production_order_number: order.production_order_number,
          inventory_item_id: order.inventory_item_id,
          status: order.status || "planned",
          quantity_ordered: order.quantity_ordered || 0,
          start_date: order.start_date,
          due_date: order.due_date,
          notes: order.notes,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production_orders"] });
      toast.success("Production order created successfully");
    },
    onError: (error) => {
      toast.error("Error creating production order: " + error.message);
    },
  });
}

export function useUpdateProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProductionOrder> & { id: string }) => {
      const { data, error } = await supabase
        .from("production_orders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production_orders"] });
      toast.success("Production order updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating production order: " + error.message);
    },
  });
}

export function useDeleteProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("production_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production_orders"] });
      toast.success("Production order deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting production order: " + error.message);
    },
  });
}

// ===== FINANCIAL RECORDS =====
export function useFinancialRecords() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["financial_records", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("financial_records")
        .select("*")
        .eq("created_by", user.id)
        .order("transaction_date", { ascending: false });
      if (error) throw error;
      return data as FinancialRecord[];
    },
  });
}

export function useCreateFinancialRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (record: Omit<Partial<FinancialRecord>, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("financial_records")
        .insert({
          transaction_date: record.transaction_date,
          type: record.type || "expense",
          category: record.category || "",
          description: record.description,
          amount: record.amount || 0,
          reference_id: record.reference_id,
          reference_type: record.reference_type,
          notes: record.notes,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      toast.success("Financial record created successfully");
    },
    onError: (error) => {
      toast.error("Error creating financial record: " + error.message);
    },
  });
}

export function useUpdateFinancialRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from("financial_records")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      toast.success("Financial record updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating financial record: " + error.message);
    },
  });
}

export function useDeleteFinancialRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      toast.success("Financial record deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting financial record: " + error.message);
    },
  });
}
