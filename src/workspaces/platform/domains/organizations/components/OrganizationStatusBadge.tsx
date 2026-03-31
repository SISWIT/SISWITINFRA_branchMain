import { Badge, type BadgeProps } from "@/ui/shadcn/badge";
import { cn } from "@/core/utils/utils";

interface OrganizationStatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: string;
}

const statusTone: Record<string, string> = {
  active: "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/40",
  suspended: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/40",
  trial: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/40",
  cancelled: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-300 dark:hover:bg-zinc-900/40",
  free: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/40",
};

export function OrganizationStatusBadge({ status, className, ...props }: OrganizationStatusBadgeProps) {
  const normalizedStatus = (status || "").toLowerCase();
  const classes = statusTone[normalizedStatus] || statusTone.active;

  return (
    <Badge 
      variant="outline" 
      className={cn("uppercase tracking-wide px-2 py-0 border-transparent", classes, className)} 
      {...props}
    >
      {status}
    </Badge>
  );
}
