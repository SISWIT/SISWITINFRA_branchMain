import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Link } from "react-router-dom";

export default function ProcurementPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-semibold">Procurement</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage purchase orders and supplier relationships
            </p>
          </div>
          <Button asChild>
            <Link to="/dashboard/erp/procurement/new">
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No purchase orders yet. Create your first order to get started.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
