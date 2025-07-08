import { useState, useCallback, useEffect } from 'react';
import { investigationAPI, InvestigationInput, Investigation, Indicator, Result, InvestigationLog } from '@/lib/investigation-api';
import { useAppStore } from '@/lib/store';

export function useInvestigation() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentInvestigation, setCurrentInvestigation] = useState<Investigation | null>(null);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [logs, setLogs] = useState<InvestigationLog[]>([]);
  
  const {
    addNotification,
    setLoading,
    addSearchLog,
    clearSearchLogs,
    setSearchProgress
  } = useAppStore();

  // Charger toutes les investigations
  const loadInvestigations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await investigationAPI.listInvestigations();
      if (response.data) {
        setInvestigations(response.data);
      } else {
        setInvestigations([]);
        if (response.error) {
          addNotification({ 
            type: 'error', 
            title: 'Erreur de chargement', 
            message: response.error 
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des investigations:', error);
      addNotification({ 
        type: 'error', 
        title: 'Erreur de chargement', 
        message: 'Impossible de récupérer les investigations.' 
      });
      setInvestigations([]);
    } finally {
      setLoading(false);
    }
  }, [setLoading, addNotification]);

  // Créer une nouvelle investigation
  const createInvestigation = useCallback(async (input: InvestigationInput) => {
    setIsLoading(true);
    setLoading(true);
    clearSearchLogs();
    setSearchProgress(5);
    
    addSearchLog(`[${new Date().toLocaleTimeString()}] Création de l'investigation...`);

    try {
      const response = await investigationAPI.createInvestigation(input);
      
      if (response.error) {
        addNotification({ type: 'error', title: 'Erreur', message: response.error });
        setSearchProgress(0);
        return null;
      }

      if (response.data) {
        setCurrentInvestigation(response.data);
        addSearchLog(`[${new Date().toLocaleTimeString()}] Investigation ${response.data.id} créée.`);
        addNotification({ 
          type: 'success', 
          title: 'Investigation créée', 
          message: `Investigation ${response.data.id} créée avec succès`, 
          duration: 5000 
        });
        
        // Recharger la liste des investigations
        await loadInvestigations();
        
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
  }, [addNotification, setLoading, clearSearchLogs, setSearchProgress, loadInvestigations]);

  // Démarrer une investigation
  const startInvestigation = useCallback(async (investigationId: string) => {
    setIsLoading(true);
    setLoading(true);
    setSearchProgress(10);
    
    addSearchLog(`[${new Date().toLocaleTimeString()}] Démarrage de l'investigation ${investigationId}...`);

    try {
      const response = await investigationAPI.startInvestigation(investigationId);
      
      if (response.error) {
        addNotification({ type: 'error', title: 'Erreur', message: response.error });
        setSearchProgress(0);
        return false;
      }

      if (response.data) {
        addSearchLog(`[${new Date().toLocaleTimeString()}] Investigation ${investigationId} démarrée.`);
        addNotification({ 
          type: 'success', 
          title: 'Investigation démarrée', 
          message: `Investigation ${investigationId} démarrée avec succès`, 
          duration: 5000 
        });
        
        // Mettre à jour le statut de l'investigation
        await refreshInvestigation(investigationId);
        
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
  }, [addNotification, setLoading, setSearchProgress]);

  // Arrêter une investigation
  const stopInvestigation = useCallback(async (investigationId: string) => {
    try {
      const response = await investigationAPI.stopInvestigation(investigationId);
      
      if (response.error) {
        addNotification({ type: 'error', title: 'Erreur', message: response.error });
        return false;
      }

      if (response.data) {
        addSearchLog(`[${new Date().toLocaleTimeString()}] Investigation ${investigationId} arrêtée.`);
        addNotification({ 
          type: 'success', 
          title: 'Investigation arrêtée', 
          message: `Investigation ${investigationId} arrêtée avec succès`, 
          duration: 5000 
        });
        
        // Mettre à jour le statut de l'investigation
        await refreshInvestigation(investigationId);
        
        return true;
      }
    } catch (error) {
      addSearchLog(`[${new Date().toLocaleTimeString()}] Erreur lors de l'arrêt de l'investigation.`);
      addNotification({ type: 'error', title: 'Erreur', message: 'Impossible d\'arrêter l\'investigation' });
    }

    return false;
  }, [addNotification]);

  // Supprimer une investigation
  const deleteInvestigation = useCallback(async (investigationId: string) => {
    try {
      const response = await investigationAPI.deleteInvestigation(investigationId);
      
      if (response.error) {
        addNotification({ type: 'error', title: 'Erreur', message: response.error });
        return false;
      }

      if (response.data) {
        addSearchLog(`[${new Date().toLocaleTimeString()}] Investigation ${investigationId} supprimée.`);
        addNotification({ 
          type: 'success', 
          title: 'Investigation supprimée', 
          message: `Investigation ${investigationId} supprimée avec succès`, 
          duration: 5000 
        });
        
        // Retirer de la liste et recharger
        setInvestigations((prev: Investigation[]) => prev.filter((inv: Investigation) => inv.id !== investigationId));
        if (currentInvestigation?.id === investigationId) {
          setCurrentInvestigation(null);
        }
        
        return true;
      }
    } catch (error) {
      addSearchLog(`[${new Date().toLocaleTimeString()}] Erreur lors de la suppression de l'investigation.`);
      addNotification({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer l\'investigation' });
    }

    return false;
  }, [addNotification, currentInvestigation]);

  // Charger une investigation spécifique
  const loadInvestigation = useCallback(async (investigationId: string) => {
    setLoading(true);
    try {
      const response = await investigationAPI.getInvestigation(investigationId);
      if (response.data) {
        setCurrentInvestigation(response.data);
        
        // Charger les indicateurs, résultats et logs
        await Promise.all([
          loadIndicators(investigationId),
          loadResults(investigationId),
          loadLogs(investigationId)
        ]);
        
        // Mettre à jour la progression
        setSearchProgress(response.data.progress);
        
        return response.data;
      } else {
        setCurrentInvestigation(null);
        if (response.error) {
          addNotification({ 
            type: 'error', 
            title: 'Erreur de chargement', 
            message: response.error 
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'investigation:', error);
      addNotification({ 
        type: 'error', 
        title: 'Erreur de chargement', 
        message: 'Impossible de récupérer l\'investigation.' 
      });
      setCurrentInvestigation(null);
    } finally {
      setLoading(false);
    }

    return null;
  }, [setLoading, addNotification, setSearchProgress]);

  // Rafraîchir une investigation
  const refreshInvestigation = useCallback(async (investigationId: string) => {
    try {
      const response = await investigationAPI.getInvestigation(investigationId);
      if (response.data) {
        setCurrentInvestigation(response.data);
        setSearchProgress(response.data.progress);
        
        // Mettre à jour la liste des investigations
        setInvestigations((prev: Investigation[]) => 
          prev.map((inv: Investigation) => inv.id === investigationId ? response.data! : inv)
        );
        
        return response.data;
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de l\'investigation:', error);
    }

    return null;
  }, [setSearchProgress]);

  // Charger les indicateurs d'une investigation
  const loadIndicators = useCallback(async (investigationId: string) => {
    try {
      const response = await investigationAPI.getIndicators(investigationId);
      if (response.data) {
        setIndicators(response.data);
      } else {
        setIndicators([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des indicateurs:', error);
      setIndicators([]);
    }
  }, []);

  // Charger les résultats d'une investigation
  const loadResults = useCallback(async (investigationId: string) => {
    try {
      const response = await investigationAPI.getResults(investigationId);
      if (response.data) {
        setResults(response.data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats:', error);
      setResults([]);
    }
  }, []);

  // Charger les logs d'une investigation
  const loadLogs = useCallback(async (investigationId: string) => {
    try {
      const response = await investigationAPI.getLogs(investigationId);
      if (response.data) {
        setLogs(response.data);
        
        // Ajouter les nouveaux logs à l'interface
        response.data.forEach(log => {
          addSearchLog(`[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`);
        });
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      setLogs([]);
    }
  }, [addSearchLog]);

  // Charger les résultats par outil
  const loadResultsByTool = useCallback(async (investigationId: string, toolSource: string) => {
    try {
      const response = await investigationAPI.getResultsByTool(investigationId, toolSource);
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats par outil:', error);
    }

    return [];
  }, []);

  // Polling pour mettre à jour l'investigation en cours
  useEffect(() => {
    if (!currentInvestigation || currentInvestigation.status === 'COMPLETED' || currentInvestigation.status === 'FAILED') {
      return;
    }

    const interval = setInterval(async () => {
      await refreshInvestigation(currentInvestigation.id);
    }, 2000); // Mise à jour toutes les 2 secondes

    return () => clearInterval(interval);
  }, [currentInvestigation, refreshInvestigation]);

  // Charger les données initiales
  useEffect(() => {
    loadInvestigations();
  }, [loadInvestigations]);

  return {
    // État
    currentInvestigation,
    investigations,
    indicators,
    results,
    logs,
    isLoading,
    
    // Actions
    createInvestigation,
    startInvestigation,
    stopInvestigation,
    deleteInvestigation,
    loadInvestigation,
    refreshInvestigation,
    loadInvestigations,
    loadIndicators,
    loadResults,
    loadLogs,
    loadResultsByTool,
  };
}