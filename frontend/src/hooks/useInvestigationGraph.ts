import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api-client';
import { Edge, Node } from 'reactflow';

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export const useInvestigationGraph = (investigationId: string | null) => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraphData = useCallback(async () => {
    if (!investigationId || !token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getInvestigationGraph(investigationId, token);
      if (response.data) {
        // Add position to nodes if not present
        const nodesWithPositions = response.data.nodes.map((node, index) => ({
          ...node,
          position: node.position || { x: Math.random() * 400, y: Math.random() * 400 },
        }));
        setGraphData({ nodes: nodesWithPositions, edges: response.data.edges });
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err: any) {
      setError('An unexpected error occurred while fetching graph data.');
    } finally {
      setIsLoading(false);
    }
  }, [investigationId, token]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  return { graphData, isLoading, error, refetch: fetchGraphData };
};