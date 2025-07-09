import { useState, useCallback, useEffect, useRef } from 'react';
import { investigationAPI, InvestigationInput, Investigation, Indicator, Result, InvestigationLog } from '@/lib/investigation-api';
import { useAppStore } from '@/lib/store';
import { io, Socket } from 'socket.io-client';

interface ProgressUpdate {
  investigationId: string;
  progress: number;
  status: string;
  currentStep: string;
  message?: string;
}

export function useInvestigation(investigationId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentInvestigation, setCurrentInvestigation] = useState<Investigation | null>(null);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [logs, setLogs] = useState<InvestigationLog[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);

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
          addNotification({ type: 'error', title: 'Erreur de chargement', message: response.error });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des investigations:', error);
      addNotification({ type: 'error', title: 'Erreur de chargement', message: 'Impossible de récupérer les investigations.' });
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
        addNotification({ type: 'success', title: 'Investigation créée', message: `Investigation ${response.data.id} créée avec succès`, duration: 5000 });
        
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
  const startInvestigation = useCallback(async (id: string) => {
    setIsLoading(true);
    setLoading(true);
    setSearchProgress(10);
    
    addSearchLog(`[${new Date().toLocaleTimeString()}] Démarrage de l'investigation ${id}...`);

    try {
      const response = await investigationAPI.startInvestigation(id);
      
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
  }, [addNotification, setLoading, setSearchProgress]);

  // Arrêter une investigation
  const stopInvestigation = useCallback(async (id: string) => {
    try {
      const response = await investigationAPI.stopInvestigation(id);
      
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
  }, [addNotification]);

  // Supprimer une investigation
  const deleteInvestigation = useCallback(async (id: string) => {
    try {
      const response = await investigationAPI.deleteInvestigation(id);
      
      if (response.error) {
        addNotification({ type: 'error', title: 'Erreur', message: response.error });
        return false;
      }

      if (response.data) {
        addSearchLog(`[${new Date().toLocaleTimeString()}] Investigation ${id} supprimée.`);
        addNotification({ type: 'success', title: 'Investigation supprimée', message: `Investigation ${id} supprimée avec succès`, duration: 5000 });
        
        setInvestigations((prev) => prev.filter((inv) => inv.id !== id));
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
  }, [addNotification, currentInvestigation]);

  // Charger une investigation spécifique
  const loadInvestigation = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await investigationAPI.getInvestigation(id);
      if (response.data) {
        setCurrentInvestigation(response.data);
        
        await Promise.all([
          loadIndicators(id),
          loadResults(id),
          loadLogs(id)
        ]);
        
        setSearchProgress(response.data.progress);
        
        return response.data;
      } else {
        setCurrentInvestigation(null);
        if (response.error) {
          addNotification({ type: 'error', title: 'Erreur de chargement', message: response.error });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'investigation:', error);
      addNotification({ type: 'error', title: 'Erreur de chargement', message: 'Impossible de récupérer l\'investigation.' });
      setCurrentInvestigation(null);
    } finally {
      setLoading(false);
    }

    return null;
  }, [setLoading, addNotification, setSearchProgress]);

  // Rafraîchir une investigation (utilisé par les actions manuelles)
  const refreshInvestigation = useCallback(async (id: string) => {
    try {
      const response = await investigationAPI.getInvestigation(id);
      if (response.data) {
        setCurrentInvestigation(response.data);
        setSearchProgress(response.data.progress);
        setInvestigations((prev) => prev.map((inv) => inv.id === id ? response.data! : inv));
        return response.data;
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de l\'investigation:', error);
    }
    return null;
  }, [setSearchProgress]);

  const loadIndicators = useCallback(async (id: string) => {
    try {
      const response = await investigationAPI.getIndicators(id);
      if (response.data) setIndicators(response.data);
      else setIndicators([]);
    } catch (error) {
      console.error('Erreur lors de la récupération des indicateurs:', error);
      setIndicators([]);
    }
  }, []);

  const loadResults = useCallback(async (id: string) => {
    try {
      const response = await investigationAPI.getResults(id);
      if (response.data) setResults(response.data);
      else setResults([]);
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats:', error);
      setResults([]);
    }
  }, []);

  const loadLogs = useCallback(async (id: string) => {
    try {
      const response = await investigationAPI.getLogs(id);
      if (response.data) {
        setLogs(response.data);
        response.data.forEach(log => addSearchLog(`[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`));
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      setLogs([]);
    }
  }, [addSearchLog]);

  // Gestion de la connexion Socket.IO
  useEffect(() => {
    if (!investigationId) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001');
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsSocketConnected(true);
      socket.emit('join_investigation', investigationId);
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    socket.on('investigation:progress', (data: ProgressUpdate) => {
      if (data.investigationId === investigationId) {
        setCurrentInvestigation(prev => prev ? { ...prev, status: data.status as Investigation['status'], progress: data.progress, currentStep: data.currentStep } : null);
        setSearchProgress(data.progress);
      }
    });

    socket.on('investigation:log', (log: InvestigationLog) => {
      if (log.investigationId === investigationId) {
        setLogs(prev => [...prev, log]);
      }
    });
    
    socket.on('investigation:new_indicator', (indicator: Indicator) => {
        if (indicator.investigationId === investigationId) {
            setIndicators(prev => [...prev, indicator]);
        }
    });

    socket.on('investigation:new_result', (result: Result) => {
        if (result.investigationId === investigationId) {
            setResults(prev => [...prev, result]);
        }
    });

    socket.on('investigation:completed', (data: { investigationId: string }) => {
      if (data.investigationId === investigationId) {
        refreshInvestigation(investigationId);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [investigationId, refreshInvestigation, setSearchProgress]);

  // Charger les données initiales
  useEffect(() => {
    loadInvestigations();
  }, [loadInvestigations]);

  return {
    currentInvestigation,
    investigations,
    indicators,
    results,
    logs,
    isLoading,
    isSocketConnected,
    createInvestigation,
    startInvestigation,
    stopInvestigation,
    deleteInvestigation,
    loadInvestigation,
    loadInvestigations,
  };
}