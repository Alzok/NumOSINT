import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { Case } from '@/types';

export function useCases() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const { addToastNotification } = useAppStore();

  const {
    data: cases,
    isLoading,
    error,
    refetch: refetchCases,
  } = useQuery<Case[], Error>({
    queryKey: ['cases', token],
    queryFn: async () => {
      if (!token) return [];
      const response = await api.getCases(token);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    },
    enabled: !!token,
  });

  const createCaseMutation = useMutation({
    mutationFn: (data: { name: string, description?: string }) => api.createCase(data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      addToastNotification({ type: 'success', title: 'Dossier créé', message: 'Le nouveau dossier a été créé avec succès.' });
    },
    onError: (error) => {
      addToastNotification({ type: 'error', title: 'Erreur de création', message: error.message });
    },
  });

  const updateCaseInvestigationsMutation = useMutation({
    mutationFn: ({ caseId, investigationIdsToConnect, investigationIdsToDisconnect }: { caseId: string, investigationIdsToConnect?: string[], investigationIdsToDisconnect?: string[] }) =>
      api.assignToCase(caseId, investigationIdsToConnect?.[0] ?? '', token), // Simplified for one investigation
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['investigations'] }); // Also invalidate investigations
      addToastNotification({ type: 'success', title: 'Assignation réussie', message: 'L\'investigation a été assignée.' });
    },
    onError: (error) => {
      addToastNotification({ type: 'error', title: 'Erreur d\'assignation', message: error.message });
    },
  });

  return {
    cases: cases || [],
    isLoading,
    error,
    refetchCases,
    createCase: createCaseMutation.mutateAsync,
    updateCaseInvestigations: updateCaseInvestigationsMutation.mutateAsync,
  };
}