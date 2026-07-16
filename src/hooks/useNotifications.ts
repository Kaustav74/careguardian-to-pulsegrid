// ============================================================
// PULSEGRID — useNotifications HOOK
// ============================================================
import { useNotificationStore } from '../store/notificationStore';
import { markNotificationAsRead, markAllAsRead } from '../services/notificationService';

export function useNotifications() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore();

  const handleMarkRead = async (id: string) => {
    markRead(id);
    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    const ids = notifications.filter((n) => !n.isRead).map((n) => n.id);
    markAllRead();
    if (ids.length) await markAllAsRead('');
  };

  return {
    notifications,
    unreadCount,
    markRead: handleMarkRead,
    markAllRead: handleMarkAllRead,
  };
}
