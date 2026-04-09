import { ArrowRight, FileSignature, FileText, FolderOpen } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Button } from "@/ui/shadcn/button";
import { Badge } from "@/ui/shadcn/badge";
import { tenantAppPath } from "@/core/utils/routes";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";

export default function CPQTemplatesHubPage() {
  const { tenantSlug = "" } = useParams<{ tenantSlug: string }>();
  const { hasModule } = useOrganization();

  const templateDestinations = [
    {
      key: "documents",
      title: "Document Templates",
      description: "Manage reusable proposal, invoice, agreement, and report templates that support quote-adjacent document workflows.",
      href: tenantAppPath(tenantSlug, "documents/templates"),
      enabled: hasModule("documents"),
      icon: FileText,
    },
    {
      key: "clm",
      title: "Contract Templates",
      description: "Open the contract template library used when approved quotes are converted into formal agreements.",
      href: tenantAppPath(tenantSlug, "clm/templates"),
      enabled: hasModule("clm"),
      icon: FileSignature,
    },
  ];

  const availableCount = templateDestinations.filter((item) => item.enabled).length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Templates</h1>
            <p className="text-muted-foreground">
              Find the reusable template libraries that support quote, proposal, and contract workflows.
            </p>
          </div>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          CPQ does not yet have a dedicated quote-template manager, so this hub surfaces the existing template workflows
          already available in your workspace without making you hunt through other module sidebars.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {templateDestinations.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.key} className={item.enabled ? "border-primary/15" : "border-border/70 opacity-80"}>
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription className="mt-1">{item.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={item.enabled ? "default" : "secondary"}>
                    {item.enabled ? "Available" : "Locked"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {item.enabled ? (
                  <Button asChild className="w-full sm:w-auto">
                    <Link to={item.href}>
                      Open Library
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    This template library is not enabled for the current workspace plan.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {availableCount === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-lg font-semibold">No template libraries are available right now</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask your organization admin to enable CLM or Documents if you want reusable templates for quote-driven workflows.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
