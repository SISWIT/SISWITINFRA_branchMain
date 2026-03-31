import { ReactNode } from "react";

interface PlatformPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PlatformPageHeader({ title, description, actions }: PlatformPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
