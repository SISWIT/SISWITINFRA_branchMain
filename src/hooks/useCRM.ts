import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Lead, Account, Contact, Opportunity, Activity, Product, Quote, QuoteItem, Contract, ContractTemplate } from "@/types/crm";
import { toast } from "@/hooks/use-toast";

// Leads
export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (lead: Omit<Partial<Lead>, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          first_name: lead.first_name || '',
          last_name: lead.last_name || '',
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          job_title: lead.job_title,
          status: lead.status,
          source: lead.source,
          description: lead.description,
          owner_id: user?.id,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating lead", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating lead", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting lead", description: error.message, variant: "destructive" });
    },
  });
}

// Accounts
export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Account[];
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (account: Omit<Partial<Account>, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("accounts")
        .insert({
          name: account.name || '',
          industry: account.industry,
          website: account.website,
          phone: account.phone,
          email: account.email,
          address: account.address,
          city: account.city,
          state: account.state,
          country: account.country,
          description: account.description,
          owner_id: user?.id,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast({ title: "Account created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating account", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Account> & { id: string }) => {
      const { data, error } = await supabase
        .from("accounts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast({ title: "Account updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating account", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast({ title: "Account deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting account", description: error.message, variant: "destructive" });
    },
  });
}

// Contacts
export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*, account:accounts(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contact[];
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (contact: Omit<Partial<Contact>, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          first_name: contact.first_name || '',
          last_name: contact.last_name || '',
          email: contact.email,
          phone: contact.phone,
          job_title: contact.job_title,
          department: contact.department,
          account_id: contact.account_id,
          description: contact.description,
          owner_id: user?.id,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contact created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating contact", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contact updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating contact", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contact deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting contact", description: error.message, variant: "destructive" });
    },
  });
}

