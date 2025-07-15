import { StateCreator } from 'zustand';
import { ToastNotification, AppNotification } from '@/types';
import { generateId } from '../utils';
import { AppStore } from '../store';

export interface NotificationSlice {
  toastNotifications: ToastNotification[];
  appNotifications: AppNotification[];
  addToastNotification: (notification: Omit<ToastNotification, 'id'>) => void;
  removeToastNotification: (id: string) => void;
  clearToastNotifications: () => void;
  setAppNotifications: (notifications: AppNotification[]) => void;
  addAppNotification: (notification: AppNotification) => void;
  markAppNotificationsAsRead: (ids: string[]) => void;
  markAllAppNotificationsAsRead: () => void;
}

export const createNotificationSlice: StateCreator<
  AppStore,
  [],
  [],
  NotificationSlice
> = (set, get) => ({
  toastNotifications: [],
  appNotifications: [],
  addToastNotification: (notification) => {
    const id = generateId();
    const newNotification = { ...notification, id };
    set((state) => ({ toastNotifications: [newNotification, ...state.toastNotifications] }));
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => get().removeToastNotification(id), notification.duration);
    }
  },
  removeToastNotification: (id) =>
    set((state) => ({
      toastNotifications: state.toastNotifications.filter((n) => n.id !== id),
    })),
  clearToastNotifications: () => set({ toastNotifications: [] }),
  setAppNotifications: (notifications) => set({ appNotifications: notifications }),
  addAppNotification: (notification) => set((state) => ({
    appNotifications: [notification, ...state.appNotifications]
  })),
  markAppNotificationsAsRead: (ids) => set((state) => ({
    appNotifications: state.appNotifications.map((n) =>
      ids.includes(n.id) ? { ...n, read: true } : n
    ),
  })),
  markAllAppNotificationsAsRead: () => set((state) => ({
    appNotifications: state.appNotifications.map((n) => ({ ...n, read: true })),
  })),
});