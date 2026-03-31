import { Copy, FileJson } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/shadcn/dialog";
import { Button } from "@/ui/shadcn/button";

export interface PlatformAuditMetadataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  metadata: Record<string, unknown> | null;
}

export function PlatformAuditMetadataDialog({
  open,
  onOpenChange,
  title = "Audit Metadata",
  metadata,
}: PlatformAuditMetadataDialogProps) {
  const jsonString = metadata ? JSON.stringify(metadata, null, 2) : "";

  const handleCopy = () => {
    if (jsonString) {
      navigator.clipboard.writeText(jsonString);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <FileJson className="h-5 w-5 text-muted-foreground" />
              </div>
              <DialogTitle>{title}</DialogTitle>
            </div>
            {metadata && (
              <Button variant="ghost" size="sm" onClick={handleCopy} className="mr-6">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            )}
          </div>
          <DialogDescription>
            Raw event metadata captured at the time of the action.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto mt-4 rounded-md border bg-zinc-950 p-4">
          <pre className="text-sm font-mono text-zinc-50 break-all whitespace-pre-wrap">
            {metadata ? jsonString : "No metadata available"}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
