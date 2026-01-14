import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { supabase } from "@/integrations/supabase/client";
import {
  Calculator, FileText, Users, Settings, BarChart3,
  Bell, Search, Plus, ArrowRight, TrendingUp, Clock,
  CheckCircle2, AlertCircle, Loader2, LogOut, FileStack
} from "lucide-react";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  company: string | null;
}

const quickActions = [
  { icon: Calculator, title: "Create Quote", description: "Start a new CPQ quote", color: "from-primary to-primary/60" },
  { icon: FileText, title: "New Contract", description: "Draft a new contract", color: "from-accent to-accent/60" },
  { icon: FileStack, title: "Create Document", description: "Generate a new document", color: "from-chart-4 to-chart-4/60" },
  { icon: Users, title: "Add Contact", description: "Add a new customer", color: "from-chart-3 to-chart-3/60" },
];

const recentActivity = [
  { type: "quote", title: "Quote #Q-2024-0142 created", time: "2 hours ago", status: "pending" },
  { type: "contract", title: "Contract with Acme Corp signed", time: "5 hours ago", status: "completed" },
  { type: "contact", title: "New lead: John Smith", time: "1 day ago", status: "new" },
  { type: "quote", title: "Quote #Q-2024-0141 approved", time: "2 days ago", status: "completed" },
];

const stats = [
  { label: "Open Quotes", value: "24", change: "+12%", icon: Calculator },
  { label: "Active Contracts", value: "156", change: "+8%", icon: FileText },
  { label: "Documents Generated", value: "892", change: "+32%", icon: FileStack },
  { label: "Revenue MTD", value: "$124K", change: "+18%", icon: TrendingUp },
];

const Dashboard = () => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("first_name, last_name, company")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          setProfile(data);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const firstName = profile?.first_name || user.user_metadata?.first_name || user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      {/* Custom Dashboard Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">
                Sirius<span className="text-gradient">infra</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              {role && <RoleBadge role={role} />}

              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {firstName} {profile?.last_name || user.user_metadata?.last_name || ""}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>

          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Welcome Section */}
        <section className="py-12 gradient-hero">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Welcome back, {firstName}!
                </h1>
                <p className="text-muted-foreground">
                  Here's what's happening with your business today.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Button>
                <Button variant="hero" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Quick Action
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions & Activity */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
                <div className="space-y-4">
                  {quickActions.map((action) => (
                    <button
                      key={action.title}
                      className="w-full p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-card-hover transition-all flex items-center gap-4 text-left group"
                    >
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{action.title}</div>
                        <div className="text-sm text-muted-foreground">{action.description}</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
                <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                  <div className="divide-y divide-border">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="p-4 hover:bg-secondary/50 transition-colors flex items-center gap-4"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.status === "completed"
                            ? "bg-primary/10"
                            : activity.status === "pending"
                              ? "bg-accent/10"
                              : "bg-chart-3/10"
                          }`}>
                          {activity.status === "completed" ? (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          ) : activity.status === "pending" ? (
                            <Clock className="w-5 h-5 text-accent" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-chart-3" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{activity.title}</div>
                          <div className="text-sm text-muted-foreground">{activity.time}</div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${activity.status === "completed"
                            ? "bg-primary/10 text-primary"
                            : activity.status === "pending"
                              ? "bg-accent/10 text-accent"
                              : "bg-chart-3/10 text-chart-3"
                          }`}>
                          {activity.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Module Cards */}
        <section className="py-8 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-foreground mb-6">Your Modules</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link to="/dashboard/cpq" className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-card-hover transition-all">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calculator className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">CPQ</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure products, set pricing rules, and generate professional quotes.
                </p>
                <span className="text-primary font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open Module <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              <Link to="/dashboard/clm" className="group p-6 rounded-xl bg-card border border-border hover:border-accent/30 hover:shadow-card-hover transition-all">
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">CLM</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create, track, and manage contracts throughout their lifecycle.
                </p>
                <span className="text-accent font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open Module <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              <Link to="/dashboard/crm" className="group p-6 rounded-xl bg-card border border-border hover:border-chart-3/30 hover:shadow-card-hover transition-all">
                <div className="w-14 h-14 rounded-xl bg-chart-3 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">CRM</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage leads, track opportunities, and build customer relationships.
                </p>
                <span className="text-chart-3 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open Module <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              <Link to="/dashboard/documents" className="group p-6 rounded-xl bg-card border border-border hover:border-chart-4/30 hover:shadow-card-hover transition-all">
                <div className="w-14 h-14 rounded-xl bg-chart-4 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileStack className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Document Automation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate documents at scale with smart templates and automation.
                </p>
                <span className="text-chart-4 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open Module <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;