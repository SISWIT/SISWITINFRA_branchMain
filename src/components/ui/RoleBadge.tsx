import { AppRole } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Building2, UserCheck, Shield } from "lucide-react"; // 1. Added Shield Icon

interface RoleBadgeProps {
  role: AppRole;
  size?: "sm" | "md";
}

export function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  // 2. Normalize checks
  const roleName = role?.toString().toLowerCase(); 
  const isAdmin = roleName === "admin";
  const isEmployee = roleName === "employee";
  
  // 3. Determine Variant: Admin=Destructive (Red/Distinct), Employee=Default (Primary), Client=Secondary (Grey)
  const badgeVariant = isAdmin ? "destructive" : isEmployee ? "default" : "secondary";

  return (
    <Badge
      variant={badgeVariant}
      className={`${size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"} gap-1.5`}
    >
      {/* 4. Render correct icon based on role */}
      {isAdmin ? (
        <Shield className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      ) : isEmployee ? (
        <Building2 className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      ) : (
        <UserCheck className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      )}

      {/* Role text hidden on mobile, visible on tablet+ */}
      <span className="hidden sm:inline capitalize">
        {isAdmin ? "Admin" : isEmployee ? "Employee" : "Client"}
      </span>
    </Badge>
  );
}