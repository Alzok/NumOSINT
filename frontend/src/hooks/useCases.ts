import { useState, useCallback } from 'react';
import { investigationAPI, Case } from '@/lib/investigation-api';
import { useAppStore } from '@/lib/store';

export function useCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useAppStore();

  const loadCases = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await investigationAPI.getCases();
      if (response.data) {
        setCases(response.data);
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur de chargement',
          message: response.error || 'Impossible de charger les dossiers.',
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur réseau',
        message: 'Impossible de se connecter au serveur pour charger les dossiers.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const createCase = useCallback(async (name: string, description: string, investigationIds: string[]) => {
    setIsLoading(true);
    try {
      const response = await investigationAPI.createCase({ name, description, investigationIds });
      if (response.data) {
        addNotification({
          type: 'success',
          title: 'Dossier créé',
          message: `Le dossier "${name}" a été créé avec succès.`,
        });
        await loadCases(); // Recharger la liste
        return true;
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur de création',
          message: response.error || 'Impossible de créer le dossier.',
        });
        return false;
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur réseau',
        message: 'Impossible de se connecter au serveur pour créer le dossier.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, loadCases]);

  const updateCaseInvestigations = useCallback(async (caseId: string, investigationIdsToConnect: string[], investigationIdsToDisconnect: string[]) => {
    setIsLoading(true);
    try {
      const response = await investigationAPI.updateCaseInvestigations(caseId, { investigationIdsToConnect, investigationIdsToDisconnect });
      if (response.data) {
        addNotification({
          type: 'success',
          title: 'Dossier mis à jour',
          message: 'Les investigations du dossier ont été mises à jour.',
        });
        await loadCases(); // Recharger la liste
        return true;
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur de mise à jour',
          message: response.error || 'Impossible de mettre à jour le dossier.',
        });
        return false;
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur réseau',
        message: 'Impossible de se connecter au serveur pour mettre à jour le dossier.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, loadCases]);


  return {
    cases,
    isLoading,
    loadCases,
    createCase,
    updateCaseInvestigations,
  };
}