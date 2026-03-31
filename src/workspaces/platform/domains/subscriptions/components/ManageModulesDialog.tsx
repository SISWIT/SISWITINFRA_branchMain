import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/ui/shadcn/dialog";
import { Button } from "@/ui/shadcn/button";
import { Switch } from "@/ui/shadcn/switch";
import { Label } from "@/ui/shadcn/label";
import { usePlatformModulesMutation } from "../hooks/usePlatformModulesMutation";
import { PlatformSubscriptionRow } from "../types";

interface ManageModulesDialogProps {
  subscription: PlatformSubscriptionRow | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageModulesDialog({
  subscription,
  isOpen,
  onOpenChange,
}: ManageModulesDialogProps) {
  const [modules, setModules] = useState({
    module_crm: false,
    module_clm: false,
    module_cpq: false,
    module_erp: false,
    module_documents: false,
  });

  const mutation = usePlatformModulesMutation();

  useEffect(() => {
    if (subscription) {
      setModules({
        module_crm: subscription.module_crm,
        module_clm: subscription.module_clm,
        module_cpq: subscription.module_cpq,
        module_erp: subscription.module_erp,
        module_documents: subscription.module_documents,
      });
    }
  }, [subscription, isOpen]);

  const handleSave = async () => {
    if (!subscription) return;
    
    await mutation.mutateAsync({
      organization_id: subscription.organization?.id || "",
      modules: modules,
    });
    onOpenChange(false);
  };

  const toggleModule = (key: keyof typeof modules) => {
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!subscription) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Modules</DialogTitle>
          <DialogDescription>
            Enable or disable specific features for <span className="font-semibold">{subscription.organization?.name}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">CRM Module</Label>
              <p className="text-xs text-muted-foreground">Contacts, Accounts, Leads, and Opportunities.</p>
            </div>
            <Switch
              checked={modules.module_crm}
              onCheckedChange={() => toggleModule("module_crm")}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">CLM Module</Label>
              <p className="text-xs text-muted-foreground">Contracts, Templates, and E-Signatures.</p>
            </div>
            <Switch
              checked={modules.module_clm}
              onCheckedChange={() => toggleModule("module_clm")}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">CPQ Module</Label>
              <p className="text-xs text-muted-foreground">Price Books, Quotes, and Proposals.</p>
            </div>
            <Switch
              checked={modules.module_cpq}
              onCheckedChange={() => toggleModule("module_cpq")}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">ERP Module</Label>
              <p className="text-xs text-muted-foreground">Suppliers, Purchase Orders, and Inventory.</p>
            </div>
            <Switch
              checked={modules.module_erp}
              onCheckedChange={() => toggleModule("module_erp")}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Documents Module</Label>
              <p className="text-xs text-muted-foreground">Files, Buckets, and Media management.</p>
            </div>
            <Switch
              checked={modules.module_documents}
              onCheckedChange={() => toggleModule("module_documents")}
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
           <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
           <Button onClick={handleSave} disabled={mutation.isPending}>
             {mutation.isPending ? "Applying Changes..." : "Update Features"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
