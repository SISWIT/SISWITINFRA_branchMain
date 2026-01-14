import { AppRole } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Building2, UserCheck } from "lucide-react";

interface RoleBadgeProps {
  role: AppRole;
  size?: "sm" | "md";
}

export function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  const isEmployee = role === "employee";
  
  return (
    <Badge
  variant={isEmployee ? "default" : "secondary"}
  className={`${size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"} gap-1.5`}
>
  {isEmployee ? (
    <Building2 className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
  ) : (
    <UserCheck className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
  )}

  {/* Role text hidden on mobile */}
  <span className="hidden sm:inline">
    {isEmployee ? "Employee" : "Client"}
  </span>
</Badge>

  );
}
