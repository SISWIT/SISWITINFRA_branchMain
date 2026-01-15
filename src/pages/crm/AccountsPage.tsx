import { useState } from "react";
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from "@/hooks/useCRM";
import { DataTable } from "@/components/crm/DataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Pencil, Trash2, Globe, Building2, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { format } from "date-fns";

// Matches your Schema 'accounts' Row
export interface AccountRow {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  annual_revenue: number | null;
  employee_count: number | null;
  city: string | null;
  country: string | null;
  description: string | null;
  created_at: string;
}

export default function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null);

  // Form matches Schema columns only
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    website: "",
    phone: "",
    annual_revenue: "",
    employee_count: "",
    city: "",
    country: "",
    description: "",
  });

  const openCreateDialog = () => {
    setEditingAccount(null);
    setFormData({
      name: "",
      industry: "",
      website: "",
      phone: "",
      annual_revenue: "",
      employee_count: "",
      city: "",
      country: "",
      description: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (account: AccountRow) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      industry: account.industry || "",
      website: account.website || "",
      phone: account.phone || "",
      annual_revenue: account.annual_revenue ? account.annual_revenue.toString() : "",
      employee_count: account.employee_count ? account.employee_count.toString() : "",
      city: account.city || "",
      country: account.country || "",
      description: account.description || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
      employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
    };

    if (editingAccount) {
      await updateAccount.mutateAsync({ id: editingAccount.id, ...payload });
    } else {
      await createAccount.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const columns = [
    {
      key: "name",
      header: "Account Name",
      cell: (acc: AccountRow) => (
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{acc.name}</span>
            <span className="text-xs text-muted-foreground">{acc.industry}</span>
          </div>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (acc: AccountRow) => (
        <div className="flex items-center gap-1 text-muted-foreground">
           {acc.city || acc.country ? <MapPin className="h-3 w-3" /> : null}
           <span>
             {[acc.city, acc.country].filter(Boolean).join(", ") || "-"}
           </span>
        </div>
      )
    },
    {
      key: "website",
      header: "Website",
      cell: (acc: AccountRow) =>
        acc.website ? (
          <a
            href={acc.website.startsWith("http") ? acc.website : `https://${acc.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:underline"
          >
            <Globe className="mr-1 h-3 w-3" />
            Link
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "revenue",
      header: "Revenue",
      cell: (acc: AccountRow) =>
        acc.annual_revenue
          ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(acc.annual_revenue)
          : "-",
    },
    {
      key: "created_at",
      header: "Created",
      cell: (acc: AccountRow) => {
        if (!acc.created_at) return "-";
        try {
          return format(new Date(acc.created_at), "MMM d, yyyy");
        } catch (e) { return "-"; }
      },
    },
    {
      key: "actions",
      header: "",
      cell: (acc: AccountRow) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditDialog(acc)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => deleteAccount.mutate(acc.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your customer accounts</p>
        </div>

        <DataTable
          data={accounts as unknown as AccountRow[]}
          columns={columns}
          loading={isLoading}
          onAdd={openCreateDialog}
          addLabel="Add Account"
          searchPlaceholder="Search accounts..."
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Account Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Industry</Label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Technology"
                  />
                </div>
                <div>
                  <Label>Annual Revenue</Label>
                  <Input
                    type="number"
                    value={formData.annual_revenue}
                    onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="acme.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234..."
                  />
                </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="USA"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createAccount.isPending || updateAccount.isPending}>
                {editingAccount ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}