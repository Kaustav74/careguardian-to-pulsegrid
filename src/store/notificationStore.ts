// ============================================================
// PULSEGRID — NOTIFICATION ZUSTAND STORE
// ============================================================
import { create } from 'zustand';
import type { AppNotification } from '../types';

interface NotificationStoreState {
  notifications: AppNotification[];
  unreadCount:   number;

  // Actions
  addNotification:    (n: AppNotification) => void;
  markRead:           (id: string) => void;
  markAllRead:        () => void;
  removeNotification: (id: string) => void;
  setNotifications:   (list: AppNotification[]) => void;
  clearAll:           () => void;
}

export const useNotificationStore = create<NotificationStoreState>()((set, get) => ({
  notifications: [],
  unreadCount:   0,

  setNotifications: (list) =>
    set({ notifications: list, unreadCount: list.filter((n) => !n.isRead).length }),

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + (n.isRead ? 0 : 1),
    })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - (s.notifications.find(n => n.id === id && !n.isRead) ? 1 : 0)),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((s) => {
      const target = s.notifications.find((n) => n.id === id);
      return {
        notifications: s.notifications.filter((n) => n.id !== id),
        unreadCount: Math.max(0, s.unreadCount - (target && !target.isRead ? 1 : 0)),
      };
    }),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
