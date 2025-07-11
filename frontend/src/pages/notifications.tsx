'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const NotificationIcon = ({ type }: { type: string }) => {
    // Simple icons for now
    switch (type) {
        case 'success': return <span className="text-green-500">✓</span>;
        case 'error': return <span className="text-red-500">✗</span>;
        case 'warning': return <span className="text-yellow-500">!</span>;
        default: return <span className="text-blue-500">i</span>;
    }
};

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useAppStore();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Centre de Notifications</h1>
        <div className="flex gap-2">
            <Button onClick={markAllAsRead} variant="outline">Tout marquer comme lu</Button>
            <Button onClick={clearNotifications} variant="destructive">Tout effacer</Button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                    <NotificationIcon type={notification.type} />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">{notification.title}</p>
                    {!notification.isRead && <Badge>Nouveau</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <div className="flex gap-2 mt-2">
                    {notification.actions?.map((action, index) => (
                        <Button key={index} size="sm" variant="ghost" onClick={(e) => {
                            e.stopPropagation();
                            action.onClick();
                        }}>
                            {action.label}
                        </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aucune notification pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}