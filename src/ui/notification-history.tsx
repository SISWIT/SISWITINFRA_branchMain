import { Bell, Info, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/ui/shadcn/button";
import { Badge } from "@/ui/shadcn/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/shadcn/card";
import { useAuth } from "@/core/auth/useAuth";
import { useTenant } from "@/core/tenant/useTenant";
import { useNotifications } from "@/core/hooks/useNotifications";
import { resolveNotificationNavigationTarget } from "@/core/utils/notification-links";
import { cn } from "@/core/utils/utils";
import { NOTIFICATION_ICONS } from "@/ui/notification-icons";
import type { Notification } from "@/core/types/notifications";

interface NotificationHistoryProps {
  title: string;
  description: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function NotificationHistory({
  title,
  description,
  emptyTitle = "No notifications yet",
  emptyDescription = "You are all caught up. New activity will appear here.",
}: NotificationHistoryProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { role } = useAuth();
  const { memberships, activeTenantSlug } = useTenant();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    const link = resolveNotificationNavigationTarget({
      link: notification.link,
      notificationOrganizationId: notification.organization_id,
      activeTenantSlug,
      memberships,
      role,
      currentPathname: pathname,
      notificationType: notification.type,
    });

    if (link) {
      navigate(link);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
              Mark all as read
            </Button>
          )}
        </div>
      </section>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Notification History</CardTitle>
          <CardDescription>Latest 50 entries for your account.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <Bell className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-semibold">{emptyTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">{emptyDescription}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 bg-background px-4 py-4 text-left transition-colors hover:bg-muted/40",
                    !notification.is_read && "bg-primary/5 hover:bg-primary/10",
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                    {NOTIFICATION_ICONS[notification.type] || <Info className="h-4 w-4 text-muted-foreground" />}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm", !notification.is_read ? "font-semibold" : "font-medium")}>
                        {notification.title}
                      </p>
                      <p className="shrink-0 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
