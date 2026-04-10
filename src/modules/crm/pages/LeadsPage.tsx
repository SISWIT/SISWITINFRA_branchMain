import { useState } from "react";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from "@/modules/crm/hooks/useCRM";
import { z } from "zod";
import { useCRUD } from "@/core/rbac/usePermissions";
import { DataTable } from "@/modules/crm/components/DataTable";
import { Badge } from "@/ui/shadcn/badge";
import { Button } from "@/ui/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/shadcn/dialog";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";
import { Textarea } from "@/ui/shadcn/textarea";
import { LEAD_STATUS_COLORS } from "@/core/types/crm";
import type { Lead, LeadStatus, LeadSource } from "@/core/types/crm";
import { format } from "date-fns";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/shadcn/dropdown-menu";
import { toast } from "sonner";
import { PlanLimitBanner } from "@/ui/plan-limit-banner";
import { ExportButton } from "@/ui/export-button";
import { useSearch } from "@/core/hooks/useSearch";
import { SearchBar } from "@/ui/search-bar";
import { FilterBar } from "@/ui/filter-bar";
import type { Lead as LeadType } from "@/core/types/crm";

const LEAD_FILTERS = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "New", value: "new" },
      { label: "Contacted", value: "contacted" },
      { label: "Qualified", value: "qualified" },
      { label: "Unqualified", value: "unqualified" },
    ],
  },
  {
    key: "source",
    label: "Source",
    options: [
      { label: "Website", value: "website" },
      { label: "Referral", value: "referral" },
      { label: "Cold Call", value: "cold_call" },
      { label: "Social Media", value: "social_media" },
      { label: "Other", value: "other" },
    ],
  },
];

