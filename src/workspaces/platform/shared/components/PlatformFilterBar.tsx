import { Search } from "lucide-react";
import { Input } from "@/ui/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";

export interface FilterOption {
  label: string;
  value: string;
}

interface PlatformFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;

  statusFilter?: string;
  onStatusChange?: (val: string) => void;
  statusOptions?: FilterOption[];
  statusPlaceholder?: string;

  roleFilter?: string;
  onRoleChange?: (val: string) => void;
  roleOptions?: FilterOption[];
  rolePlaceholder?: string;
}

export function PlatformFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  
  statusFilter,
  onStatusChange,
  statusOptions,
  statusPlaceholder = "Any status",

  roleFilter,
  onRoleChange,
  roleOptions,
  rolePlaceholder = "Any role",
}: PlatformFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 w-full md:max-w-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        {onStatusChange && statusOptions && (
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder={statusPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{statusPlaceholder}</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {onRoleChange && roleOptions && (
          <Select value={roleFilter} onValueChange={onRoleChange}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder={rolePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{rolePlaceholder}</SelectItem>
              {roleOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
