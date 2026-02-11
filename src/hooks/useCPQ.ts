import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Quote, QuoteItem, Product } from "@/types/cpq";
import { toast } from "sonner";

// ===== PRODUCTS =====
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (product: Omit<Partial<Product>, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: product.name || "",
          description: product.description,
          category: product.category,
          unit_price: product.unit_price || 0,
          cost_price: product.cost_price,
          sku: product.sku,
          is_active: product.is_active ?? true,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created successfully");
    },
    onError: (error) => {
      toast.error("Error creating product: " + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating product: " + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting product: " + error.message);
    },
  });
}

// ===== QUOTES =====
export function useQuotes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["quotes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("quotes")
        .select("*, accounts(id, name), contacts(id, first_name, last_name, email, phone), opportunities(id, name)")
        .or(`owner_id.eq.${user.id},created_by.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quote[];
    },
  });
}

export function useQuote(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["quote", id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("quotes")
        .select("*, accounts(id, name, address, city, state, postal_code, country), contacts(id, first_name, last_name, email, phone), opportunities(id, name)")
        .eq("id", id)
        .or(`owner_id.eq.${user.id},created_by.eq.${user.id}`)
        .single();
      if (error) throw error;
      return data as Quote;
    },
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (quote: Omit<Partial<Quote>, "id" | "created_at" | "updated_at"> & { items?: QuoteItem[] }) => {
      const { items, ...quoteData } = quote;

      const { data, error } = await supabase
        .from("quotes")
        .insert({
          account_id: quoteData.account_id || null,
          contact_id: quoteData.contact_id || null,
          opportunity_id: quoteData.opportunity_id || null,
          status: quoteData.status || "draft",
          valid_until: quoteData.valid_until || null,
          terms: quoteData.terms,
          notes: quoteData.notes,
          subtotal: quoteData.subtotal || 0,
          discount_percent: quoteData.discount_percent || 0,
          discount_amount: quoteData.discount_amount || 0,
          tax_percent: quoteData.tax_percent || 0,
          tax_amount: quoteData.tax_amount || 0,
          total: quoteData.total || 0,
          owner_id: user?.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert quote items if provided
      if (items && items.length > 0) {
        const { error: itemsError } = await supabase.from("quote_items").insert(
          items.map((item, index) => ({
            quote_id: data.id,
            product_id: item.product_id,
            product_name: item.product_name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent,
            total: item.total,
            sort_order: index,
          }))
        );
        if (itemsError) throw itemsError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Quote created successfully");
    },
    onError: (error) => {
      toast.error("Error creating quote: " + error.message);
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Quote> & { id: string }) => {
      const { data, error } = await supabase
        .from("quotes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quote", variables.id] });
      toast.success("Quote updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating quote: " + error.message);
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete quote items first
      const { error: itemsError } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", id);
      if (itemsError) throw itemsError;

      // Then delete quote
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Quote deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting quote: " + error.message);
    },
  });
}

// ===== QUOTE ITEMS =====
export function useQuoteItems(quoteId: string) {
  return useQuery({
    queryKey: ["quote_items", quoteId],
    enabled: !!quoteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quoteId)
        .order("sort_order");
      if (error) throw error;
      return data as QuoteItem[];
    },
  });
}

export function useCreateQuoteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<Partial<QuoteItem>, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("quote_items")
        .insert({
          quote_id: item.quote_id || "",
          product_id: item.product_id || "",
          product_name: item.product_name || "",
          description: item.description,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          discount_percent: item.discount_percent || 0,
          total: item.total || 0,
          sort_order: item.sort_order || 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quote_items", variables.quote_id] });
      toast.success("Quote item added successfully");
    },
    onError: (error) => {
      toast.error("Error adding quote item: " + error.message);
    },
  });
}

export function useUpdateQuoteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quoteId, ...updates }: Partial<QuoteItem> & { id: string; quoteId: string }) => {
      const { data, error } = await supabase
        .from("quote_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quote_items", variables.quoteId] });
      toast.success("Quote item updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating quote item: " + error.message);
    },
  });
}

export function useDeleteQuoteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quoteId }: { id: string; quoteId: string }) => {
      const { error } = await supabase.from("quote_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quote_items", variables.quoteId] });
      toast.success("Quote item deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting quote item: " + error.message);
    },
  });
}

// ===== UPDATE QUOTE STATUS =====
export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("quotes")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quote", variables.id] });
      toast.success("Quote status updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating quote status: " + error.message);
    },
  });
}
