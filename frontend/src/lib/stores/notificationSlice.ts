import { StateCreator } from 'zustand';
import { toast } from 'sonner';
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
  removeAppNotification: (id: string) => void;
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

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, { description: notification.message, id });
        break;
      case 'error':
        toast.error(notification.title, { description: notification.message, id });
        break;
      case 'warning':
        toast.warning(notification.title, { description: notification.message, id });
        break;
      case 'info':
        toast.info(notification.title, { description: notification.message, id });
        break;
      default:
        toast(notification.title, { description: notification.message, id });
        break;
    }
  },
  removeToastNotification: (id) =>
    set((state) => ({
      toastNotifications: state.toastNotifications.filter((n) => n.id !== id),
    })),
  clearToastNotifications: () => {
    toast.dismiss();
    set({ toastNotifications: [] });
  },
  setAppNotifications: (notifications) => set({ appNotifications: notifications }),
  addAppNotification: (notification) => set((state) => ({
    appNotifications: [notification, ...state.appNotifications]
  })),
  removeAppNotification: (id) => set((state) => ({
    appNotifications: state.appNotifications.filter((n) => n.id !== id),
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