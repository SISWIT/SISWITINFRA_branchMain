import { useState } from "react";
import { 
  useOpportunities, 
  useCreateOpportunity, 
  useUpdateOpportunity, 
  useDeleteOpportunity,
  useAccounts
} from "@/modules/crm/hooks/useCRM";
import { useCRUD } from "@/core/rbac/usePermissions";
import { z } from "zod";
import { toast } from "sonner";
import { DataTable } from "@/modules/crm/components/DataTable";
import { Button } from "@/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/ui/shadcn/dialog";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";
import { Textarea } from "@/ui/shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/shadcn/select";
import { Eye, MoreHorizontal, Pencil, Trash2, Target, IndianRupee, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/shadcn/dropdown-menu";
import { format } from "date-fns";
import { Badge } from "@/ui/shadcn/badge";
import { PlanLimitBanner } from "@/ui/plan-limit-banner";
import { ExportButton } from "@/ui/export-button";
import { useSearch } from "@/core/hooks/useSearch";
import { SearchBar } from "@/ui/search-bar";
import { FilterBar } from "@/ui/filter-bar";
import type { Opportunity, OpportunityStage } from "@/core/types/crm";

const OPP_FILTERS = [
  {
    key: "stage",
    label: "Stage",
    options: [
      { label: "New", value: "new" },
      { label: "Qualified", value: "qualified" },
      { label: "Proposal", value: "proposal" },
      { label: "Negotiation", value: "negotiation" },
      { label: "Closed Won", value: "closed_won" },
      { label: "Closed Lost", value: "closed_lost" },
    ],
  },
  {
    key: "amount_range",
    label: "Amount",
    options: [
      { label: "Under ₹1L", value: "under_1l" },
      { label: "₹1L – ₹10L", value: "1l_10l" },
      { label: "Above ₹10L", value: "above_10l" },
    ],
  },
];

const OPP_CUSTOM_FILTERS = {
  amount_range: (item: Opportunity, value: string) => {
    const amt = item.amount ?? 0;
    if (value === "under_1l") return amt < 100000;
    if (value === "1l_10l") return amt >= 100000 && amt <= 1000000;
    if (value === "above_10l") return amt > 1000000;
    return true;
  },
};

const OPP_FILTERS_RUPEE = OPP_FILTERS.map((filter) =>
  filter.key === "amount_range"
    ? {
        ...filter,
        options: [
          { label: "Under \u20B91L", value: "under_1l" },
          { label: "\u20B91L - \u20B910L", value: "1l_10l" },
          { label: "Above \u20B910L", value: "above_10l" },
        ],
      }
    : filter,
);

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const STAGE_COLORS: Record<string, string> = {
  new: "bg-secondary text-secondary-foreground",
  qualified: "bg-info/15 text-info",
  proposal: "bg-warning/15 text-warning",
  negotiation: "bg-primary/15 text-primary",
  closed_won: "bg-success/15 text-success",
  closed_lost: "bg-destructive/15 text-destructive",
};

function parseOpportunityDate(value?: string) {
  if (!value) return null;

  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const parsedDate = new Date(normalizedValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export default function OpportunitiesPage() {
  const { data: opportunities = [], isLoading } = useOpportunities();
  const { data: accounts = [] } = useAccounts();
  const createOpp = useCreateOpportunity();
  const updateOpp = useUpdateOpportunity();
  const deleteOpp = useDeleteOpportunity();
  const { canDelete } = useCRUD();

  const { searchQuery, setSearchQuery, activeFilters, setFilter, clearFilters, filteredData, resultCount, totalCount, filterDefs } = useSearch<Opportunity>(opportunities, {
    searchFields: ["name", "stage"],
    filterDefs: OPP_FILTERS_RUPEE,
    customFilters: OPP_CUSTOM_FILTERS,
  });

  const opportunitySchema = z.object({
    name: z.string().min(1, "Opportunity name is required"),
    amount: z.string().optional().refine((val) => !val || !isNaN(parseFloat(val)), "Amount must be a number"),
    probability: z.string().optional().refine((val) => {
      if (!val) return true;
      const num = parseInt(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, "Probability must be between 0 and 100"),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [viewingOpp, setViewingOpp] = useState<Opportunity | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    account_id: "",
    amount: "",
    stage: "new" as OpportunityStage,
    close_date: "",
    probability: "20",
    description: "",
  });

  const openCreateDialog = () => {
    setEditingOpp(null);
    setFormData({
      name: "",
      account_id: "",
      amount: "",
      stage: "new",
      close_date: "",
      probability: "20",
      description: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (opp: Opportunity) => {
    const parsedCloseDate = parseOpportunityDate(opp.close_date);

    setEditingOpp(opp);
    setFormData({
      name: opp.name,
      account_id: opp.account_id || "",
      amount: opp.amount ? opp.amount.toString() : "",
      stage: opp.stage,
      close_date: parsedCloseDate ? format(parsedCloseDate, "yyyy-MM-dd") : "",
      probability: opp.probability ? opp.probability.toString() : "",
      description: opp.description || opp.next_step || "",
    });
    setDialogOpen(true);
  };

  const openViewDialog = (opp: Opportunity) => {
    setViewingOpp(opp);
  };

  const handleSubmit = async () => {
    try {
      opportunitySchema.parse(formData);

      const payload = {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        probability: formData.probability ? parseInt(formData.probability) : undefined,
        close_date: formData.close_date || undefined,
      };

      if (editingOpp) {
        await updateOpp.mutateAsync({ id: editingOpp.id, ...payload });
      } else {
        await createOpp.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An error occurred. Please try again.");
      }
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAccountName = (opp: Opportunity) =>
    opp.account?.name || accounts.find((acc) => acc.id === opp.account_id)?.name || "-";

  const columns = [
    {
      key: "name",
      header: "Opportunity Name",
      cell: (row: Opportunity) => (
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      cell: (row: Opportunity) => (
        <Badge className={STAGE_COLORS[row.stage] || "bg-secondary text-secondary-foreground"}>
          {STAGE_LABELS[row.stage] || row.stage}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Value",
      cell: (row: Opportunity) => (
        <span className="font-medium text-foreground">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "close_date",
      header: "Close Date",
      cell: (row: Opportunity) => {
        const parsedCloseDate = parseOpportunityDate(row.close_date);

        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{parsedCloseDate ? format(parsedCloseDate, "MMM d, yyyy") : "-"}</span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      cell: (row: Opportunity) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(event) => { event.stopPropagation(); openViewDialog(row); }}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(event) => { event.stopPropagation(); openEditDialog(row); }}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {canDelete() && (
            <DropdownMenuItem
              onClick={(event) => { event.stopPropagation(); deleteOpp.mutate(row.id); }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
        <PlanLimitBanner resource="opportunities" className="mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Opportunities</h1>
            <p className="text-muted-foreground">Manage your deals</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search opportunities..." resultCount={resultCount} totalCount={totalCount} />
            <ExportButton data={filteredData} filename="siswit-opportunities" sheetName="Opportunities" isLoading={isLoading} />
          </div>
          <FilterBar filters={filterDefs} activeFilters={activeFilters} onFilterChange={setFilter} onClearAll={clearFilters} />
        </div>

        <DataTable
          data={filteredData}
          columns={columns}
          loading={isLoading}
          onAdd={openCreateDialog}
          onRowClick={openViewDialog}
          addLabel="Add Opportunity"
          searchable={false}
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-md flex-col overflow-hidden p-0">
            <DialogHeader className="shrink-0 border-b px-6 pb-4 pt-6 pr-12">
              <DialogTitle>{editingOpp ? "Edit Opportunity" : "New Opportunity"}</DialogTitle>
              <DialogDescription>
                Capture deal value, timeline, and stage context so pipeline follow-ups stay consistent for the sales team.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Opportunity Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Software License Q1"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Account</Label>
                    <Select value={formData.account_id} onValueChange={(v) => setFormData({ ...formData, account_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>{"Value (\u20B9)"}</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          className="pl-9"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Close Date</Label>
                      <Input
                        type="date"
                        value={formData.close_date}
                        onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Stage</Label>
                      <Select
                        value={formData.stage}
                        onValueChange={(v) => setFormData({ ...formData, stage: v as OpportunityStage })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STAGE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key as OpportunityStage}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Probability (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.probability}
                        onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                        placeholder="20"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Details..."
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createOpp.isPending || updateOpp.isPending}>
                  {editingOpp ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(viewingOpp)} onOpenChange={(open) => !open && setViewingOpp(null)}>
          <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-xl flex-col overflow-hidden p-0">
            <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4">
              <DialogTitle>Opportunity Details</DialogTitle>
              <DialogDescription>
                Full deal context, value, and timeline for this opportunity.
              </DialogDescription>
            </DialogHeader>

            {viewingOpp && (
              <>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                    <p className="text-lg font-semibold">{viewingOpp.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className={STAGE_COLORS[viewingOpp.stage] || "bg-secondary text-secondary-foreground"}>
                        {STAGE_LABELS[viewingOpp.stage] || viewingOpp.stage}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Probability: {viewingOpp.probability ?? 0}%
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Account</p>
                      <p className="mt-2 text-sm">{getAccountName(viewingOpp)}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Value</p>
                      <p className="mt-2 text-sm">{formatCurrency(viewingOpp.amount)}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Close Date</p>
                      <p className="mt-2 text-sm">
                        {(() => {
                          const parsedCloseDate = parseOpportunityDate(viewingOpp.close_date);
                          return parsedCloseDate ? format(parsedCloseDate, "MMM d, yyyy") : "-";
                        })()}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Created</p>
                      <p className="mt-2 text-sm">{format(new Date(viewingOpp.created_at), "MMM d, yyyy")}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-background p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Description</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {viewingOpp.description || viewingOpp.next_step || "No opportunity notes available."}
                    </p>
                  </div>
                </div>

                <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
                  <Button type="button" variant="outline" onClick={() => setViewingOpp(null)}>
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setViewingOpp(null);
                      openEditDialog(viewingOpp);
                    }}
                  >
                    Edit Opportunity
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}
