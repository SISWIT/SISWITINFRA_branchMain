import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Download, Send, CheckCircle, XCircle, Edit, PenTool, FileText, Clock, Building, User, Calendar, DollarSign, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { format } from "date-fns";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  pending_review: { label: "Pending Review", color: "bg-warning/20 text-warning-foreground" },
  pending_approval: { label: "Pending Approval", color: "bg-warning/20 text-warning-foreground" },
  approved: { label: "Approved", color: "bg-info/20 text-info-foreground" },
  sent: { label: "Sent for Signature", color: "bg-primary/20 text-primary" },
  signed: { label: "Signed", color: "bg-success/20 text-success-foreground" },
  expired: { label: "Expired", color: "bg-destructive/20 text-destructive" },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground" },
};

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: contract, isLoading , user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("contracts")
        .select("*, accounts(name, email, phone), contacts(first_name, last_name, email), quotes(quote_number, total)")
        .eq("id", id)
        .or(`owner_id.eq.${user.id},created_by.eq.${user.id}`accounts(name, email, phone), contacts(first_name, last_name, email), quotes(quote_number, total)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const updates: any = { status };
      if (status === "signed") {
        updates.signed_at = new Date().toISOString();
      }
      const { error } = await supabase.from("contracts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-detail", id] });
      toast.success("Contract status updated");
    },
    onError: (error) => toast.error("Failed to update: " + error.message),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Contract not found</h2>
          <Button variant="link" onClick={() => navigate("/dashboard/clm/contracts")}>Go back to contracts</Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[contract.status] || STATUS_CONFIG.draft;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{contract.contract_number || contract.name}</h1>
                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
              </div>
              <p className="text-muted-foreground">Created on {format(new Date(contract.created_at), "MMMM d, yyyy")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {contract.status === "draft" && (
              <>
                <Button variant="outline" onClick={() => navigate(`/dashboard/clm/contracts/${id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />Edit
                </Button>
                <Button onClick={() => updateStatusMutation.mutate("pending_review")}>
                  <Send className="h-4 w-4 mr-2" />Submit for Review
                </Button>
              </>
            )}
            {contract.status === "pending_review" && (
              <>
                <Button variant="outline" onClick={() => updateStatusMutation.mutate("draft")}>
                  <XCircle className="h-4 w-4 mr-2" />Send Back
                </Button>
                <Button onClick={() => updateStatusMutation.mutate("approved")}>
                  <CheckCircle className="h-4 w-4 mr-2" />Approve
                </Button>
              </>
            )}
            {contract.status === "approved" && (
              <Button asChild>
                <Link to={`/dashboard/clm/contracts/${id}/sign`}>
                  <PenTool className="h-4 w-4 mr-2" />Send for Signature
                </Link>
              </Button>
            )}
            {contract.status === "sent" && (
              <Button onClick={() => updateStatusMutation.mutate("signed")}>
                <CheckCircle className="h-4 w-4 mr-2" />Mark as Signed
              </Button>
            )}
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />Export PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Details */}
            <Card>
              <CardHeader>
                <CardTitle>{contract.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Account</p>
                      <p className="font-medium">{contract.accounts?.name || "—"}</p>
                      <p className="text-sm text-muted-foreground">{contract.accounts?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <p className="font-medium">{contract.contacts ? `${contract.contacts.first_name} ${contract.contacts.last_name}` : "—"}</p>
                      <p className="text-sm text-muted-foreground">{contract.contacts?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contract Period</p>
                      <p className="font-medium">
                        {contract.start_date ? format(new Date(contract.start_date), "MMM d, yyyy") : "—"} to{" "}
                        {contract.end_date ? format(new Date(contract.end_date), "MMM d, yyyy") : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contract Value</p>
                      <p className="font-medium text-lg">{formatCurrency(contract.value || 0)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Content */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Content</CardTitle>
              </CardHeader>
              <CardContent>
                {contract.content ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{contract.content}</pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No content available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contract Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract #</span>
                    <span className="font-medium">{contract.contract_number || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Value</span>
                    <span className="font-semibold text-primary">{formatCurrency(contract.value || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span>{format(new Date(contract.created_at), "MMM d, yyyy")}</span>
                  </div>
                  {contract.signed_at && (
                    <div className="flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-success" />
                      <span className="text-muted-foreground">Signed:</span>
                      <span>{format(new Date(contract.signed_at), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>

                {contract.quotes && (
                  <>
                    <Separator />
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">From Quote</p>
                      <p className="font-medium">{contract.quotes.quote_number}</p>
                      <p className="text-sm">{formatCurrency(contract.quotes.total || 0)}</p>
                    </div>
                  </>
                )}

                {contract.status === "approved" && (
                  <>
                    <Separator />
                    <Button className="w-full" asChild>
                      <Link to={`/dashboard/clm/contracts/${id}/sign`}>
                        <PenTool className="h-4 w-4 mr-2" />Send for Signature
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Lifecycle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Lifecycle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["draft", "pending_review", "approved", "sent", "signed"].map((stage, i) => {
                    const stageConfig = STATUS_CONFIG[stage];
                    const isActive = stage === contract.status;
                    const isPast = ["draft", "pending_review", "approved", "sent", "signed"].indexOf(contract.status) > i;
                    return (
                      <div key={stage} className={`flex items-center gap-3 p-2 rounded-lg ${isActive ? "bg-primary/10 border border-primary/30" : isPast ? "opacity-60" : "opacity-40"}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${isPast || isActive ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {isPast ? <CheckCircle className="h-4 w-4" /> : i + 1}
                        </div>
                        <span className={isActive ? "font-medium" : ""}>{stageConfig.label}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
