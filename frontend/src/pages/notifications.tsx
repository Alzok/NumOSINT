'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { BellIcon, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function NotificationsPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const { appNotifications, markAppNotificationsAsRead, markAllAppNotificationsAsRead, addToastNotification } = useAppStore();
  const [loading, setLoading] = useState(false);

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    markAppNotificationsAsRead([id]);
    const { error } = await api.markNotificationsAsRead([id], token);
    if (error) {
      addToastNotification({
        type: 'error',
        title: 'Erreur',
        message: "Impossible de marquer la notification comme lue.",
      });
      // TODO: Revert state on error
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    // Optimistic UI update
    markAllAppNotificationsAsRead();
    const { error } = await api.markAllNotificationsAsRead(token);
    if (error) {
      addToastNotification({
        type: 'error',
        title: 'Erreur',
        message: "Impossible de marquer les notifications comme lues.",
      });
       // TODO: Revert state on error
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BellIcon className="h-8 w-8" />
          Centre de Notifications
        </h1>
        <Button onClick={handleMarkAllAsRead} variant="outline" disabled={appNotifications.every(n => n.read) || loading}>
          <CheckCheck className="h-4 w-4 mr-2" />
          {loading ? "Chargement..." : "Tout marquer comme lu"}
        </Button>
      </div>

      <div className="space-y-4">
        {appNotifications.length > 0 ? (
          appNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all duration-300 ease-in-out ${!notification.read ? 'bg-card' : 'bg-muted/50'}`}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  <span className={`flex h-3 w-3 rounded-full ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                </div>
                <div className="flex-grow">
                  <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                  <div className="flex gap-4 mt-2">
                    {notification.link && (
                      <Button asChild variant="link" className="p-0 h-auto">
                        <Link href={notification.link}>Voir les détails</Link>
                      </Button>
                    )}
                    {!notification.read && (
                       <Button variant="link" className="p-0 h-auto text-xs" onClick={() => handleMarkAsRead(notification.id)}>
                         Marquer comme lu
                       </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <BellIcon className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg">C&apos;est bien calme ici.</p>
            <p>Aucune notification pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}