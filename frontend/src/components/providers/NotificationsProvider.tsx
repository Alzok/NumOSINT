'use client';

import React, { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/lib/store';
import { AppNotification } from '@/types';
import { api } from '@/lib/api-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const { setAppNotifications, addAppNotification, addToastNotification } = useAppStore();

  useEffect(() => {
    if (!token) return;

    let socket: Socket | null = null;

    const fetchInitialNotifications = async () => {
      const { data, error } = await api.getNotifications(token);
      if (data) {
        setAppNotifications(data);
      } else if (error) {
        console.error("Could not fetch notifications:", error);
        addToastNotification({
          type: 'error',
          title: 'Erreur de connexion',
          message: 'Impossible de récupérer les notifications.',
        });
      }
    };

    const connectSocket = () => {
      socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        auth: { token },
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
        // Récupérer les notifications initiales une fois connecté
        fetchInitialNotifications();
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on('notification:new', (notification: AppNotification) => {
        addAppNotification(notification);
        // On ne crée plus de toast pour chaque notification, la cloche suffit.
      });
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('notification:new');
        socket.disconnect();
      }
    };
  }, [token, setAppNotifications, addAppNotification, addToastNotification]);

  return <>{children}</>;
}