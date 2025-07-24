import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api-client';
import { useSocket } from '@/components/providers/SocketProvider';
import { Investigation } from '@/types';
import { useAppStore } from '@/lib/store';

// Type pour l'événement de mise à jour
interface InvestigationUpdatePayload {
  id: string;
  status?: Investigation['status'];
  progress?: number;
  currentPhase?: Investigation['currentPhase'];
  currentStep?: string;
  error?: string;
}

const fetchInvestigations = async (token: string | null | undefined): Promise<Investigation[]> => {
  if (!token) return [];
  const response = await api.getInvestigations({}, token);
  if (response.error) {
    throw new Error(response.error);
  }
  // La réponse de l'API est { data: { data: Investigation[], pagination: {...} }, error: null }
  // Nous ne voulons que le tableau d'investigations.
  return response.data?.data || [];
};

export function useInvestigationsList() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const { addToastNotification: addNotification } = useAppStore();

  const {
    data: investigations,
    isLoading,
    error,
    refetch
  } = useQuery<Investigation[], Error>({
    queryKey: ['investigations', token],
    queryFn: () => fetchInvestigations(token),
    enabled: !!token, // La query ne s'exécute que si le token existe
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (error) {
      addNotification({ type: 'error', title: 'Erreur de chargement', message: error.message });
    }
  }, [error, addNotification]);

  // Gestion des mises à jour globales par WebSocket pour la liste des investigations
  useEffect(() => {
    if (!socket) return;

    const handleInvestigationUpdate = (data: InvestigationUpdatePayload) => {
      queryClient.setQueryData<Investigation[]>(['investigations'], (oldData) => {
        if (!oldData) return [];
        return oldData.map(inv => {
          if (inv.id === data.id) {
            const updatedInv: Investigation = { ...inv };
            if (data.status) updatedInv.status = data.status;
            if (data.progress !== undefined) updatedInv.progress = data.progress;
            if (data.currentPhase) updatedInv.currentPhase = data.currentPhase;
            if (data.currentStep) updatedInv.currentStep = data.currentStep;
            if (data.error) updatedInv.error = data.error;
            return updatedInv;
          }
          return inv;
        });
      });
    };

    socket.on('investigation:update', handleInvestigationUpdate);

    return () => {
      socket.off('investigation:update', handleInvestigationUpdate);
    };
  }, [socket, queryClient]);

  return {
    investigations: investigations ?? [],
    isLoading,
    error,
    refreshInvestigations: refetch,
  };
}