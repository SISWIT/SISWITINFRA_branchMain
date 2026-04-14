"use client";

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, FileStack, Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/ui/shadcn/card";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { Badge } from "@/ui/shadcn/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/shadcn/table";
import { usePortalScope } from "@/workspaces/portal/hooks/usePortalScope";
import { tenantPortalPath } from "@/core/utils/routes";
import { useAutoDocuments } from "@/modules/documents/hooks/useDocuments";

export default function CustomerDocumentsPage() {
  const navigate = useNavigate();
  const { tenantSlug = "" } = useParams<{ tenantSlug: string }>();
  const { organizationLoading, isReady } = usePortalScope();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: documents = [], isLoading } = useAutoDocuments("portal");
  const filteredDocuments = useMemo(
    () =>
      documents.filter((doc) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
          (doc.name || "").toLowerCase().includes(query) ||
          (doc.type || "").toLowerCase().includes(query)
        );
      }),
    [documents, searchQuery],
  );

  if (organizationLoading || isLoading || !isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleView = (doc: any) => {
    if (doc.signature_id) {
      navigate(tenantPortalPath(tenantSlug, `pending-signatures/${doc.signature_id}`));
    } else {
      // For documents they created but no signature is assigned to them
      // We could link to a document viewer if we had one, but for now
      // we'll try to use the signature page with just the ID and hope it handles it
      // or show a neutral viewer.
      navigate(tenantPortalPath(tenantSlug, `pending-signatures/${doc.id}?type=document&view_only=true`));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Documents</h1>
          <p className="text-muted-foreground">View your generated and assigned documents</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileStack className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground">You don't have any generated or assigned documents yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name || "Unnamed"}</TableCell>
                    <TableCell className="capitalize">{doc.type || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.status || "Draft"}</Badge>
                    </TableCell>
                    <TableCell>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleView(doc)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
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
