'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '@/lib/store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { BellIcon } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export function Notifications() {
  const { notifications, setNotifications, addNotification } = useAppStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Connexion au serveur Socket.IO
    const newSocket = io(API_URL, {
      transports: ['websocket'],
    });
    setSocket(newSocket);

    // Rejoindre la room de l'utilisateur
    // TODO: Remplacer 'static_user_id' par l'ID de l'utilisateur authentifié
    newSocket.emit('join_user', 'static_user_id');

    // Écouter les nouvelles notifications
    newSocket.on('notification:new', (notification) => {
      addNotification(notification);
    });

    // Récupérer les notifications initiales
    fetch(`${API_URL}/api/notifications`)
      .then(res => res.json())
      .then(data => setNotifications(data));

    return () => {
      newSocket.off('notification:new');
      newSocket.disconnect();
    };
  }, [addNotification, setNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await fetch(`${API_URL}/api/notifications/mark-as-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    // Mettre à jour l'état local
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              Vous avez {unreadCount} notification(s) non lue(s).
            </p>
          </div>
          <div className="grid gap-2">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
              >
                <span className={`flex h-2 w-2 translate-y-1 rounded-full ${!notification.read ? 'bg-sky-500' : ''}`} />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {notification.message}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                  {notification.link && (
                    <Link href={notification.link} className="text-sm text-blue-500 hover:underline">
                      Voir les détails
                    </Link>
                  )}
                </div>
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {notification.title}
                  </p>
                  {notification.message && (
                    <p className="text-sm opacity-90 mt-1">
                      {notification.message}
                    </p>
                  )}
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {notification.actions.map((action, index) => (
                        <NotificationActionButton
                          key={index}
                          action={action}
                          onActionClick={() => {
                            if (action.onClick) {
                                action.onClick();
                            }
                            removeNotification(notification.id);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 ml-2 p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                >
                  <Close className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}