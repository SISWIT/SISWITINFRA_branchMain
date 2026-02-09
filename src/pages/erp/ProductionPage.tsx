import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/crm/DashboardLayout";
import { Link } from "react-router-dom";

export default function ProductionPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-semibold">Production Management</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Track and manage production orders and schedules
            </p>
          </div>
          <Button asChild>
            <Link to="/dashboard/erp/production/new">
              <Plus className="h-4 w-4 mr-2" />
              New Production Order
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Production Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No production orders yet. Create your first order to get started.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
