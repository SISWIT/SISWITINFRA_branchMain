import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  User,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { AppRole } from "@/types/roles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "Solutions", href: "/solutions" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut, loading } = useAuth();

  /* -------------------- EFFECTS -------------------- */

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /* -------------------- HANDLERS -------------------- */

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  /* -------------------- LOADING UI -------------------- */

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 h-16 lg:h-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <span className="text-xl font-bold opacity-50">SISWIT</span>
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </div>
      </header>
    );
  }

  const isAdmin = role === AppRole.ADMIN;
  const isEmployee = role === AppRole.EMPLOYEE;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile Menu Button */}
          <div className="flex lg:hidden mr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          {/* Logo */}
          <Link
            to={isAdmin ? "/admin" : isEmployee ? "/dashboard" : "/"}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                S
              </span>
            </div>
            <span className="text-xl font-bold">
              SIS<span className="text-gradient">WIT</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  location.pathname === item.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun /> : <Moon />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {isAdmin ? <Shield /> : <User />}
                    {role && <RoleBadge role={role} size="sm" />}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={isAdmin ? "/admin" : "/dashboard"}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {isAdmin ? "Admin Portal" : "Dashboard"}
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden ${
          mobileMenuOpen ? "block" : "hidden"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-background border-r transform transition-transform lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            <span className="font-bold text-xl">SISWIT</span>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X />
            </Button>
          </div>

          <div className="mt-auto pt-4 border-t">
            {user ? (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full text-destructive"
              >
                Sign Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button className="w-full">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
