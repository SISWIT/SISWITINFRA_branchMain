"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/ui/shadcn/card";
import { Badge } from "@/ui/shadcn/badge";
import { Button } from "@/ui/shadcn/button";
import { supabase } from "@/core/api/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/shadcn/table";
import { usePortalScope } from "@/workspaces/portal/hooks/usePortalScope";

type SignatureKind = "contract" | "document";

interface PendingSignature {
  id: string;
  signatureType: SignatureKind;
  itemLabel: string;
  recipientName: string | null;
  recipientEmail: string | null;
  status: string | null;
  createdAt: string | null;
}

export default function CustomerPendingSignaturesPage() {
  const { organizationId, organizationLoading, portalEmail, contactId, accountId, isReady } = usePortalScope();
  const [signatures, setSignatures] = useState<PendingSignature[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSignatures = async () => {
      setIsLoading(true);

      if (!organizationId || !portalEmail) {
        setSignatures([]);
        setIsLoading(false);
        return;
      }

      let contractIds: string[] = [];
      const contractLookup = supabase.from("contracts").select("id").eq("organization_id", organizationId);
      let scopedContractLookup = contractLookup;
      if (contactId) scopedContractLookup = scopedContractLookup.eq("contact_id", contactId);
      else if (accountId) scopedContractLookup = scopedContractLookup.eq("account_id", accountId);
      else scopedContractLookup = scopedContractLookup.eq("customer_email", portalEmail);

      const { data: userContracts } = await scopedContractLookup;
      contractIds = userContracts?.map((contract) => contract.id) || [];

      const [contractSignaturesRes, documentSignaturesRes] = await Promise.all([
        contractIds.length > 0
          ? supabase
              .from("contract_esignatures")
              .select("id, signer_name, signer_email, status, created_at, contracts:contracts(contract_number,name)")
              .in("contract_id", contractIds)
              .ilike("signer_email", portalEmail)
              .eq("status", "pending")
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("document_esignatures")
          .select("id, recipient_name, recipient_email, status, created_at, document:auto_documents(name)")
          .eq("organization_id", organizationId)
          .or(`recipient_email.ilike.${portalEmail},signer_email.ilike.${portalEmail}`)
          .eq("status", "pending"),
      ]);

      if (contractSignaturesRes.error || documentSignaturesRes.error) {
        setSignatures([]);
        setIsLoading(false);
        return;
      }

      const contractSignatures: PendingSignature[] = (contractSignaturesRes.data || []).map((sig) => {
        const contract = (sig as { contracts?: { contract_number?: string | null; name?: string | null } | null }).contracts;
        return {
          id: sig.id,
          signatureType: "contract",
          itemLabel: contract?.name || contract?.contract_number || "Contract",
          recipientName: (sig as { signer_name?: string | null }).signer_name || null,
          recipientEmail: (sig as { signer_email?: string | null }).signer_email || null,
          status: sig.status,
          createdAt: sig.created_at,
        };
      });

      const documentSignatures: PendingSignature[] = (documentSignaturesRes.data || []).map((sig) => ({
        id: sig.id,
        signatureType: "document",
        itemLabel:
          (sig as { document?: { name?: string | null } | null }).document?.name ||
          "Document",
        recipientName: (sig as { recipient_name?: string | null }).recipient_name || null,
        recipientEmail: (sig as { recipient_email?: string | null }).recipient_email || null,
        status: sig.status,
        createdAt: sig.created_at,
      }));

      const combined = [...contractSignatures, ...documentSignatures].sort((a, b) => {
        const aTs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTs - aTs;
      });

      setSignatures(combined);
      setIsLoading(false);
    };

    if (!organizationLoading) {
      void fetchSignatures();
    }
  }, [organizationId, organizationLoading, portalEmail, accountId, contactId]);

  const hasRows = useMemo(() => signatures.length > 0, [signatures.length]);

  if (organizationLoading || isLoading || !isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pending Signatures</h1>
          <p className="text-muted-foreground">Contracts and documents waiting for your signature</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {!hasRows ? (
            <div className="text-center py-12">
              <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pending signatures</h3>
              <p className="text-muted-foreground">You don't have any contracts or documents waiting for your signature.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signatures.map((sig) => (
                  <TableRow key={`${sig.signatureType}-${sig.id}`}>
                    <TableCell className="font-medium">{sig.itemLabel}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {sig.signatureType === "document" ? (
                          <span className="inline-flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Document
                          </span>
                        ) : (
                          "Contract"
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{sig.recipientName || sig.recipientEmail || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </TableCell>
                    <TableCell>{sig.createdAt ? new Date(sig.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`${sig.id}?type=${sig.signatureType}`}>View & Sign</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
