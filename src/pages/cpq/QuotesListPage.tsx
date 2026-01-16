import { useState } from "react";
import { FileText, Plus, Search, Eye, Edit, Trash2, Send, CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: Clock },
  pending_approval: { label: "Pending Approval", color: "bg-warning/20 text-warning-foreground", icon: Clock },
  approved: { label: "Approved", color: "bg-info/20 text-info-foreground", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-destructive/20 text-destructive", icon: XCircle },
  sent: { label: "Sent", color: "bg-primary/20 text-primary", icon: Send },
  accepted: { label: "Accepted", color: "bg-success/20 text-success-foreground", icon: CheckCircle },
  expired: { label: "Expired", color: "bg-destructive/20 text-destructive", icon: XCircle },
};

export default function QuotesListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["quotes-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, accounts(name), contacts(first_name, last_name), opportunities(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "pending_approval" | "approved" | "rejected" | "sent" | "accepted" | "expired" }) => {
      const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes-list"] });
      toast.success("Quote status updated");
    },
    onError: (error) => toast.error("Failed to update: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes-list"] });
      toast.success("Quote deleted");
    },
    onError: (error) => toast.error("Failed to delete: " + error.message),
  });

  const filteredQuotes = quotes?.filter((quote) => {
    const matchesSearch =
      quote.quote_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.accounts?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || quote.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quotes</h1>
            <p className="text-muted-foreground">Manage and track all your quotes</p>
          </div>
          <Button asChild>
            <Link to="/dashboard/cpq/quotes/new"><Plus className="h-4 w-4 mr-2" />Create Quote</Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by quote number or account..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant={selectedStatus === null ? "default" : "outline"} size="sm" onClick={() => setSelectedStatus(null)}>All</Button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <Button key={status} variant={selectedStatus === status ? "default" : "outline"} size="sm" onClick={() => setSelectedStatus(status)}>
                {config.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Quotes Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} className="h-16 animate-pulse bg-muted/20" />
                    </TableRow>
                  ))
                ) : filteredQuotes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No quotes found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes?.map((quote) => {
                    const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
                    const StatusIcon = statusConfig.icon;
                    return (
                      <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/dashboard/cpq/quotes/${quote.id}`)}>
                        <TableCell className="font-medium">{quote.quote_number || "—"}</TableCell>
                        <TableCell>{quote.accounts?.name || "—"}</TableCell>
                        <TableCell>{quote.opportunities?.name || "—"}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(quote.total || 0)}</TableCell>
                        <TableCell>{quote.valid_until ? format(new Date(quote.valid_until), "MMM d, yyyy") : "—"}</TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">Actions</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/cpq/quotes/${quote.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/cpq/quotes/${quote.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />Edit
                              </DropdownMenuItem>
                              {quote.status === "draft" && (
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: quote.id, status: "pending_approval" })}>
                                  <Send className="h-4 w-4 mr-2" />Submit for Approval
                                </DropdownMenuItem>
                              )}
                              {quote.status === "pending_approval" && (
                                <>
                                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: quote.id, status: "approved" })}>
                                    <CheckCircle className="h-4 w-4 mr-2" />Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: quote.id, status: "rejected" })}>
                                    <XCircle className="h-4 w-4 mr-2" />Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {quote.status === "approved" && (
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/clm/contracts/new?quote_id=${quote.id}`)}>
                                  <ArrowRight className="h-4 w-4 mr-2" />Convert to Contract
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(quote.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
