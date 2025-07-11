'use client';

import { useEffect, useState } from 'react';
import { Schedule, Person, CheckCircleOutline, Cancel, Delete } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useAppStore } from '@/lib/store';
import { useSearch } from '@/hooks/useSearch';
import { formatRelativeTime } from '@/lib/utils';
import { Button } from '../ui/button';

export default function ActiveSearches() {
  const { activeSearches, updateSearchStatus, clearCompletedSearches } = useAppStore();
  const { getSearchStatus } = useSearch();
  const [, setNow] = useState(new Date());

  // Force a re-render every 30 seconds to update relative times
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Polling pour mettre à jour le statut des recherches
  useEffect(() => {
    if (activeSearches.some(s => s.status === 'running' || s.status === 'started')) {
      const interval = setInterval(async () => {
        for (const search of activeSearches) {
          if (search.status === 'running' || search.status === 'started') {
            const status = await getSearchStatus(search.task_id);
            if (status) {
              updateSearchStatus(search.task_id, status);
            }
          }
        }
      }, 5000); // Polling toutes les 5 secondes

      return () => clearInterval(interval);
    }
  }, [activeSearches, getSearchStatus, updateSearchStatus]);

  if (activeSearches.length === 0) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutline className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <Cancel className="h-5 w-5 text-red-500" />;
      case 'running':
      case 'started':
        return <CircularProgress size={20} color="inherit" />;
      default:
        return <Schedule className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`}>Terminé</span>;
      case 'failed':
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`}>Échoué</span>;
      case 'running':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300`}>En cours</span>;
      case 'started':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>Démarré</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>{status}</span>;
    }
  };

  return (
    <div className="w-full p-6 bg-card rounded-lg shadow-md border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <CircularProgress size={20} color="inherit" className="mr-2" />
          Recherches actives ({activeSearches.length})
        </h3>
        <Button variant="outline" size="sm" onClick={clearCompletedSearches}>
          <Delete className="h-4 w-4 mr-2" />
          Nettoyer les tâches terminées
        </Button>
      </div>
      <div className="space-y-4">
        {activeSearches.map((search) => (
          <div
            key={search.task_id}
            className="flex flex-col sm:flex-row items-start justify-between p-4 border rounded-lg bg-muted/50"
          >
            <div className="flex items-center gap-4 flex-grow">
              {getStatusIcon(search.status)}
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <Person className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {search.first_name} {search.last_name}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {search.started_at && (
                    <span>Démarré {formatRelativeTime(search.started_at)}</span>
                  )}
                </div>
                {search.status === 'failed' && search.error && (
                  <div className="mt-2 text-xs text-red-500 bg-red-500/10 p-2 rounded-md">
                    <strong>Raison de l'échec:</strong> {search.error}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3 sm:mt-0 self-start sm:self-center">
              {getStatusBadge(search.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}