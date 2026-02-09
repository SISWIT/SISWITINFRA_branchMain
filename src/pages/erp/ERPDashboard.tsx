import { Package, Truck, BarChart3, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { StatsCard } from "@/components/crm/StatsCard";
import { Badge } from "@/components/ui/badge";

const COLORS = ["hsl(250, 85%, 60%)", "hsl(199, 89%, 48%)", "hsl(45, 93%, 47%)", "hsl(25, 95%, 53%)", "hsl(142, 71%, 45%)", "hsl(0, 72%, 50%)"];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  on_hold: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export default function ERPDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["erp-stats"],
    queryFn: async () => {
      // Fetch data from various ERP modules
      const [inventoryRes, procurementRes, productionRes, financialRes] = await Promise.all([
        supabase.from("inventory_items").select("*", { count: "exact" }),
        supabase.from("purchase_orders").select("*").eq("status", "pending"),
        supabase.from("production_orders").select("*"),
        supabase.from("financial_records").select("*"),
      ]);

      const inventoryItems = inventoryRes.data || [];
      const purchaseOrders = procurementRes.data || [];
      const productionOrders = productionRes.data || [];
      const financialRecords = financialRes.data || [];

      const totalInventory = inventoryRes.count || 0;
      const lowStockItems = inventoryItems.filter((item: any) => item.quantity < item.min_level).length;
      const totalProcurementValue = purchaseOrders.reduce((sum, po: any) => sum + (po.total_amount || 0), 0);
      const completedProduction = productionOrders.filter((po: any) => po.status === "completed").length;
      const totalProduction = productionOrders.length;
      const totalRevenue = financialRecords.reduce((sum, rec: any) => sum + (rec.amount || 0), 0);

      const inventoryValue = inventoryItems.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity || 0), 0);
      const productionByStatus = {
        pending: productionOrders.filter((po: any) => po.status === "pending").length,
        in_progress: productionOrders.filter((po: any) => po.status === "in_progress").length,
        completed: completedProduction,
        on_hold: productionOrders.filter((po: any) => po.status === "on_hold").length,
      };

      return {
        totalInventory,
        lowStockItems,
        inventoryValue,
        totalProcurementValue,
        totalProduction,
        completedProduction,
        totalRevenue,
        productionByStatus,
        recentOrders: purchaseOrders.slice(0, 5),
      };
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
  };

  const productionStatusData = stats?.productionByStatus
    ? Object.entries(stats.productionByStatus).map(([status, count]) => ({
        name: status.replace(/_/g, " ").charAt(0).toUpperCase() + status.replace(/_/g, " ").slice(1),
        value: count,
      }))
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Title Section */}
          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-semibold">
              ERP Dashboard
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Enterprise Resource Planning — Manage inventory, procurement, production, and finances
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              asChild
            >
              <Link to="/dashboard/erp/inventory">
                Manage Inventory
              </Link>
            </Button>

            <Button
              size="sm"
              className="w-full sm:w-auto"
              asChild
            >
              <Link to="/dashboard/erp/procurement/new">
                New Purchase Order
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Inventory Items" value={stats?.totalInventory || 0} icon={Package} />
          <StatsCard title="Inventory Value" value={formatCurrency(stats?.inventoryValue || 0)} icon={BarChart3} />
          <StatsCard title="Low Stock Items" value={stats?.lowStockItems || 0} icon={AlertCircle} />
          <StatsCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} icon={DollarSign} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Production Orders" value={stats?.totalProduction || 0} icon={BarChart3} />
          <StatsCard title="Completed Orders" value={stats?.completedProduction || 0} icon={CheckCircle2} />
          <StatsCard title="Pending Orders" value={stats?.productionByStatus?.pending || 0} icon={Clock} />
          <StatsCard title="Procurement Value" value={formatCurrency(stats?.totalProcurementValue || 0)} icon={Truck} />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Production Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={productionStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {productionStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Production Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productionStatusData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="value" fill="hsl(250, 85%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders & Quick Actions */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentOrders?.length ? (
                  stats.recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="font-medium">{order.supplier_name || "Unnamed Supplier"}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(order.total_amount || 0)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_COLORS[order.status] || ""}>{order.status.replace(/_/g, " ")}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No purchase orders yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <Link to="/dashboard/erp/inventory">
                    <Package className="h-6 w-6" />
                    <span>Inventory</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <Link to="/dashboard/erp/procurement">
                    <Truck className="h-6 w-6" />
                    <span>Procurement</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <Link to="/dashboard/erp/production">
                    <BarChart3 className="h-6 w-6" />
                    <span>Production</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <Link to="/dashboard/erp/finance">
                    <DollarSign className="h-6 w-6" />
                    <span>Finance</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
