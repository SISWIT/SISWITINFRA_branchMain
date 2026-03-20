import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/ui/shadcn/input";
import { Textarea } from "@/ui/shadcn/textarea";
import { Button } from "@/ui/shadcn/button";
import { useOrganizationOwnerData } from "@/workspaces/organization/hooks/useOrganizationOwnerData";
import { useUpdateOrganization } from "@/workspaces/organization/hooks/useOrganization";

export default function OrganizationSettingsPage() {
  const { organization, loading } = useOrganizationOwnerData();
  const updateMutation = useUpdateOrganization();
  
  const [formData, setFormData] = useState({
    name: "",
    company_email: "",
    company_phone: "",
    company_website: "",
    company_address: "",
  });

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        company_email: organization.company_email || "",
        company_phone: organization.company_phone || "",
        company_website: organization.company_website || "",
        company_address: organization.company_address || "",
      });
    }
  }, [organization]);

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (loading && !organization) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <section className="org-panel">
        <h2 className="text-lg font-semibold">No organization loaded</h2>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your organization profile and branding.</p>
      </section>

      <section className="org-panel space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization Name</label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Organization Name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization Code / Slug</label>
            <Input 
              value={organization.org_code ?? organization.slug} 
              readOnly 
              className="bg-muted cursor-not-allowed"
              title="Slug cannot be changed directly"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Email</label>
            <Input 
              value={formData.company_email} 
              onChange={(e) => setFormData(prev => ({ ...prev, company_email: e.target.value }))}
              placeholder="Company email" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Phone</label>
            <Input 
              value={formData.company_phone} 
              onChange={(e) => setFormData(prev => ({ ...prev, company_phone: e.target.value }))}
              placeholder="Company phone" 
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Company Website</label>
            <Input 
              value={formData.company_website} 
              onChange={(e) => setFormData(prev => ({ ...prev, company_website: e.target.value }))}
              placeholder="Company website" 
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Company Address</label>
            <Textarea
              value={formData.company_address}
              onChange={(e) => setFormData(prev => ({ ...prev, company_address: e.target.value }))}
              placeholder="Company address"
              rows={4}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            className="min-w-[120px]"
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
          <Button variant="outline" disabled>
            Upload Logo (Soon)
          </Button>
        </div>
      </section>
    </div>
  );
}

