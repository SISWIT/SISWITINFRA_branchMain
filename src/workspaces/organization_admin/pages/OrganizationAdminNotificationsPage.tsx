import { NotificationHistory } from "@/ui/notification-history";

export default function OrganizationAdminNotificationsPage() {
  return (
    <NotificationHistory
      title="Admin Notifications"
      description="Command Center activity across modules, members, and subscriptions."
      emptyDescription="Admin notifications will appear here as your team performs actions."
    />
  );
}
