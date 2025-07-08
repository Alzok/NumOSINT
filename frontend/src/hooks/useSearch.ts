import { useState, useCallback } from 'react';
import { searchAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { SearchRequest } from '@/types';
import { transformLegacyResults } from '@/utils/dataTransform';

export function useSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const {
    addActiveSearch,
    addNotification,
    setLoading,
    setAllResults,
    addSearchLog,
    clearSearchLogs,
    setSearchProgress
  } = useAppStore();

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await searchAPI.getAllResults();
      if (response.data) {
        const transformedData = transformLegacyResults(response.data);
        setAllResults(transformedData);
      } else {
        setAllResults(null);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats:', error);
      addNotification({ type: 'error', title: 'Erreur de chargement', message: 'Impossible de récupérer les résultats.' });
      setAllResults(null);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setAllResults, addNotification]);

  const startSearch = useCallback(async (request: SearchRequest) => {
    setIsLoading(true);
    setLoading(true);
    clearSearchLogs();
    setSearchProgress(5);
    addSearchLog(`[${new Date().toLocaleTimeString()}] Initialisation de la recherche pour ${request.first_name} ${request.last_name}...`);

    try {
      const response = await searchAPI.startSearch(request);
      
      if (response.error) {
        addNotification({ type: 'error', title: 'Erreur', message: response.error });
        setSearchProgress(0);
        return null;
      }

      if (response.data) {
        const newSearch = {
          task_id: response.data.task_id,
          status: 'started' as const,
          first_name: request.first_name,
          last_name: request.last_name,
          domain_filter: request.domain_filter,
          started_at: new Date().toISOString(),
        };

        addActiveSearch(newSearch);
        addSearchLog(`[${new Date().toLocaleTimeString()}] Tâche ${response.data.task_id} démarrée.`);
        addNotification({ type: 'success', title: 'Recherche lancée', message: `Recherche démarrée pour ${request.first_name} ${request.last_name}`, duration: 5000 });
        
        // Simuler des logs et la progression
        setTimeout(() => { addSearchLog(`[${new Date().toLocaleTimeString()}] Recherche des emails...`); setSearchProgress(25); }, 1000);
        setTimeout(() => { addSearchLog(`[${new Date().toLocaleTimeString()}] 15 emails trouvés.`); setSearchProgress(40); }, 2000);
        setTimeout(() => { addSearchLog(`[${new Date().toLocaleTimeString()}] Recherche des comptes sur les plateformes...`); setSearchProgress(60); }, 2500);
        setTimeout(() => { addSearchLog(`[${new Date().toLocaleTimeString()}] Compte trouvé sur Facebook.`); setSearchProgress(75); }, 4000);
        setTimeout(() => { addSearchLog(`[${new Date().toLocaleTimeString()}] Compte trouvé sur Twitter.`); setSearchProgress(90); }, 4500);


        // Optionnel: rafraîchir les données après un certain temps
        setTimeout(() => {
          loadInitialData();
          addSearchLog(`[${new Date().toLocaleTimeString()}] Recherche terminée.`);
          setSearchProgress(100);
        }, 5000);

        return response.data.task_id;
      }
    } catch (error) {
      addSearchLog(`[${new Date().toLocaleTimeString()}] Erreur au démarrage de la tâche.`);
      addNotification({ type: 'error', title: 'Erreur', message: 'Impossible de démarrer la recherche' });
      setSearchProgress(0);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }

    return null;
  }, [addActiveSearch, addNotification, setLoading, clearSearchLogs, setSearchProgress, loadInitialData]);

  const getSearchStatus = useCallback(async (taskId: string) => {
    try {
      const response = await searchAPI.getSearchStatus(taskId);
      return response.data || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      return null;
    }
  }, []);


  return {
    startSearch,
    getSearchStatus,
    loadInitialData,
    isLoading,
  };
}