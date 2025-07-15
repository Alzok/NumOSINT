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
  const { appNotifications, setAppNotifications, addAppNotification, markAllAppNotificationsAsRead } = useAppStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const unreadCount = appNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const newSocket = io(API_URL, { transports: ['websocket'] });
    setSocket(newSocket);

    // TODO: Remplacer par la logique d'authentification pour obtenir le vrai userId
    // newSocket.emit('join_user', userId);

    newSocket.on('notification:new', (notification) => {
      addAppNotification(notification);
    });

    // TODO: Remplacer par un appel authentifié
    // fetch(`${API_URL}/api/notifications`)
    //   .then(res => res.json())
    //   .then(data => setAppNotifications(data));

    return () => {
      newSocket.off('notification:new');
      newSocket.disconnect();
    };
  }, [addAppNotification, setAppNotifications]);

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
      <PopoverContent className="w-96">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              Vous avez {unreadCount} notification(s) non lue(s).
            </p>
          </div>
          <div className="grid gap-2">
            {appNotifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className="grid grid-cols-[15px_1fr] items-start pb-4 last:mb-0 last:pb-0"
              >
                <span className={`flex h-2 w-2 translate-y-1 rounded-full ${!notification.read ? 'bg-sky-500' : ''}`} />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                  {notification.link && (
                    <Link href={notification.link} className="text-sm text-blue-500 hover:underline mt-1 inline-block">
                      Voir les détails
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAppNotificationsAsRead()}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}