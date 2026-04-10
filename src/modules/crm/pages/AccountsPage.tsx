import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
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
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe,
  Building2,
  MapPin,
  FileText,
  Mail,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/ui/shadcn/dropdown-menu";
import { PlanLimitBanner } from "@/ui/plan-limit-banner";
import { ExportButton } from "@/ui/export-button";
import { useSearch } from "@/core/hooks/useSearch";
import { SearchBar } from "@/ui/search-bar";
import { FilterBar } from "@/ui/filter-bar";

const ACCOUNT_FILTERS = [
  {
    key: "industry",
    label: "Industry",
    options: [
      { label: "Technology", value: "Technology" },
      { label: "Finance", value: "Finance" },
      { label: "Healthcare", value: "Healthcare" },
      { label: "Retail", value: "Retail" },
      { label: "Manufacturing", value: "Manufacturing" },
      { label: "Other", value: "Other" },
    ],
  },
];

// matches accounts table
export interface AccountRow {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  annual_revenue: number | null;
  employee_count: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  description: string | null;
  created_at: string;
}

export default function AccountsPage() {
  const navigate = useNavigate();

  // data hooks
  const { data: accounts = [], isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const { canDelete } = useCRUD();

  const { searchQuery, setSearchQuery, activeFilters, setFilter, clearFilters, filteredData, resultCount, totalCount, filterDefs } = useSearch<AccountRow>(accounts as AccountRow[], {
    searchFields: ["name", "industry", "website", "phone"],
    filterDefs: ACCOUNT_FILTERS,
  });

  // validation schema
  const accountSchema = z.object({
    name: z.string().min(1, "Account name is required"),
    email: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, "Please enter a valid email address"),
    phone: z.string().optional().refine((val) => !val || /^\+?[0-9\s\-()]{7,15}$/.test(val), "Please enter a valid phone number"),
  });

  // ui state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null);
  const [viewingAccount, setViewingAccount] = useState<AccountRow | null>(null);

  // form state
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    website: "",
    phone: "",
    email: "",
    annual_revenue: "",
    employee_count: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    description: "",
  });

  // open create dialog
  const openCreateDialog = () => {
    setEditingAccount(null);
    setFormData({
      name: "",
      industry: "",
      website: "",
      phone: "",
      email: "",
      annual_revenue: "",
      employee_count: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      description: "",
    });
    setDialogOpen(true);
  };

  // open edit dialog
  const openEditDialog = (acc: AccountRow) => {
    setEditingAccount(acc);
    setFormData({
      name: acc.name,
      industry: acc.industry || "",
      website: acc.website || "",
      phone: acc.phone || "",
      email: acc.email || "",
      annual_revenue: acc.annual_revenue?.toString() || "",
      employee_count: acc.employee_count?.toString() || "",
      address: acc.address || "",
      city: acc.city || "",
      state: acc.state || "",
      country: acc.country || "",
      postal_code: acc.postal_code || "",
      description: acc.description || "",
    });
    setDialogOpen(true);
  };

  const openViewDialog = (acc: AccountRow) => {
    setViewingAccount(acc);
  };

  // submit handler
  const handleSubmit = async () => {
    try {
      accountSchema.parse(formData);

      const annualRevenue = formData.annual_revenue
        ? parseFloat(formData.annual_revenue)
        : undefined;
      const employeeCount = formData.employee_count
        ? parseInt(formData.employee_count)
        : undefined;

      const payload = {
        ...formData,
        annual_revenue: annualRevenue,
        employee_count: employeeCount,
      };

      if (editingAccount) {
        await updateAccount.mutateAsync({ id: editingAccount.id, ...payload });
      } else {
        await createAccount.mutateAsync(payload);
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

  // table columns
  const columns = [
    {
      key: "name",
      header: "Account",
      cell: (acc: AccountRow) => (
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{acc.name}</div>
            <div className="text-xs text-muted-foreground">
              {acc.industry || "-"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (acc: AccountRow) => (
        <div className="text-sm text-muted-foreground space-y-1">
          {acc.phone && <div>{acc.phone}</div>}
          {acc.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> {acc.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (acc: AccountRow) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          {(acc.city || acc.country) && <MapPin className="h-3 w-3" />}
          {[acc.city, acc.state, acc.country].filter(Boolean).join(", ") || "-"}
        </div>
      ),
    },
    {
      key: "website",
      header: "Website",
      cell: (acc: AccountRow) =>
        acc.website ? (
          <a
            href={
              acc.website.startsWith("http")
                ? acc.website
                : `https://${acc.website}`
            }
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            <Globe className="h-3 w-3" /> Visit
          </a>
        ) : (
          "-"
        ),
    },
    {
      key: "actions",
      header: "",
      cell: (acc: AccountRow) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" onClick={(event) => event.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(event) => { event.stopPropagation(); openViewDialog(acc); }}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(event) => { event.stopPropagation(); openEditDialog(acc); }}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                return (
                navigate(`/dashboard/cpq/quotes/new?account_id=${acc.id}`)
                );
              }}
            >
              <FileText className="mr-2 h-4 w-4" /> Create Quote
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canDelete() && (
            <DropdownMenuItem
              onClick={(event) => { event.stopPropagation(); deleteAccount.mutate(acc.id); }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
        <PlanLimitBanner resource="accounts" className="mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Accounts</h1>
            <p className="text-muted-foreground">
              Manage your customer accounts
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search accounts..." resultCount={resultCount} totalCount={totalCount} />
            <ExportButton data={filteredData} filename="siswit-accounts" sheetName="Accounts" isLoading={isLoading} />
          </div>
          <FilterBar filters={filterDefs} activeFilters={activeFilters} onFilterChange={setFilter} onClearAll={clearFilters} />
        </div>

        <DataTable
          data={filteredData as AccountRow[]}
          columns={columns}
          loading={isLoading}
          onAdd={openCreateDialog}
          onRowClick={openViewDialog}
          addLabel="Add Account"
          searchable={false}
        />

        {/* account form */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-3xl flex-col overflow-hidden p-0">
            <DialogHeader className="shrink-0 border-b px-6 pb-4 pt-6 pr-12">
              <DialogTitle>
                {editingAccount ? "Edit Account" : "Add Account"}
              </DialogTitle>
              <DialogDescription>
                Capture account profile, contact channels, and commercial context so follow-ups stay consistent for the sales team.
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
                <div className="space-y-6">
              {/* basic info */}
              <Section title="Basic Info">
                <Grid cols={2}>
                  <InputField
                    label="Account Name *"
                    placeholder="Acme Corp"
                    value={formData.name}
                    onChange={(v) => setFormData({ ...formData, name: v })}
                  />
                  <InputField
                    label="Industry"
                    placeholder="Technology"
                    value={formData.industry}
                    onChange={(v) =>
                      setFormData({ ...formData, industry: v })
                    }
                  />
                </Grid>
              </Section>

              {/* company size */}
              <Section title="Company Size">
                <Grid cols={2}>
                  <InputField
                    label="Annual Revenue"
                    type="number"
                    placeholder="100000"
                    value={formData.annual_revenue}
                    onChange={(v) =>
                      setFormData({ ...formData, annual_revenue: v })
                    }
                  />
                  <InputField
                    label="Employees"
                    type="number"
                    placeholder="50"
                    value={formData.employee_count}
                    onChange={(v) =>
                      setFormData({ ...formData, employee_count: v })
                    }
                  />
                </Grid>
              </Section>

              {/* contact */}
              <Section title="Contact Info">
                <Grid cols={3}>
                  <Input
                    placeholder="acme.com"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                  />
                  <Input
                    placeholder="+1 234 567 890"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                  <Input
                    placeholder="info@acme.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </Grid>
              </Section>

              {/* address */}
              <Section title="Address">
                <Input
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
                <Grid cols={4}>
                  <Input placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                  <Input placeholder="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                  <Input placeholder="Zip Code" value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} />
                  <Input placeholder="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                </Grid>
              </Section>

              {/* notes */}
              <Section title="Description">
                <Textarea
                  rows={4}
                  placeholder="Additional notes..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </Section>
                </div>
              </div>

              <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createAccount.isPending || updateAccount.isPending
                  }
                >
                  {editingAccount ? "Update Account" : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(viewingAccount)} onOpenChange={(open) => !open && setViewingAccount(null)}>
          <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-2xl flex-col overflow-hidden p-0">
            <DialogHeader className="shrink-0 border-b border-border/60 px-6 pb-4 pt-6 pr-12">
              <DialogTitle>Account Details</DialogTitle>
            </DialogHeader>

            {viewingAccount && (
              <>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{viewingAccount.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{viewingAccount.industry || "Industry not specified"}</p>
                      </div>
                      {viewingAccount.website && (
                        <a
                          href={viewingAccount.website.startsWith("http") ? viewingAccount.website : `https://${viewingAccount.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <Globe className="h-4 w-4" />
                          Visit Website
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</p>
                      <p className="mt-2 text-sm">{viewingAccount.email || "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Phone</p>
                      <p className="mt-2 text-sm">{viewingAccount.phone || "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Annual Revenue</p>
                      <p className="mt-2 text-sm">{viewingAccount.annual_revenue != null ? formatCurrency(viewingAccount.annual_revenue) : "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Employees</p>
                      <p className="mt-2 text-sm">{viewingAccount.employee_count ?? "-"}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-background p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Address</p>
                    <p className="mt-2 text-sm">
                      {[
                        viewingAccount.address,
                        viewingAccount.city,
                        viewingAccount.state,
                        viewingAccount.postal_code,
                        viewingAccount.country,
                      ].filter(Boolean).join(", ") || "-"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-background p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Description</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {viewingAccount.description || "No account description available."}
                    </p>
                  </div>
                </div>

                <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
                  <Button variant="outline" onClick={() => setViewingAccount(null)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setViewingAccount(null);
                      openEditDialog(viewingAccount);
                    }}
                  >
                    Edit Account
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}

// section wrapper
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

// responsive grid helper
function Grid({ cols, children }: { cols: 2 | 3 | 4; children: ReactNode }) {
  return (
    <div
      className={`grid gap-4 ${
        cols === 2
          ? "grid-cols-1 md:grid-cols-2"
          : cols === 3
          ? "grid-cols-1 md:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      }`}
    >
      {children}
    </div>
  );
}

// input with label + placeholder
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
