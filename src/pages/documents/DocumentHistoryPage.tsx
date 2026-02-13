import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAutoDocuments } from "@/hooks/useDocuments";
import { 
  FileStack, Search, Download, Eye, Filter, Calendar,
  CheckCircle2, Clock, Send, AlertCircle, FileText
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusConfig: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  signed: { icon: CheckCircle2, bg: "bg-primary/10", text: "text-primary", label: "Signed" },
  pending: { icon: Clock, bg: "bg-accent/10", text: "text-accent", label: "Pending" },
  approved: { icon: CheckCircle2, bg: "bg-chart-3/10", text: "text-chart-3", label: "Approved" },
  sent: { icon: Send, bg: "bg-chart-4/10", text: "text-chart-4", label: "Sent" },
  draft: { icon: FileText, bg: "bg-muted", text: "text-muted-foreground", label: "Draft" },
  expired: { icon: AlertCircle, bg: "bg-destructive/10", text: "text-destructive", label: "Expired" },
};

const DocumentHistoryPage = () => {
  const { data: documents = [], isLoading } = useAutoDocuments();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredDocuments = documents.filter((doc: any) => {
    const matchesSearch = (doc.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.id || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Document History</h1>
            <p className="text-muted-foreground">View and manage all generated documents</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export List
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Quote">Quote</SelectItem>
              <SelectItem value="NDA">NDA</SelectItem>
              <SelectItem value="Invoice">Invoice</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Documents Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileStack className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Loading documents...</h3>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileStack className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No documents found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Document</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDocuments.map((doc: any) => {
                    const status = statusConfig[doc.status] || statusConfig.draft;
                    const StatusIcon = status.icon;
                    return (
                      <tr key={doc.id} className="hover:bg-secondary/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileStack className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{doc.name || "Untitled"}</div>
                              <div className="text-sm text-muted-foreground">{doc.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                            {doc.type || "Document"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">Recently created</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
};

export default DocumentHistoryPage;
