import { useState, useEffect, useCallback } from 'react';
import { investigationAPI, Case } from '@/lib/investigation-api';
import { useAppStore } from '@/lib/store';

export function useCase(caseId: string | undefined) {
  const [caseDetails, setCaseDetails] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useAppStore();

  const loadCase = useCallback(async () => {
    if (!caseId) {
        setError("Aucun ID de dossier fourni.");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await investigationAPI.getCase(caseId);
      if (response.data) {
        setCaseDetails(response.data);
      } else {
        setCaseDetails(null);
        const errorMessage = response.error || `Impossible de charger le dossier ${caseId}.`;
        setError(errorMessage);
        addNotification({ type: 'error', title: 'Erreur de chargement', message: errorMessage });
      }
    } catch (err) {
        const errorMessage = 'Impossible de se connecter au serveur pour charger le dossier.';
        setError(errorMessage);
        addNotification({ type: 'error', title: 'Erreur réseau', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [caseId, addNotification]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  return {
    caseDetails,
    isLoading,
    error,
    reloadCase: loadCase,
  };
}