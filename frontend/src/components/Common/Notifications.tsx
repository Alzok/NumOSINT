'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Close, CheckCircleOutline, ErrorOutline, InfoOutlined, WarningAmber, DeleteSweep } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, NotificationAction } from '@/lib/store';

const NotificationActionButton = ({ action, onActionClick }: { action: NotificationAction, onActionClick: () => void }) => {
  const commonClass = "px-2 py-1 text-xs rounded-md bg-white/20 hover:bg-white/30 transition-colors";

  if (action.href) {
    return (
      <Link href={action.href} passHref legacyBehavior>
        <a onClick={onActionClick} className={commonClass}>
          {action.label}
        </a>
      </Link>
    );
  }

  return (
    <button onClick={onActionClick} className={commonClass}>
      {action.label}
    </button>
  );
};


export default function Notifications() {
  const { notifications, removeNotification, clearNotifications } = useAppStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutline className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ErrorOutline className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <WarningAmber className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <InfoOutlined className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      <AnimatePresence>
        {notifications.length > 1 && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`rounded-lg border p-2 shadow-lg backdrop-blur-sm flex items-center justify-between text-sm ${getStyles('info')}`}
          >
            <span className="font-medium">
              {notifications.length} notifications
            </span>
            <button
              onClick={clearNotifications}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              aria-label="Clear all notifications"
            >
              <DeleteSweep className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            layout
            initial={{ opacity: 0, x: 300, scale: 0.3 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
          >
            <div className={`rounded-lg border p-4 shadow-lg backdrop-blur-sm ${getStyles(notification.type)}`}>
              <div className="flex items-start space-x-3">
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