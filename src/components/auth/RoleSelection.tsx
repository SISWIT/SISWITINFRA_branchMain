import { Building2, Users, ArrowRight, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectedRole = "employee" | "customer" | null;

interface RoleSelectionProps {
  selectedRole: SelectedRole;
  onSelectRole: (role: SelectedRole) => void;
  onContinue: () => void;
}

const roles = [
  {
    id: "employee" as const,
    title: "Employee",
    description: "Access internal tools, dashboards, and admin panels",
    icon: Building2,
    features: [
      "Full Dashboard Access",
      "CPQ, CLM, CRM Management",
      "Create & Manage Quotes",
      "Contract Administration",
    ],
    note: "Requires admin approval",
  },
  {
    id: "customer" as const,
    title: "Customer / Client",
    description: "Access services, view quotes, and sign contracts",
    icon: Users,
    features: [
      "Browse Services",
      "View Quotes & Pricing",
      "Sign Contracts Digitally",
      "Support & Resources",
    ],
    note: "Instant access",
  },
];

export function RoleSelection({ selectedRole, onSelectRole, onContinue }: RoleSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Choose Your Role</h1>
        <p className="text-muted-foreground">
          Select how you'll be using Siriusinfra
        </p>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          
          return (
            <button
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              className={cn(
                "relative w-full p-6 rounded-xl border-2 text-left transition-all duration-200",
                "hover:border-primary/50 hover:shadow-lg",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                  : "border-border bg-card"
              )}
            >
              {/* Selection indicator */}
              <div
                className={cn(
                  "absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-primary-foreground" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                  </svg>
                )}
              </div>

              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">{role.title}</h3>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        role.id === "employee"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {role.note}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                  
                  <ul className="grid grid-cols-2 gap-1.5">
                    {role.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {role.id === "employee" ? (
                          <Shield className="w-3 h-3 text-primary" />
                        ) : (
                          <Zap className="w-3 h-3 text-primary" />
                        )}
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onContinue}
        disabled={!selectedRole}
        className={cn(
          "w-full h-12 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all",
          selectedRole
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
