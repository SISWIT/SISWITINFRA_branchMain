import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { AutoDocument, DocumentTemplate, DocumentVersion, DocumentPermission } from "@/types/documents";
import { toast } from "sonner";

// ===== DOCUMENT TEMPLATES =====
export function useDocumentTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["document_templates", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .or(`created_by.eq.${user.id},is_public.eq.true`)
        .order("name");
      if (error) throw error;
      return data as DocumentTemplate[];
    },
  });
}

export function useCreateDocumentTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: Omit<Partial<DocumentTemplate>, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("document_templates")
        .insert({
          name: template.name || "",
          type: template.type || "other",
          description: template.description,
          content: template.content || "",
          variables: template.variables,
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
      queryClient.invalidateQueries({ queryKey: ["document_templates"] });
      toast.success("Document template created successfully");
    },
    onError: (error) => {
      toast.error("Error creating document template: " + error.message);
    },
  });
}

export function useUpdateDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DocumentTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("document_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document_templates"] });
      toast.success("Document template updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating document template: " + error.message);
    },
  });
}

export function useDeleteDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("document_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document_templates"] });
      toast.success("Document template deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting document template: " + error.message);
    },
  });
}

// ===== AUTO DOCUMENTS =====
export function useAutoDocuments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["auto_documents", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("auto_documents")
        .select("*")
        .or(`owner_id.eq.${user.id},created_by.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AutoDocument[];
    },
  });
}

export function useAutoDocument(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["auto_document", id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("auto_documents")
        .select("*")
        .eq("id", id)
        .or(`owner_id.eq.${user.id},created_by.eq.${user.id}`)
        .single();
      if (error) throw error;
      return data as AutoDocument;
    },
  });
}

export function useCreateAutoDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (doc: Omit<Partial<AutoDocument>, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("auto_documents")
        .insert({
          name: doc.name || "",
          type: doc.type || "other",
          status: doc.status || "draft",
          content: doc.content,
          template_id: doc.template_id,
          related_entity_type: doc.related_entity_type,
          related_entity_id: doc.related_entity_id,
          file_path: doc.file_path,
          file_name: doc.file_name,
          format: doc.format,
          file_size: doc.file_size,
          generated_from: doc.generated_from,
          owner_id: user?.id,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto_documents"] });
      toast.success("Document created successfully");
    },
    onError: (error) => {
      toast.error("Error creating document: " + error.message);
    },
  });
}

export function useUpdateAutoDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AutoDocument> & { id: string }) => {
      const { data, error } = await supabase
        .from("auto_documents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto_documents"] });
      queryClient.invalidateQueries({ queryKey: ["auto_document"] });
      toast.success("Document updated successfully");
    },
    onError: (error) => {
      toast.error("Error updating document: " + error.message);
    },
  });
}

export function useDeleteAutoDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("auto_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto_documents"] });
      toast.success("Document deleted successfully");
    },
    onError: (error) => {
      toast.error("Error deleting document: " + error.message);
    },
  });
}

// ===== DOCUMENT VERSIONS =====
export function useDocumentVersions(documentId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["document_versions", documentId, user?.id],
    enabled: !!documentId && !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", documentId)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data as DocumentVersion[];
    },
  });
}

export function useCreateDocumentVersion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (version: Omit<Partial<DocumentVersion>, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("document_versions")
        .insert({
          document_id: version.document_id || "",
          version_number: version.version_number || 1,
          content: version.content,
          file_path: version.file_path,
          file_name: version.file_name,
          format: version.format,
          file_size: version.file_size,
          change_summary: version.change_summary,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["document_versions", variables.document_id] });
      toast.success("Document version created successfully");
    },
    onError: (error) => {
      toast.error("Error creating document version: " + error.message);
    },
  });
}

// ===== DOCUMENT PERMISSIONS =====
export function useDocumentPermissions(documentId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["document_permissions", documentId, user?.id],
    enabled: !!documentId && !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("document_permissions")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DocumentPermission[];
    },
  });
}

export function useShareDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (permission: Omit<Partial<DocumentPermission>, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("document_permissions")
        .insert({
          document_id: permission.document_id || "",
          user_id: permission.user_id || "",
          permission_type: permission.permission_type || "view",
          shared_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["document_permissions", variables.document_id] });
      toast.success("Document shared successfully");
    },
    onError: (error) => {
      toast.error("Error sharing document: " + error.message);
    },
  });
}

export function useRemoveDocumentPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("document_permissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document_permissions"] });
      toast.success("Permission removed successfully");
    },
    onError: (error) => {
      toast.error("Error removing permission: " + error.message);
    },
  });
}