// Opportunities
export function useOpportunities() {
  return useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*, account:accounts(*), contact:contacts(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Opportunity[];
    },
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (opportunity: Omit<Partial<Opportunity>, 'id' | 'created_at' | 'updated_at' | 'expected_revenue'>) => {
      const { data, error } = await supabase
        .from("opportunities")
        .insert({
          name: opportunity.name || '',
          account_id: opportunity.account_id,
          contact_id: opportunity.contact_id,
          stage: opportunity.stage,
          amount: opportunity.amount,
          close_date: opportunity.close_date,
          description: opportunity.description,
          owner_id: user?.id,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast({ title: "Opportunity created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating opportunity", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Opportunity> & { id: string }) => {
      const { data, error } = await supabase
        .from("opportunities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast({ title: "Opportunity updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating opportunity", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("opportunities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast({ title: "Opportunity deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting opportunity", description: error.message, variant: "destructive" });
    },
  });
}

// Activities
export function useActivities(filters?: { opportunityId?: string; leadId?: string; accountId?: string }) {
  return useQuery({
    queryKey: ["activities", filters],
    queryFn: async () => {
      let query = supabase.from("activities").select("*").order("created_at", { ascending: false });
      
      if (filters?.opportunityId) query = query.eq("opportunity_id", filters.opportunityId);
      if (filters?.leadId) query = query.eq("lead_id", filters.leadId);
      if (filters?.accountId) query = query.eq("account_id", filters.accountId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Activity[];
    },
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (activity: Omit<Partial<Activity>, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("activities")
        .insert({
          type: activity.type || 'task',
          subject: activity.subject || '',
          description: activity.description,
          due_date: activity.due_date,
          opportunity_id: activity.opportunity_id,
          lead_id: activity.lead_id,
          account_id: activity.account_id,
          contact_id: activity.contact_id,
          owner_id: user?.id,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({ title: "Activity created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating activity", description: error.message, variant: "destructive" });
    },
  });
}
<<<<<<< HEAD
=======
export function useUpdateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Activity> & { id: string }) => {
      const { data, error } = await supabase
        .from("activities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({ title: "Activity updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating activity", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({ title: "Activity deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting activity", description: error.message, variant: "destructive" });
    },
  });
}
>>>>>>> ffb08206c89006f37cd80255d19add5a21332a59

// Products
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
  
  return useMutation({
    mutationFn: async (product: Omit<Partial<Product>, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: product.name || '',
          sku: product.sku,
          description: product.description,
          category: product.category,
          unit_price: product.unit_price,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating product", description: error.message, variant: "destructive" });
    },
  });
}

// Quotes
export function useQuotes() {
  return useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, opportunity:opportunities(*), account:accounts(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quote[];
    },
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ["quote", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, opportunity:opportunities(*), account:accounts(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      
      const { data: items, error: itemsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", id)
        .order("sort_order");
      if (itemsError) throw itemsError;
      
      return { ...data, items } as Quote;
    },
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (quote: Partial<Quote>) => {
      const { data, error } = await supabase
        .from("quotes")
        .insert({ ...quote, owner_id: user?.id, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast({ title: "Quote created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating quote", description: error.message, variant: "destructive" });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast({ title: "Quote updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating quote", description: error.message, variant: "destructive" });
    },
  });
}

// Quote Items
export function useCreateQuoteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: { quote_id: string; product_name: string; unit_price: number; quantity?: number; product_id?: string; description?: string; discount_percent?: number }) => {
      const { data, error } = await supabase
        .from("quote_items")
        .insert({
          quote_id: item.quote_id,
          product_name: item.product_name,
          unit_price: item.unit_price,
          quantity: item.quantity || 1,
          product_id: item.product_id,
          description: item.description,
          discount_percent: item.discount_percent,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quote"] });
    },
    onError: (error) => {
      toast({ title: "Error adding item", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteQuoteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quote_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quote"] });
    },
    onError: (error) => {
      toast({ title: "Error removing item", description: error.message, variant: "destructive" });
    },
  });
}

// Contracts
export function useContracts() {
  return useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*, account:accounts(*), quote:quotes(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
  });
}

export function useContractTemplates() {
  return useQuery({
    queryKey: ["contract_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as ContractTemplate[];
    },
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (contract: Omit<Partial<Contract>, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("contracts")
        .insert({
          name: contract.name || '',
          template_id: contract.template_id,
          opportunity_id: contract.opportunity_id,
          quote_id: contract.quote_id,
          account_id: contract.account_id,
          contact_id: contract.contact_id,
          content: contract.content,
          start_date: contract.start_date,
          end_date: contract.end_date,
          value: contract.value,
          owner_id: user?.id,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: "Contract created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating contract", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contract> & { id: string }) => {
      const { data, error } = await supabase
        .from("contracts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: "Contract updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating contract", description: error.message, variant: "destructive" });
    },
  });
}
<<<<<<< HEAD

=======
// Delete contract missing
// added...
export function useDeleteContract() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: "Contract deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting contract", description: error.message, variant: "destructive" });
    },
  });
}
>>>>>>> ffb08206c89006f37cd80255d19add5a21332a59
// Dashboard Stats
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const [leads, opportunities, accounts, quotes, contracts] = await Promise.all([
        supabase.from("leads").select("id, status", { count: "exact" }),
        supabase.from("opportunities").select("id, stage, amount, expected_revenue, is_won, is_closed"),
        supabase.from("accounts").select("id", { count: "exact" }),
        supabase.from("quotes").select("id, status, total", { count: "exact" }),
        supabase.from("contracts").select("id, status, value", { count: "exact" }),
      ]);
      
      const opps = opportunities.data || [];
      const openOpps = opps.filter(o => !o.is_closed);
      const wonOpps = opps.filter(o => o.is_won);
      
      return {
        totalLeads: leads.count || 0,
        totalAccounts: accounts.count || 0,
        totalOpportunities: opps.length,
        openOpportunities: openOpps.length,
        pipelineValue: openOpps.reduce((sum, o) => sum + (o.amount || 0), 0),
        expectedRevenue: openOpps.reduce((sum, o) => sum + (o.expected_revenue || 0), 0),
        wonDeals: wonOpps.length,
        wonValue: wonOpps.reduce((sum, o) => sum + (o.amount || 0), 0),
        winRate: opps.filter(o => o.is_closed).length > 0 
          ? (wonOpps.length / opps.filter(o => o.is_closed).length) * 100 
          : 0,
        totalQuotes: quotes.count || 0,
        totalContracts: contracts.count || 0,
        opportunitiesByStage: opps.reduce((acc, o) => {
          acc[o.stage] = (acc[o.stage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    },
  });
}
