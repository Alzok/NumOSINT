import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { Case } from '@/types';

export function useCase(caseId: string | undefined) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const { addToastNotification } = useAppStore();

  const {
    data: caseDetails,
    isLoading,
    error,
    refetch,
  } = useQuery<Case | null, Error>({
    queryKey: ['case', caseId, token],
    queryFn: async () => {
      if (!caseId || !token) return null;
      const response = await api.getCase(caseId, token);
      if (response.error) {
        addToastNotification({
          type: 'error',
          title: 'Erreur de chargement',
          message: response.error,
        });
        throw new Error(response.error);
      }
      return response.data || null;
    },
    enabled: !!caseId && !!token,
  });

  return {
    caseDetails,
    isLoading,
    error,
    reloadCase: refetch,
  };
}