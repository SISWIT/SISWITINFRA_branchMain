import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Menu, X, Moon, Sun, LogOut, User, Shield, 
  LayoutDashboard 
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
  const { user, role, signOut } = useAuth();

  // 1. SCROLL EFFECT FOR HEADER BACKGROUND
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. THEME DETECTION
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  // 3. AUTO-CLOSE MENU ON ROUTE CHANGE
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // 4. *** KEY FIX: LOCK BODY SCROLL WHEN MENU IS OPEN ***
  useEffect(() => {
    if (mobileMenuOpen) {
      // Prevent scrolling the background page
      document.body.style.overflow = "hidden";
    } else {
      // Restore scrolling
      document.body.style.overflow = "unset";
    }
    // Cleanup ensures we never get stuck in a locked state
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;
  const isEmployee = role === AppRole.EMPLOYEE;
  const isAdmin = role === AppRole.ADMIN;

  const getHomeLink = () => {
    if (isAdmin) return "/admin";
    if (isEmployee) return "/dashboard";
    return "/";
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* Mobile Trigger */}
          <div className="flex lg:hidden mr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="-ml-2"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          {/* Logo */}
          <Link to={getHomeLink()} className="flex items-center gap-2 group flex-1 lg:flex-none">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              SIS<span className="text-gradient">WIT</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.name}
              </Link>
            ))}

            {user && isEmployee && (
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname.startsWith("/dashboard")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                Dashboard
              </Link>
            )}

            {user && isAdmin && (
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  location.pathname.startsWith("/admin")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                Admin Panel
              </Link>
            )}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {isAdmin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    <span className="max-w-[100px] truncate">
                        {isAdmin ? "Admin" : "Account"}
                    </span>
                    {role && <RoleBadge role={role} size="sm" />}
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-56">
                   <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      My Account
                   </div>
                   <DropdownMenuSeparator />
                  
                  {isEmployee && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Portal
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Theme Toggle */}
          <div className="flex lg:hidden">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
               {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER             */}
      
      {/* 1. Backdrop Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* 2. Sliding Sidebar */}
      {/* Changed height to h-[100dvh] for better mobile browser support */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px] h-[100dvh] bg-background border-r border-border shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          
          {/* Header of Sidebar */}
          <div className="flex items-center justify-between p-4 border-b border-border">
             <span className="text-xl font-bold">
              SIS<span className="text-gradient">WIT</span>
            </span>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6">
            
            {/* SECTION 1: MAIN MENU */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Menu
              </p>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary text-foreground/80"
                  }`}
                >
                  {item.name}
                  {isActive(item.href) && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </Link>
              ))}
            </div>

            {/* SECTION 2: WORKSPACE */}
            {(isEmployee || isAdmin) && (
              <div className="space-y-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Workspace
                </p>
                
                {isEmployee && (
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname.startsWith("/dashboard")
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-secondary text-foreground/80"
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Employee Dashboard
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname.startsWith("/admin")
                         ? "bg-primary/10 text-primary"
                        : "hover:bg-secondary text-foreground/80"
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    Admin Control Panel
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: STICKY FOOTER */}
          <div className="p-4 border-t border-border bg-secondary/20">
            {user ? (
              <div className="space-y-3">
                 <div className="flex items-center gap-3 px-1 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                       {isAdmin ? <Shield className="h-5 w-5 text-primary"/> : <User className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                       <span className="text-sm font-semibold truncate">My Account</span>
                       <div className="flex">
                         {role && <RoleBadge role={role} size="sm" />}
                       </div>
                    </div>
                 </div>
                 
                 <Button 
                    variant="outline" 
                    onClick={handleSignOut} 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                 >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link to="/auth" className="w-full">
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link to="/auth" className="w-full">
                  <Button variant="hero" className="w-full">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}