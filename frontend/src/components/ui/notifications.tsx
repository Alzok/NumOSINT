'use client';

import { useEffect, useState } from 'react';
import { Close, CheckCircleOutline, ErrorOutline, WarningAmber, InfoOutlined } from '@mui/icons-material';
import { useAppStore } from '@/lib/store';
import { ToastNotification } from '@/types';

export function Notifications() {
  const { toastNotifications, removeToastNotification } = useAppStore();
  const [visibleNotifications, setVisibleNotifications] = useState<ToastNotification[]>([]);

  useEffect(() => {
    setVisibleNotifications(toastNotifications);
  }, [toastNotifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutline className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ErrorOutline className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <WarningAmber className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <InfoOutlined className="h-5 w-5 text-blue-500" />;
      default:
        return <InfoOutlined className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 border rounded-lg shadow-lg ${getBackgroundColor(notification.type)} animate-in slide-in-from-right-2 duration-300`}
        >
          <div className="flex items-start gap-3">
            {getIcon(notification.type)}
            <div className="flex-1">
              <h4 className={`font-medium ${getTextColor(notification.type)}`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${getTextColor(notification.type)} opacity-90`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeToastNotification(notification.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Close className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}