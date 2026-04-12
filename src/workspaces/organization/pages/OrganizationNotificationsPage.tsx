import { NotificationHistory } from "@/ui/notification-history";

export default function OrganizationNotificationsPage() {
  return (
    <NotificationHistory
      title="Owner Notifications"
      description="Organization-wide updates, approvals, and billing events."
      emptyDescription="Owner notifications will appear here when important events happen."
    />
  );
}
