'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { BellIcon, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { AppNotification } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export function NotificationBell() {
  const { appNotifications, markAppNotificationsAsRead, markAllAppNotificationsAsRead } = useAppStore();
  const unreadCount = appNotifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (notification: AppNotification) => {
    if (notification.read) return;
    
    markAppNotificationsAsRead([notification.id]);
    await fetch(`${API_URL}/api/notifications/mark-as-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [notification.id] }),
    });
  };
  
  const handleMarkAllAsRead = async () => {
    markAllAppNotificationsAsRead();
    await fetch(`${API_URL}/api/notifications/mark-all-as-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 items-center justify-center text-xs text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium leading-none">Notifications</h4>
            {unreadCount > 0 && (
              <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleMarkAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Tout marquer comme lu
              </Button>
            )}
          </div>
          <div className="grid gap-2">
            {appNotifications.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune notification.</p>
            )}
            {appNotifications.slice(0, 5).map((notification) => (
              <Link
                key={notification.id}
                href={notification.link || '/notifications'}
                passHref
                className="block p-2 rounded-lg hover:bg-muted"
                onClick={() => handleMarkAsRead(notification)}
              >
                <div className="flex items-start gap-3">
                   <span className={`flex h-2 w-2 translate-y-1.5 rounded-full ${!notification.read ? 'bg-blue-500' : ''}`} />
                   <div className="space-y-1">
                     <p className="text-sm font-medium leading-none">
                       {notification.message}
                     </p>
                     <p className="text-xs text-muted-foreground">
                       {new Date(notification.createdAt).toLocaleString()}
                     </p>
                   </div>
                </div>
              </Link>
            ))}
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/notifications">Voir toutes les notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}