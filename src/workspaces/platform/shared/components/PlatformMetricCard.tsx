import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { cn } from "@/core/utils/utils";

interface PlatformMetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  trend?: {
    value: number; // percentage
    label: string;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
  valueClassName?: string;
}

export function PlatformMetricCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
  valueClassName,
}: PlatformMetricCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
        {(description || trend) && (
          <div className="flex items-center mt-1 text-xs text-muted-foreground">
            {trend && (
              <span
                className={cn(
                  "mr-1 flex items-center gap-0.5",
                  trend.direction === "up" && "text-green-600 dark:text-green-400",
                  trend.direction === "down" && "text-red-600 dark:text-red-400"
                )}
              >
                {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "−"}
                {Math.abs(trend.value)}%
              </span>
            )}
            <span className="truncate">{trend ? trend.label : description}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
