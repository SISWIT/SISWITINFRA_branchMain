import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/shadcn/dialog";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";

export interface PlatformDangerActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  actionLabel?: string;
  requireMatchString?: string;
  matchInputLabel?: string;
  isProcessing?: boolean;
  onConfirm: () => void;
}

export function PlatformDangerActionDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel = "Confirm",
  requireMatchString,
  matchInputLabel,
  isProcessing = false,
  onConfirm,
}: PlatformDangerActionDialogProps) {
  const [matchValue, setMatchValue] = useState("");

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setMatchValue(""); // reset on close
    }
    onOpenChange(newOpen);
  };

  const isMatchValid = !requireMatchString || matchValue === requireMatchString;

  const handleConfirm = () => {
    if (isMatchValid) {
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-3 text-base">{description}</DialogDescription>
        </DialogHeader>

        {requireMatchString && (
          <div className="py-2 space-y-2">
            <p className="text-sm font-medium">
              {matchInputLabel || `Please type "${requireMatchString}" to confirm:`}
            </p>
            <Input
              value={matchValue}
              onChange={(e) => setMatchValue(e.target.value)}
              placeholder={requireMatchString}
              className="font-mono"
            />
          </div>
        )}

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isMatchValid || isProcessing}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
