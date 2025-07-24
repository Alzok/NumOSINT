import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { InvestigationInput, Investigation } from '@/types';

export function useInvestigationActions() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [isLoading, setIsLoading] = useState(false);
  const [currentInvestigation, setCurrentInvestigation] = useState<Investigation | null>(null);

  const {
    addToastNotification: addNotification,
    setLoading,
    addSearchLog,
    clearSearchLogs,
    setSearchProgress
  } = useAppStore();

  const refreshInvestigation = useCallback(async (id: string) => {
    try {
      const response = await api.getInvestigation(id, token);
      if (response.data) {
        setCurrentInvestigation(response.data);
        setSearchProgress(response.data.progress);
        return response.data;
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de l\'investigation:', error);
    }
    return null;
  }, [setSearchProgress, token]);

  const createInvestigation = useCallback(async (input: InvestigationInput) => {
    setIsLoading(true);
    setLoading(true);
    clearSearchLogs();
    setSearchProgress(5);
    
    addSearchLog(`[${new Date().toLocaleTimeString()}] Création de l'investigation...`);

    try {
      const response = await api.createInvestigation(input, token);
      
      if (response.error) {
        addNotification({ type: 'error', title: 'Erreur', message: response.error });
        setSearchProgress(0);
        return null;
      }

      if (response.data) {
        setCurrentInvestigation(response.data);
        addSearchLog(`[${new Date().toLocaleTimeString()}] Investigation ${response.data.id} créée.`);
        addNotification({ type: 'success', title: 'Investigation créée', message: `Investigation ${response.data.id} créée avec succès`, duration: 5000 });
        
        return response.data;
      }
    } catch (error) {
      addSearchLog(`[${new Date().toLocaleTimeString()}] Erreur lors de la création de l'investigation.`);
      addNotification({ type: 'error', title: 'Erreur', message: 'Impossible de créer l\'investigation' });
      setSearchProgress(0);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }

    return null;
  }, [addNotification, setLoading, clearSearchLogs, setSearchProgress, addSearchLog]);

  const startInvestigation = useCallback(async (id: string) => {
    setIsLoading(true);
    setLoading(true);
    setSearchProgress(10);
    
    addSearchLog(`[${new Date().toLocaleTimeString()}] Démarrage de l'investigation ${id}...`);

    try {
      const response = await api.startInvestigation(id, token);
      
      if (response.error) {
        addNotification({ type: 'error', title: 'Erreur', message: response.error });
        setSearchProgress(0);
        return false;
      }

      if (response.data) {
        addSearchLog(`[${new Date().toLocaleTimeString()}] Investigation ${id} démarrée.`);
        addNotification({ type: 'success', title: 'Investigation démarrée', message: `Investigation ${id} démarrée avec succès`, duration: 5000 });
        
        await refreshInvestigation(id);
        
        return true;
      }
    } catch (error) {
      addSearchLog(`[${new Date().toLocaleTimeString()}] Erreur lors du démarrage de l'investigation.`);
      addNotification({ type: 'error', title: 'Erreur', message: 'Impossible de démarrer l\'investigation' });
      setSearchProgress(0);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }

    return false;
  }, [addNotification, setLoading, setSearchProgress, addSearchLog, refreshInvestigation]);

  const stopInvestigation = useCallback(async (id: string) => {
    try {
      const response = await api.stopInvestigation(id, token);
      
      if (response.error) {
        addNotification({ type: 'error', title: 'Erreur', message: response.error });
        return false;
      }

      if (response.data) {
        addSearchLog(`[${new Date().toLocaleTimeString()}] Investigation ${id} arrêtée.`);
        addNotification({ type: 'success', title: 'Investigation arrêtée', message: `Investigation ${id} arrêtée avec succès`, duration: 5000 });
        
        await refreshInvestigation(id);
        
        return true;
      }
    } catch (error) {
      addSearchLog(`[${new Date().toLocaleTimeString()}] Erreur lors de l'arrêt de l'investigation.`);
      addNotification({ type: 'error', title: 'Erreur', message: 'Impossible d\'arrêter l\'investigation' });
    }

    return false;
  }, [addNotification, addSearchLog, refreshInvestigation]);

  const deleteInvestigation = useCallback(async (id: string) => {
    try {
      const response = await api.deleteInvestigation(id, token);
      
      if (response.error) {
        addNotification({ type: 'error', title: 'Erreur', message: response.error });
        return false;
      }

      if (response.data) {
        addSearchLog(`[${new Date().toLocaleTimeString()}] Investigation ${id} supprimée.`);
        addNotification({ type: 'success', title: 'Investigation supprimée', message: `Investigation ${id} supprimée avec succès`, duration: 5000 });
        
        if (currentInvestigation?.id === id) {
          setCurrentInvestigation(null);
        }
        
        return true;
      }
    } catch (error) {
      addSearchLog(`[${new Date().toLocaleTimeString()}] Erreur lors de la suppression de l'investigation.`);
      addNotification({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer l\'investigation' });
    }

    return false;
  }, [addNotification, currentInvestigation, addSearchLog, token]);

  return {
    isLoading,
    isCreating: isLoading,
    isStarting: isLoading,
    createInvestigation,
    startInvestigation,
    stopInvestigation,
    deleteInvestigation,
  };
}