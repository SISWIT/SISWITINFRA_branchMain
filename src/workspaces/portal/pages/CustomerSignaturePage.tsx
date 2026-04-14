"use client";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, FileSignature, FileText, Loader2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/shadcn/card";
import { Button } from "@/ui/shadcn/button";
import { Badge } from "@/ui/shadcn/badge";
import { Separator } from "@/ui/shadcn/separator";
import { supabase } from "@/core/api/client";
import { getSignedUrl } from "@/core/utils/upload";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { usePortalScope } from "@/workspaces/portal/hooks/usePortalScope";

type SignatureKind = "contract" | "document";

interface PortalSignatureRecord {
  id: string;
  kind: SignatureKind;
  status: string;
  createdAt: string | null;
  signedAt: string | null;
  title: string;
  previewContent: string | null;
  previewFileUrl: string | null;
  previewFileName: string | null;
}

function normalizeSignatureType(value: string | null): SignatureKind | null {
  if (value === "contract" || value === "document") {
    return value;
  }
  return null;
}

export default function CustomerSignaturePage() {
  const { organizationId, portalEmail, userId, isReady } = usePortalScope();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const selectedType = normalizeSignatureType(searchParams.get("type"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: signature, isLoading } = useQuery({
    queryKey: ["portal-signature", id, organizationId, portalEmail, selectedType || "auto"],
    enabled: !!id && isReady,
    queryFn: async () => {
      if (!id || !organizationId || !portalEmail) throw new Error("Missing context");

      const fetchContractSignature = async (): Promise<PortalSignatureRecord | null> => {
        const { data, error } = await supabase
          .from("contract_esignatures")
          .select("id, status, signed_at, created_at, contracts:contracts(name,contract_number,content)")
          .eq("id", id)
          .eq("organization_id", organizationId)
          .ilike("signer_email", portalEmail)
          .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        const contract = (data as { contracts?: { name?: string | null; contract_number?: string | null; content?: string | null } | null }).contracts;
        return {
          id: data.id,
          kind: "contract",
          status: data.status || "pending",
          createdAt: data.created_at,
          signedAt: data.signed_at,
          title: contract?.name || contract?.contract_number || "Contract",
          previewContent: contract?.content || null,
          previewFileUrl: null,
          previewFileName: null,
        };
      };

      const fetchDocumentSignature = async (): Promise<PortalSignatureRecord | null> => {
        const { data, error } = await supabase
          .from("document_esignatures")
          .select("id, status, signed_at, created_at, document:auto_documents(id, name,content,file_path,file_name,created_by)")
          .eq("id", id)
          .eq("organization_id", organizationId)
          .or(`recipient_email.ilike.${portalEmail},signer_email.ilike.${portalEmail}`)
          .maybeSingle();

        if (error) throw error;
        
        let sigId = data?.id || "";
        let sigStatus = data?.status || "preview";
        let docRef = (data as any)?.document;

        if (!data) {
          // Try fetching document directly by ID if user is creator
          const { data: directDoc, error: docError } = await supabase
            .from("auto_documents")
            .select("id, name,content,file_path,file_name,created_by,status,created_at")
            .eq("id", id)
            .eq("organization_id", organizationId)
            .eq("created_by", userId ?? "")
            .maybeSingle();
          
          if (docError) throw docError;
          if (!directDoc) return null;
          docRef = directDoc;
          sigStatus = "preview";
          sigId = directDoc.id;
        }

        let previewFileUrl: string | null = null;
        if (docRef?.file_path) {
          try {
            previewFileUrl = await getSignedUrl("documents", docRef.file_path);
          } catch (previewError) {
            console.error("Failed to build signed URL for document preview", previewError);
          }
        }

        return {
          id: sigId,
          kind: "document",
          status: sigStatus,
          createdAt: ((data?.created_at || (docRef as any)?.created_at) as string) || null,
          signedAt: data?.signed_at || null,
          title: docRef?.name || "Document",
          previewContent: docRef?.content || null,
          previewFileUrl,
          previewFileName: docRef?.file_name || null,
        };
      };

      if (selectedType === "contract") {
        return fetchContractSignature();
      }
      if (selectedType === "document") {
        return fetchDocumentSignature();
      }

      const contractRecord = await fetchContractSignature();
      if (contractRecord) return contractRecord;
      return fetchDocumentSignature();
    },
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      if (!id || !organizationId || !portalEmail || !signature) return;

      if (signature.kind === "contract") {
        const { error } = await supabase
          .from("contract_esignatures")
          .update({ status: "signed", signed_at: new Date().toISOString() })
          .eq("id", id)
          .eq("organization_id", organizationId)
          .ilike("signer_email", portalEmail);
        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from("document_esignatures")
        .update({ status: "signed", signed_at: new Date().toISOString() })
        .eq("id", id)
        .eq("organization_id", organizationId)
        .or(`recipient_email.ilike.${portalEmail},signer_email.ilike.${portalEmail}`);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document signed successfully");
      queryClient.invalidateQueries({ queryKey: ["portal-signature", id] });
      queryClient.invalidateQueries({ queryKey: ["portal-pending-signatures"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!id || !organizationId || !portalEmail || !signature) return;

      if (signature.kind === "contract") {
        const { error } = await supabase
          .from("contract_esignatures")
          .update({ status: "rejected" })
          .eq("id", id)
          .eq("organization_id", organizationId)
          .ilike("signer_email", portalEmail);
        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from("document_esignatures")
        .update({ status: "rejected" })
        .eq("id", id)
        .eq("organization_id", organizationId)
        .or(`recipient_email.ilike.${portalEmail},signer_email.ilike.${portalEmail}`);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document signature rejected");
      queryClient.invalidateQueries({ queryKey: ["portal-signature", id] });
      queryClient.invalidateQueries({ queryKey: ["portal-pending-signatures"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!signature) {
    return (
      <div className="text-center py-12">
        <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Signature request not found</h2>
        <Button variant="link" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  const isPending = signature.status === "pending";
  const hasFilePreview = Boolean(signature.previewFileUrl);

  const handleViewDocument = () => {
    if (!signature.previewFileUrl) {
      toast.error("Document file is not available.");
      return;
    }

    window.open(signature.previewFileUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Document Signature</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{signature.title}</CardTitle>
              <CardDescription>
                Request sent on {signature.createdAt ? format(new Date(signature.createdAt), "PPP") : "—"}
              </CardDescription>
            </div>
            <Badge variant={isPending ? "outline" : "secondary"} className={signature.status === "signed" ? "bg-success/20 text-success-foreground" : ""}>
              {(signature.status || "pending").charAt(0).toUpperCase() + (signature.status || "pending").slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> Document
            </h3>
            <div className="rounded border bg-background p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium truncate">{signature.title}</p>
                <p className="text-sm text-muted-foreground">Open the document in a new tab to review before signing.</p>
              </div>
              <Button variant="outline" onClick={handleViewDocument} disabled={!hasFilePreview}>
                View Document
              </Button>
            </div>
            {!hasFilePreview && <p className="text-xs text-muted-foreground">Document file preview is not available for this record.</p>}
          </div>

          <Separator />

          {isPending ? (
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Clock className="h-4 w-4" /> Pending your signature
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="text-destructive" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending || signMutation.isPending}>
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
                <Button onClick={() => signMutation.mutate()} disabled={signMutation.isPending || rejectMutation.isPending}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Sign Document
                </Button>
              </div>
            </div>
          ) : signature.status === "signed" ? (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4 flex items-center gap-3 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <p className="font-semibold">Document Signed</p>
                <p className="text-sm">You signed this document on {signature.signedAt ? format(new Date(signature.signedAt), "PPP p") : "—"}</p>
              </div>
            </div>
          ) : (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3 text-destructive">
              <XCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Signature Rejected</p>
                <p className="text-sm">This signature request was rejected.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
