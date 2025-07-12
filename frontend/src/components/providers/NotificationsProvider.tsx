'use client';

import React, { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '@/lib/store';
import { AppNotification } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { setAppNotifications, addAppNotification, addToastNotification } = useAppStore();

  useEffect(() => {
    let socket: Socket | null = null;

    const connectSocket = () => {
      socket = io(API_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
      });

      // TODO: Remplacer 'static_user_id' par l'ID de l'utilisateur authentifié
      const userId = 'static_user_id';
      socket.emit('join_user', userId);

      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on('notification:new', (notification: AppNotification) => {
        addAppNotification(notification);
        addToastNotification({
          type: 'info',
          title: 'Nouvelle notification',
          message: notification.message,
          duration: 5000,
        });
      });

      // Récupérer les notifications initiales
      fetch(`${API_URL}/api/notifications`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch notifications');
          }
          return res.json();
        })
        .then(data => {
          setAppNotifications(data);
        })
        .catch(error => {
          console.error("Could not fetch notifications:", error);
          addToastNotification({
            type: 'error',
            title: 'Erreur de connexion',
            message: 'Impossible de récupérer les notifications.',
          });
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
  }, [setAppNotifications, addAppNotification, addToastNotification]);

  return <>{children}</>;
}