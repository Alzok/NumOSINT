import { useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { useSocket } from '@/components/providers/SocketProvider';
import { Investigation, Indicator, Result, InvestigationLog } from '@/types';

// Type pour l'événement de mise à jour unifié
interface InvestigationUpdatePayload {
  id: string;
  status?: Investigation['status'];
  progress?: number;
  currentPhase?: Investigation['currentPhase'];
  currentStep?: string;
  error?: string;
}

export function useInvestigationDetail(investigationId?: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { addToastNotification: addNotification, setSearchProgress } = useAppStore();

  const investigationQueryKey = useMemo(() => ['investigation', investigationId, token], [investigationId, token]);
  const resultsQueryKey = useMemo(() => ['investigation', investigationId, 'results', token], [investigationId, token]);
  const logsQueryKey = useMemo(() => ['investigation', investigationId, 'logs', token], [investigationId, token]);

  const { data: currentInvestigation, isLoading: isLoadingInvestigation } = useQuery({
    queryKey: investigationQueryKey,
    queryFn: async () => {
      const response = await api.getInvestigation(investigationId!, token);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    enabled: !!investigationId && !!token,
    staleTime: Infinity,
  });

  const indicators = useMemo(() => currentInvestigation?.indicators || [], [currentInvestigation]);
  const isLoadingIndicators = isLoadingInvestigation;

  const { data: results, isLoading: isLoadingResults } = useQuery({
    queryKey: resultsQueryKey,
    queryFn: async () => (await api.getResults(investigationId!, token)).data || [],
    enabled: !!investigationId && !!token,
    staleTime: Infinity,
  });

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: logsQueryKey,
    queryFn: async () => (await api.getLogs(investigationId!, token)).data?.logs || [],
    enabled: !!investigationId && !!token,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!investigationId || !socket) return;

    socket.emit('join_investigation', investigationId);

    const handleUpdate = (data: InvestigationUpdatePayload) => {
      if (data.id === investigationId) {
        queryClient.setQueryData<Investigation>(investigationQueryKey, (prev) => {
          if (!prev) return prev;
          const updated = { ...prev };
          if (data.status) updated.status = data.status;
          if (data.progress) {
            updated.progress = data.progress;
            setSearchProgress(data.progress);
          }
          if (data.currentPhase) updated.currentPhase = data.currentPhase;
          if (data.currentStep) updated.currentStep = data.currentStep;
          return updated;
        });
      }
    };

    const handleLog = (log: InvestigationLog) => {
      if (log.investigationId === investigationId) {
        queryClient.setQueryData<InvestigationLog[]>(logsQueryKey, (prev) => [...(prev || []), log]);
      }
    };

    const handleNewIndicator = (indicator: Indicator) => {
      if (indicator.investigationId === investigationId) {
        queryClient.setQueryData<Investigation>(investigationQueryKey, (prev) => {
          if (!prev) return prev;
          return { ...prev, indicators: [...(prev.indicators || []), indicator] };
        });
      }
    };

    const handleNewResult = (result: Result) => {
      if (result.investigationId === investigationId) {
        queryClient.setQueryData<Result[]>(resultsQueryKey, (prev) => [...(prev || []), result]);
      }
    };

    const handleCompleted = (data: { investigationId: string }) => {
      if (data.investigationId === investigationId) {
        queryClient.invalidateQueries({ queryKey: ['investigation', investigationId] });
        addNotification({
          type: 'success',
          title: 'Analyse terminée',
          message: `L'investigation ${data.investigationId} est terminée.`,
          duration: 10000,
          actions: [
            { label: 'Voir les résultats', href: `/investigation/${data.investigationId}` },
            { label: 'Fermer', onClick: () => {} },
          ],
        });
      }
    };

    socket.on('investigation:update', handleUpdate);
    socket.on('investigation:log', handleLog);
    socket.on('investigation:new_indicator', handleNewIndicator);
    socket.on('investigation:new_result', handleNewResult);
    socket.on('investigation:completed', handleCompleted);

    return () => {
      socket.off('investigation:update', handleUpdate);
      socket.off('investigation:log', handleLog);
      socket.off('investigation:new_indicator', handleNewIndicator);
      socket.off('investigation:new_result', handleNewResult);
      socket.off('investigation:completed', handleCompleted);
    };
  }, [investigationId, socket, queryClient, addNotification, setSearchProgress, investigationQueryKey, resultsQueryKey, logsQueryKey]);

  const loadInvestigation = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: investigationQueryKey });
  }, [queryClient, investigationQueryKey]);

  return {
    currentInvestigation,
    indicators,
    results,
    logs,
    isLoading: isLoadingInvestigation || isLoadingResults || isLoadingLogs,
    isSocketConnected: socket?.connected || false,
    loadInvestigation,
  };
}