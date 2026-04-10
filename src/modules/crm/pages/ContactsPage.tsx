import { useState } from "react";
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact, useAccounts } from "@/modules/crm/hooks/useCRM";
import { z } from "zod";
import { toast } from "sonner";
import { useCRUD } from "@/core/rbac/usePermissions";
import { DataTable } from "@/modules/crm/components/DataTable";
import { Button } from "@/ui/shadcn/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";
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
import { Eye, MoreHorizontal, Pencil, Trash2, User, Mail, Phone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/shadcn/dropdown-menu";
import { format } from "date-fns";
import { PlanLimitBanner } from "@/ui/plan-limit-banner";
import { ExportButton } from "@/ui/export-button";
import { useSearch } from "@/core/hooks/useSearch";
import { SearchBar } from "@/ui/search-bar";
// Schema-aligned Interface
export interface ContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  department: string | null;
  account_id: string | null;
  description: string | null;
  created_at: string;
}

export default function ContactsPage() {
  const { data: contacts = [], isLoading } = useContacts();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { canDelete } = useCRUD();

  const { searchQuery, setSearchQuery, filteredData, resultCount, totalCount } = useSearch<ContactRow>(contacts as unknown as ContactRow[], {
    searchFields: ["first_name", "last_name", "email", "phone"],
  });

  const contactSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, "Please enter a valid email address"),
    phone: z.string().optional().refine((val) => !val || /^\+?[0-9\s\-()]{7,15}$/.test(val), "Please enter a valid phone number"),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactRow | null>(null);
  const [viewingContact, setViewingContact] = useState<ContactRow | null>(null);

  const { data: accounts = [] } = useAccounts();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    job_title: "",
    department: "",
    account_id: "",
    description: "",
  });

  const openCreateDialog = () => {
    setEditingContact(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      job_title: "",
      department: "",
      account_id: "",
      description: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (contact: ContactRow) => {
    setEditingContact(contact);
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || "",
      phone: contact.phone || "",
      job_title: contact.job_title || "",
      department: contact.department || "",
      account_id: contact.account_id || "",
      description: contact.description || "",
    });
    setDialogOpen(true);
  };

  const openViewDialog = (contact: ContactRow) => {
    setViewingContact(contact);
  };

  const handleSubmit = async () => {
    try {
      contactSchema.parse(formData);

      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact.id, ...formData });
      } else {
        await createContact.mutateAsync(formData);
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

  const getAccountName = (accountId: string | null) =>
    accounts.find((acc) => acc.id === accountId)?.name || "-";

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (contact: ContactRow) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">
              {contact.first_name} {contact.last_name}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "job",
      header: "Job Title",
      cell: (contact: ContactRow) => (
        <div className="flex flex-col text-sm">
           <span className="font-medium">{contact.job_title || "-"}</span>
           <span className="text-muted-foreground text-xs">{contact.department}</span>
        </div>
      )
    },
    {
      key: "contact_info",
      header: "Contact Info",
      cell: (contact: ContactRow) => (
        <div className="flex flex-col gap-1 text-sm">
          {contact.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span>{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{contact.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Added",
      cell: (contact: ContactRow) => {
         if (!contact.created_at) return "-";
         try {
           return format(new Date(contact.created_at), "MMM d, yyyy");
         } catch(e) { return "-"; }
      }
    },
    {
      key: "actions",
      header: "",
      cell: (contact: ContactRow) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(event) => { event.stopPropagation(); openViewDialog(contact); }}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(event) => { event.stopPropagation(); openEditDialog(contact); }}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {canDelete() && (
            <DropdownMenuItem
              onClick={(event) => { event.stopPropagation(); deleteContact.mutate(contact.id); }}
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
        <PlanLimitBanner resource="contacts" className="mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contacts</h1>
            <p className="text-muted-foreground">Manage your contacts</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search contacts..." resultCount={resultCount} totalCount={totalCount} />
            <ExportButton data={filteredData} filename="siswit-contacts" sheetName="Contacts" isLoading={isLoading} />
          </div>
        </div>

        <DataTable
          data={filteredData as ContactRow[]}
          columns={columns}
          loading={isLoading}
          onAdd={openCreateDialog}
          onRowClick={openViewDialog}
          addLabel="Add Contact"
          searchable={false}
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-x1 flex-col overflow-hidden p-0">
            <DialogHeader className="shrink-0 border-b px-6 pb-4 pt-6 pr-12">
              <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
              <DialogDescription>
                Capture contact profile and engagement context so follow-ups stay consistent for the sales team.
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>First Name</Label>
                      <Input
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="John"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Last Name</Label>
                      <Input
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Job Title</Label>
                      <Input
                        value={formData.job_title}
                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                        placeholder="Manager"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 234..."
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Department</Label>
                    <Input
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Sales"
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

                  <div className="grid gap-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Add context..."
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createContact.isPending || updateContact.isPending}>
                  {editingContact ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(viewingContact)} onOpenChange={(open) => !open && setViewingContact(null)}>
          <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-xl flex-col overflow-hidden p-0">
            <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4">
              <DialogTitle>Contact Details</DialogTitle>
              <DialogDescription>
                Full profile and communication details for this contact.
              </DialogDescription>
            </DialogHeader>

            {viewingContact && (
              <>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                    <p className="text-lg font-semibold">
                      {viewingContact.first_name} {viewingContact.last_name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {viewingContact.job_title || "No job title"}{viewingContact.department ? ` | ${viewingContact.department}` : ""}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</p>
                      <p className="mt-2 text-sm">{viewingContact.email || "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Phone</p>
                      <p className="mt-2 text-sm">{viewingContact.phone || "-"}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Account</p>
                      <p className="mt-2 text-sm">{getAccountName(viewingContact.account_id)}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background p-3 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Added</p>
                      <p className="mt-2 text-sm">{viewingContact.created_at ? format(new Date(viewingContact.created_at), "MMM d, yyyy") : "-"}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-background p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Notes</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {viewingContact.description || "No contact notes available."}
                    </p>
                  </div>
                </div>

                <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
                  <Button variant="outline" onClick={() => setViewingContact(null)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setViewingContact(null);
                      openEditDialog(viewingContact);
                    }}
                  >
                    Edit Contact
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}
