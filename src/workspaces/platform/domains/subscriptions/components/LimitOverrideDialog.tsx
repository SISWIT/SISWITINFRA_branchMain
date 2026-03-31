import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/ui/shadcn/dialog";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";
import { usePlatformLimitMutation } from "../hooks/usePlatformLimitMutation";

interface LimitOverrideDialogProps {
  organizationId: string;
  resourceType: string;
  currentLimit: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LimitOverrideDialog({
  organizationId,
  resourceType,
  currentLimit,
  isOpen,
  onOpenChange,
}: LimitOverrideDialogProps) {
  const [newLimit, setNewLimit] = useState(currentLimit.toString());
  const mutation = usePlatformLimitMutation(organizationId);

  useEffect(() => {
    setNewLimit(currentLimit.toString());
  }, [currentLimit, isOpen]);

  const handleSave = async () => {
    const limitValue = parseInt(newLimit, 10);
    if (isNaN(limitValue)) return;

    await mutation.mutateAsync({
      organization_id: organizationId,
      resource_type: resourceType,
      max_allowed: limitValue,
    });
    onOpenChange(false);
  };

  const isUnlimited = currentLimit >= 999999999;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override Resource Limit</DialogTitle>
          <DialogDescription>
            Setting a manual override for <span className="font-semibold text-foreground">{resourceType}</span>.
            This will take precedence over the global plan defaults.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="limit">New Limit</Label>
            <div className="flex items-center gap-2">
                <Input
                    id="limit"
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    className="flex-1"
                />
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNewLimit("999999999")}
                >
                    Set Unlimited
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Current system limit: {isUnlimited ? "Unlimited" : currentLimit.toLocaleString()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Applying..." : "Save Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
