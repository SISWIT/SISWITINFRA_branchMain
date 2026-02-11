import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Contract, ContractTemplate, ESignature, ContractScan } from "@/types/clm";
import { toast } from "sonner";

// ===== CONTRACT TEMPLATES =====
export function useContractTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["contract_templates", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .or(`created_by.eq.${user.id},is_public.eq.true`)
        .order("name");
      if (error) throw error;
      return data as ContractTemplate[];
    },
  });
}

export function useCreateContractTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: Omit<Partial<ContractTemplate>, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("contract_templates")
        .insert({
          name: template.name || "",
          type: template.type || "",
          content: template.content || "",
          is_active: template.is_active ?? true,
          is_public: template.is_public ?? false,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract_templates"] });
      toast.success("Contract template created successfully");
    },
    onError: (error) => {
      toast.error("Error creating contract template: " + error.message);
    },
  });
}

export function useUpdateContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContractTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("contract_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract_templates"] });
      toast.success("Contract template updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating contract template: " + error.message);
    },
  });
}

export function useDeleteContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contract_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract_templates"] });
      toast.success("Contract template deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting contract template: " + error.message);
    },
  });
}

// ===== CONTRACTS =====
export function useContracts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["contracts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .or(`owner_id.eq.${user.id},created_by.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
  });
}

export function useContract(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["contract", id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", id)
        .or(`owner_id.eq.${user.id},created_by.eq.${user.id}`)
        .single();
      if (error) throw error;
      return data as Contract;
    },
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (contract: Omit<Partial<Contract>, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("contracts")
        .insert({
          name: contract.name || "",
          contract_number: contract.contract_number,
          template_id: contract.template_id,
          opportunity_id: contract.opportunity_id,
          quote_id: contract.quote_id,
          account_id: contract.account_id,
          contact_id: contract.contact_id,
          status: contract.status || "draft",
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
      toast.success("Contract created successfully");
    },
    onError: (error) => {
      toast.error("Error creating contract: " + error.message);
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
      queryClient.invalidateQueries({ queryKey: ["contract"] });
      toast.success("Contract updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating contract: " + error.message);
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contract deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting contract: " + error.message);
    },
  });
}

// ===== E-SIGNATURES =====
export function useESignatures(contractId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["esignatures", contractId, user?.id],
    enabled: !!contractId && !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("contract_esignatures")
        .select("*")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ESignature[];
    },
  });
}

export function useCreateESignature() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sig: Omit<Partial<ESignature>, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("contract_esignatures")
        .insert({
          contract_id: sig.contract_id || "",
          recipient_email: sig.recipient_email || "",
          recipient_name: sig.recipient_name || "",
          status: sig.status || "pending",
          expires_at: sig.expires_at,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["esignatures", variables.contract_id] });
      toast.success("E-signature request sent successfully");
    },
    onError: (error) => {
      toast.error("Error sending e-signature request: " + error.message);
    },
  });
}

export function useUpdateESignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ESignature> & { id: string }) => {
      const { data, error } = await supabase
        .from("contract_esignatures")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["esignatures"] });
      toast.success("E-signature updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating e-signature: " + error.message);
    },
  });
}

// ===== CONTRACT SCANS =====
export function useContractScans(contractId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["contract_scans", contractId, user?.id],
    enabled: !!contractId && !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("contract_scans")
        .select("*")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContractScan[];
    },
  });
}

export function useCreateContractScan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (scan: Omit<Partial<ContractScan>, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("contract_scans")
        .insert({
          contract_id: scan.contract_id || "",
          file_path: scan.file_path,
          file_name: scan.file_name,
          content_type: scan.content_type,
          file_size: scan.file_size,
          ocr_text: scan.ocr_text,
          scan_date: scan.scan_date || new Date().toISOString(),
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contract_scans", variables.contract_id] });
      toast.success("Contract scan uploaded successfully");
    },
    onError: (error) => {
      toast.error("Error uploading contract scan: " + error.message);
    },
  });
}

export function useDeleteContractScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contract_scans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract_scans"] });
      toast.success("Contract scan deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting contract scan: " + error.message);
    },
  });
}
