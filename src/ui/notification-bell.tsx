import { Bell, CheckCircle, FileText, Share2, AlertTriangle, UserPlus, FileCheck, ShoppingCart, Info, X, Briefcase, Building, Phone, Calendar, Truck, Box, Wrench, DollarSign, Layers, ArrowUpCircle, ArrowDownCircle, CreditCard, Clock3 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/shadcn/popover";
import { Button } from "@/ui/shadcn/button";
import { ScrollArea } from "@/ui/shadcn/scroll-area";
import { Badge } from "@/ui/shadcn/badge";
import { useNotifications } from "@/core/hooks/useNotifications";
import { useTenant } from "@/core/tenant/useTenant";
import { resolveNotificationLink } from "@/core/utils/notification-links";
import { cn } from "@/core/utils/utils";
import type { Notification, NotificationType } from "@/core/types/notifications";

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  contract_signed: <FileCheck className="h-4 w-4 text-success" />,
  contract_expiring: <AlertTriangle className="h-4 w-4 text-warning" />,
  quote_accepted: <CheckCircle className="h-4 w-4 text-success" />,
  quote_rejected: <X className="h-4 w-4 text-destructive" />,
  document_shared: <Share2 className="h-4 w-4 text-info" />,
  esignature_requested: <FileText className="h-4 w-4 text-primary" />,
  esignature_completed: <CheckCircle className="h-4 w-4 text-success" />,
  plan_limit_warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  plan_limit_reached: <AlertTriangle className="h-4 w-4 text-destructive" />,
  purchase_order_approved: <ShoppingCart className="h-4 w-4 text-success" />,
  member_joined: <UserPlus className="h-4 w-4 text-primary" />,
  lead_created: <Briefcase className="h-4 w-4 text-primary" />,
  account_created: <Building className="h-4 w-4 text-primary" />,
  contact_created: <Phone className="h-4 w-4 text-primary" />,
  activity_created: <Calendar className="h-4 w-4 text-primary" />,
  supplier_created: <Truck className="h-4 w-4 text-primary" />,
  inventory_item_created: <Box className="h-4 w-4 text-primary" />,
  purchase_order_created: <ShoppingCart className="h-4 w-4 text-primary" />,
  production_order_created: <Wrench className="h-4 w-4 text-primary" />,
  financial_record_created: <DollarSign className="h-4 w-4 text-success" />,
  document_template_created: <Layers className="h-4 w-4 text-primary" />,
  auto_document_created: <FileText className="h-4 w-4 text-primary" />,
  document_version_created: <FileCheck className="h-4 w-4 text-primary" />,
  subscription_created: <CheckCircle className="h-4 w-4 text-success" />,
  subscription_cancelled: <AlertTriangle className="h-4 w-4 text-warning" />,
  plan_upgraded: <ArrowUpCircle className="h-4 w-4 text-success" />,
  plan_downgraded: <ArrowDownCircle className="h-4 w-4 text-warning" />,
  payment_success: <CreditCard className="h-4 w-4 text-success" />,
  payment_failed: <CreditCard className="h-4 w-4 text-destructive" />,
  trial_started: <Clock3 className="h-4 w-4 text-info" />,
  trial_ended: <Clock3 className="h-4 w-4 text-warning" />,
};

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { memberships, activeTenantSlug } = useTenant();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setOpen(false);

    const link = resolveNotificationLink({
      link: notification.link,
      notificationOrganizationId: notification.organization_id,
      activeTenantSlug,
      memberships,
    });

    if (link) {
      navigate(link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full border-2 border-background text-[10px] font-bold"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Bell className="h-6 w-6 text-muted-foreground opacity-20" />
              </div>
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">We'll let you know when something important happens.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    "flex w-full items-start gap-3 border-b px-4 py-4 text-left transition-colors last:border-0 hover:bg-muted/50",
                    !notification.is_read && "bg-primary/5 hover:bg-primary/10"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background border">
                    {NOTIFICATION_ICONS[notification.type] || <Info className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn(
                      "text-sm leading-none",
                      !notification.is_read ? "font-semibold" : "font-medium"
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button variant="ghost" className="w-full text-xs text-muted-foreground" size="sm">
              View all history (Soon)
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
