import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCopy,
  Grid2X2,
  LogOut,
  Menu,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { Calendar } from "@/ui/shadcn/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/shadcn/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/shadcn/dropdown-menu";
import { cn } from "@/core/utils/utils";
import { useAuth } from "@/core/auth/useAuth";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";
import { NotificationBell } from "@/ui/notification-bell";
import { ThemeToggle } from "@/ui/theme-toggle";

interface OrganizationTopBarProps {
  onOpenSidebar: () => void;
}

const PAGES = [
  { label: "Dashboard", path: "/organization/overview" },
  { label: "User Management", path: "/organization/users" },
  { label: "Invitations", path: "/organization/invitations" },
  { label: "Client Approvals", path: "/organization/approvals" },
  { label: "Plans and Billing", path: "/organization/plans" },
  { label: "Alerts", path: "/organization/alerts" },
  { label: "Settings", path: "/organization/settings" },
] as const;

function getDisplayName(email: string | null | undefined): string {
  if (!email) return "Owner";
  return email.split("@")[0] || "Owner";
}

function formatSelectedDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function OrganizationTopBar({ onOpenSidebar }: OrganizationTopBarProps) {
  const { user, signOut } = useAuth();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const displayName = getDisplayName(user?.email);
  const initials = displayName.slice(0, 2).toUpperCase();
  const primaryColor = organization?.primary_color || "var(--primary)";

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PAGES;
    return PAGES.filter((p) => p.label.toLowerCase().includes(q));
  }, [searchQuery]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const dateLabel = selectedDate ? formatSelectedDate(selectedDate) : "Current";

  const [selectedModule, setSelectedModule] = useState<string>("All");
  const handleModuleSelect = useCallback((label: string, path?: string) => {
    setSelectedModule(label);
    if (path) navigate(path);
  }, [navigate]);

  const orgCode = organization?.org_code ?? "ORG";
  const [copied, setCopied] = useState(false);
  async function handleCopyOrgCode() {
    try {
      await navigator.clipboard.writeText(orgCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/sign-in", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/60 backdrop-blur-2xl px-4 lg:px-8 py-3 overflow-hidden">
      {/* Topbar Internal Glow */}
      <div className="absolute inset-0 bg-purple-600/5 pointer-events-none" />
      
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 relative z-10">
        
        {/* Left: Search & Navigation Helpers */}
        <div className="flex flex-1 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 text-muted-foreground hover:bg-muted"
            onClick={onOpenSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div ref={searchWrapRef} className="relative hidden md:block w-full max-w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Search command..."
              className="h-9 w-full bg-muted/40 border-border transition-all focus:bg-muted/60 focus:ring-1 focus:ring-primary/10 pl-10 text-xs font-medium"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
            />
            {searchOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card/95 backdrop-blur-xl p-1 shadow-2xl animate-in fade-in zoom-in-95">
                {searchResults.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-muted-foreground/60">No matching commands</p>
                ) : (
                  <ul className="space-y-0.5">
                    {searchResults.map((page) => (
                      <li key={page.path}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            navigate(page.path);
                            setSearchOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          <Grid2X2 className="h-3.5 w-3.5 opacity-60" />
                          {page.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Quick Action Chips (Desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/40 border border-border/40 hover:bg-muted/60 transition-all text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                <CalendarDays className="h-3.5 w-3.5" />
                {dateLabel}
                <ChevronDown className="h-3 w-3 opacity-40" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-auto p-0 border-border bg-card/95 backdrop-blur-xl shadow-2xl">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/40 border border-border/40 hover:bg-muted/60 transition-all text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                <Grid2X2 className="h-3.5 w-3.5" />
                {selectedModule}
                <ChevronDown className="h-3 w-3 opacity-40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48 border-border bg-card/95 backdrop-blur-xl">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Modules</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="text-xs font-medium cursor-pointer" onSelect={() => handleModuleSelect("All")}>Overview</DropdownMenuItem>
              {PAGES.map(p => (
                <DropdownMenuItem key={p.path} className="text-xs font-medium cursor-pointer" onSelect={() => handleModuleSelect(p.label, p.path)}>{p.label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={handleCopyOrgCode}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/40 border border-border/40 hover:bg-muted/60 transition-all text-[11px] font-bold tracking-widest text-muted-foreground/80",
              copied && "border-primary/40 text-primary bg-primary/5"
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
            {copied ? "COPIED" : orgCode}
          </button>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-3">
          <Link to="/organization/invitations" className="hidden sm:block">
            <Button size="sm" className="h-8 rounded-full px-4 text-[11px] font-bold uppercase tracking-wider bg-primary hover:opacity-90 transition-opacity">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Invite
            </Button>
          </Link>
          
          <div className="h-8 w-px bg-border/40 mx-1 hidden md:block" />

          <ThemeToggle />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-all">
                <div 
                  className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-foreground dark:text-white shadow-lg border border-border shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {initials}
                </div>
                <div className="hidden md:block text-left mr-1">
                  <p className="text-xs font-bold leading-none">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5 opacity-60">Organization Owner</p>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground/60 hidden md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 border-border bg-card/95 backdrop-blur-xl p-2 shadow-2xl">
              <div className="px-2 py-3 mb-2 rounded-lg bg-muted/40">
                <p className="text-xs font-bold">{displayName}</p>
                <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">{user?.email}</p>
              </div>
              <DropdownMenuItem className="text-xs font-medium py-2 cursor-pointer text-destructive focus:bg-destructive/10" onSelect={handleSignOut}>
                <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