export default function LeadsPage() {
  const { data: leads = [], isLoading } = useLeads();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const { canDelete } = useCRUD();

  const { searchQuery, setSearchQuery, activeFilters, setFilter, clearFilters, filteredData, resultCount, totalCount, filterDefs } = useSearch<LeadType>(leads, {
    searchFields: ["first_name", "last_name", "email", "company", "phone"],
    filterDefs: LEAD_FILTERS,
  });
  
  const leadSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional().refine((val) => !val || /^\+?[0-9\s\-()]{7,15}$/.test(val), "Please enter a valid phone number"),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({ first_name: "", last_name: "", email: "", phone: "", company: "", job_title: "", status: "new" as LeadStatus, source: "other" as LeadSource, description: "" });

  const openCreateDialog = () => { setEditingLead(null); setFormData({ first_name: "", last_name: "", email: "", phone: "", company: "", job_title: "", status: "new", source: "other", description: "" }); setDialogOpen(true); };
  const openEditDialog = (lead: Lead) => { setEditingLead(lead); setFormData({ first_name: lead.first_name, last_name: lead.last_name, email: lead.email || "", phone: lead.phone || "", company: lead.company || "", job_title: lead.job_title || "", status: lead.status, source: lead.source || "other", description: lead.description || "" }); setDialogOpen(true); };
  const openViewDialog = (lead: Lead) => { setViewingLead(lead); };

  const formatSourceLabel = (source?: LeadSource) => {
    if (!source) return "-";
    return source
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleSubmit = async () => {
    try {
      leadSchema.parse(formData);

      if (editingLead) { await updateLead.mutateAsync({ id: editingLead.id, ...formData }); }
      else { await createLead.mutateAsync(formData); }
      setDialogOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An error occurred. Please try again.");
      }
    }
  };

  const columns = [
    { key: "name", header: "Name", cell: (lead: Lead) => <span className="font-medium">{lead.first_name} {lead.last_name}</span> },
    { key: "company", header: "Company" },
    { key: "email", header: "Email" },
    { key: "status", header: "Status", cell: (lead: Lead) => <Badge className={LEAD_STATUS_COLORS[lead.status]}>{lead.status}</Badge> },
    { key: "source", header: "Source", cell: (lead: Lead) => lead.source?.replace("_", " ") },
    { key: "created_at", header: "Created", cell: (lead: Lead) => format(new Date(lead.created_at), "MMM d, yyyy") },
    { key: "actions", header: "", cell: (lead: Lead) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(event) => { event.stopPropagation(); openViewDialog(lead); }}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(event) => { event.stopPropagation(); openEditDialog(lead); }}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          {canDelete() && (
            <DropdownMenuItem
              onClick={(event) => { event.stopPropagation(); deleteLead.mutate(lead.id); }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ];

  return (
    <div className="space-y-6">
        <PlanLimitBanner resource="leads" className="mb-4" />
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold">Leads</h1><p className="text-muted-foreground">Manage your sales leads</p></div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search leads..." resultCount={resultCount} totalCount={totalCount} />
            <ExportButton data={filteredData} filename="siswit-leads" sheetName="Leads" isLoading={isLoading} />
          </div>
          <FilterBar filters={filterDefs} activeFilters={activeFilters} onFilterChange={setFilter} onClearAll={clearFilters} />
        </div>
        <DataTable
          data={filteredData}
          columns={columns}
          loading={isLoading}
          onAdd={openCreateDialog}
          onRowClick={openViewDialog}
          addLabel="Add Lead"
          searchable={false}
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-xl flex-col overflow-hidden p-0">
            <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4">
              <DialogTitle>{editingLead ? "Edit Lead" : "Add Lead"}</DialogTitle>
              <DialogDescription>
                Capture contact details and lead context so follow-ups stay consistent for the sales team.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 space-y-4 overflow-y-auto px-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lead-first-name">First Name</Label>
                    <Input
                      id="lead-first-name"
                      placeholder="e.g. John"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-last-name">Last Name</Label>
                    <Input
                      id="lead-last-name"
                      placeholder="e.g. Doe"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-email">Email</Label>
                  <Input
                    id="lead-email"
                    type="email"
                    placeholder="e.g. john@acme.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-phone">Phone</Label>
                  <Input
                    id="lead-phone"
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-company">Company</Label>
                  <Input
                    id="lead-company"
                    placeholder="e.g. Acme Technologies"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-job-title">Job Title</Label>
                  <Input
                    id="lead-job-title"
                    placeholder="e.g. Procurement Manager"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as LeadStatus })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="unqualified">Unqualified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v as LeadSource })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="cold_call">Cold Call</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-description">Description</Label>
                  <Textarea
                    id="lead-description"
                    placeholder="Lead notes, requirements, pain points, and next follow-up action."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="shrink-0 border-t border-border/60 bg-background px-6 py-4">
                <Button type="submit" className="w-full" disabled={createLead.isPending || updateLead.isPending}>
                  {editingLead ? "Update Lead" : "Create Lead"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(viewingLead)} onOpenChange={(open) => !open && setViewingLead(null)}>
          <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-xl flex-col overflow-hidden p-0">
            <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4">
              <DialogTitle>Lead Details</DialogTitle>
              <DialogDescription>
                Full profile and sales context for this lead.
              </DialogDescription>
            </DialogHeader>

            {viewingLead && (
              <>
                <div className="min-h-0 space-y-4 overflow-y-auto px-6 py-4">
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                    <p className="text-lg font-semibold">
                      {viewingLead.first_name} {viewingLead.last_name}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className={LEAD_STATUS_COLORS[viewingLead.status]}>
                        {viewingLead.status}
                      </Badge>
                      <Badge variant="outline">{formatSourceLabel(viewingLead.source)}</Badge>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</p>
                      <p className="mt-2 text-sm">{viewingLead.email || "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Phone</p>
                      <p className="mt-2 text-sm">{viewingLead.phone || "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Company</p>
                      <p className="mt-2 text-sm">{viewingLead.company || "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Job Title</p>
                      <p className="mt-2 text-sm">{viewingLead.job_title || "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Created</p>
                      <p className="mt-2 text-sm">{format(new Date(viewingLead.created_at), "MMM d, yyyy")}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Last Updated</p>
                      <p className="mt-2 text-sm">{format(new Date(viewingLead.updated_at), "MMM d, yyyy")}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-background p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Description</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {viewingLead.description || "No lead description available."}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 border-t border-border/60 bg-background px-6 py-4">
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setViewingLead(null)}>
                      Close
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setViewingLead(null);
                        openEditDialog(viewingLead);
                      }}
                    >
                      Edit Lead
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}
