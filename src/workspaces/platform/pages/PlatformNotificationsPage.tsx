import { NotificationHistory } from "@/ui/notification-history";

export default function PlatformNotificationsPage() {
  return (
    <NotificationHistory
      title="Platform Notifications"
      description="System-wide events and account-level notification history."
      emptyDescription="Platform notifications will appear here when relevant events occur."
    />
  );
}
