import { NotificationHistory } from "@/ui/notification-history";

export default function PortalNotificationsPage() {
  return (
    <NotificationHistory
      title="Portal Notifications"
      description="Updates related to your quotes, contracts, and pending signatures."
      emptyDescription="Portal notifications will appear here once actions require your attention."
    />
  );
}
