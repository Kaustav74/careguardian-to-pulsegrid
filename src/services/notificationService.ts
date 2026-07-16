// ============================================================
// PULSEGRID — NOTIFICATION SERVICE (LOCAL BACKEND)
// ============================================================
import type { AppNotification } from '../types';
import { useAuthStore } from '../store/authStore';

const API_URL = 'http://localhost:4000/api/notifications';

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Polling interval ID for pseudo-realtime notifications
let pollInterval: NodeJS.Timeout | null = null;

export function subscribeToNotifications(uid: string, callback: (notifs: AppNotification[]) => void): () => void {
  const fetchNotifs = async () => {
    try {
      const response = await fetch(`${API_URL}`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        callback(data);
      }
    } catch (error) {
      console.error('Error polling notifications', error);
    }
  };

  // Initial fetch
  fetchNotifs();

  // Poll every 10 seconds since we dropped Firebase Realtime connections
  pollInterval = setInterval(fetchNotifs, 10000);

  // Unsubscribe function
  return () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  await fetch(`${API_URL}/${notifId}/read`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
}

export async function markAllAsRead(uid: string): Promise<void> {
  await fetch(`${API_URL}/read-all`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
}
