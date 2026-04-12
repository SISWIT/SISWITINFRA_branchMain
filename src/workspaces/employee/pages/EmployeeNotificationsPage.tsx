import { NotificationHistory } from "@/ui/notification-history";

export default function EmployeeNotificationsPage() {
  return (
    <NotificationHistory
      title="My Notifications"
      description="Track updates from your assigned work and team activity."
      emptyDescription="Your personal notification history will appear here."
    />
  );
}
