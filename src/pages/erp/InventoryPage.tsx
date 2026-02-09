import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Link } from "react-router-dom";

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-semibold">Inventory Management</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Track and manage your inventory levels
            </p>
          </div>
          <Button asChild>
            <Link to="/dashboard/erp/inventory/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No items yet. Create your first inventory item to get started.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
