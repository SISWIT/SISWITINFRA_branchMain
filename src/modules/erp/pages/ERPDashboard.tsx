import { 
  Package, 
  Truck, 
  BarChart3, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Button } from "@/ui/shadcn/button";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useParams, Link } from "react-router-dom";
import { StatsCard } from "@/modules/crm/components/StatsCard";
import { Badge } from "@/ui/shadcn/badge";
import { 
  useInventoryItems,
  usePurchaseOrders,
  useProductionOrders,
  useFinancialRecords,
} from "@/modules/erp/hooks/useERP";
import type { PurchaseOrder } from "@/core/types/erp";
import { PURCHASE_ORDER_STATUS_COLORS } from "@/core/types/erp";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--destructive))",
];

export default function ERPDashboard() {
  const { tenantSlug } = useParams();
  
  // Scoped hook calls
  const inventoryQuery = useInventoryItems();
  const procurementQuery = usePurchaseOrders();
  const productionQuery = useProductionOrders();
  const financeQuery = useFinancialRecords();

  const isLoading = 
    inventoryQuery.isLoading || 
    procurementQuery.isLoading || 
    productionQuery.isLoading || 
    financeQuery.isLoading;

  // --- Calculations ---
  const inventory = inventoryQuery.data || [];
  const production = productionQuery.data || [];
  const procurement = procurementQuery.data || [];
  const finance = financeQuery.data || [];

  const totalInventory = inventory.length;
  // Use 'status' directly from the mapped InventoryItem
  const lowStockItems = inventory.filter(item => item.status === "low_stock" || item.status === "out_of_stock").length;
  
  const inventoryValue = inventory.reduce((sum, item) => {
    return sum + ((item.unit_cost || 0) * (item.quantity_on_hand || 0));
  }, 0);

  const totalRevenue = finance
    .filter(r => r.type === "income")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const totalProcurementValue = procurement
    .filter(po => po.status === "approved" || po.status === "pending")
    .reduce((sum, po) => sum + Number(po.total || 0), 0);

  const productionByStatus = {
    planned: production.filter(po => po.status === "planned").length,
    in_progress: production.filter(po => po.status === "in_progress").length,
    completed: production.filter(po => po.status === "completed").length,
    cancelled: production.filter(po => po.status === "cancelled").length,
  };

  const dashboardStats = {
    totalInventory,
    lowStockItems,
    inventoryValue,
    totalProcurementValue,
    totalProduction: production.length,
    completedProduction: productionByStatus.completed,
    pendingProduction: productionByStatus.planned + productionByStatus.in_progress,
    totalRevenue,
    productionByStatus,
    recentOrders: procurement.slice(0, 5),
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", { 
        style: "currency", 
        currency: "INR", 
        notation: "compact", 
        maximumFractionDigits: 1 
    }).format(value);
  };

  const productionStatusData = Object.entries(productionByStatus).map(([status, count]) => ({
    name: status.replace(/_/g, " ").charAt(0).toUpperCase() + status.replace(/_/g, " ").slice(1),
    value: count,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-semibold">ERP Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage inventory, procurement, production, and finances
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/${tenantSlug}/app/erp/inventory`}>Manage Inventory</Link>
            </Button>
            
            <Button size="sm" asChild>
              <Link to={`/${tenantSlug}/app/erp/procurement`}>View Purchase Orders</Link>
            </Button>
          </div>
        </div>

        {/* Top Row Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Inventory Items" value={dashboardStats.totalInventory} icon={Package} />
          <StatsCard title="Inventory Value" value={formatCurrency(dashboardStats.inventoryValue)} icon={BarChart3} />
          <StatsCard title="Low Stock Alert" value={dashboardStats.lowStockItems} icon={AlertCircle} />
          <StatsCard title="Total Income" value={formatCurrency(dashboardStats.totalRevenue)} icon={DollarSign} />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Production Orders" value={dashboardStats.totalProduction} icon={BarChart3} />
          <StatsCard title="Completed" value={dashboardStats.completedProduction} icon={CheckCircle2} />
          <StatsCard title="Active/Planned" value={dashboardStats.pendingProduction} icon={Clock} />
          <StatsCard title="Procurement Pipeline" value={formatCurrency(dashboardStats.totalProcurementValue)} icon={Truck} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Pie Chart */}
          <Card>
            <CardHeader><CardTitle>Production Status</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={productionStatusData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={100} 
                      paddingAngle={2} 
                      dataKey="value" 
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
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

          {/* Recent Purchase Orders */}
          <Card>
            <CardHeader><CardTitle>Recent Purchase Orders</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardStats.recentOrders.length ? (
                  dashboardStats.recentOrders.map((order: PurchaseOrder) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{order.supplier?.name || "Unknown Vendor"}</p>
                        <p className="text-xs text-muted-foreground">
                            {order.po_number || "No ID"}
                        </p>
                        <p className="text-sm font-semibold">{formatCurrency(order.total || 0)}</p>
                      </div>
                      <Badge className={(order.status && PURCHASE_ORDER_STATUS_COLORS[order.status]) || "bg-secondary text-secondary-foreground"}>
                        {order.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-10">No recent orders</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
