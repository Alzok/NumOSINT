import { useState, useEffect, useCallback } from 'react';
import { investigationAPI, ApiResponse } from '@/lib/investigation-api';
import { Edge, Node } from 'reactflow';

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export const useInvestigationGraph = (investigationId: string | null) => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraphData = useCallback(async () => {
    if (!investigationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: ApiResponse<{ nodes: Node[], edges: Edge[] }> = await investigationAPI.getInvestigationGraph(investigationId);
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
    } catch (err) {
      setError('An unexpected error occurred while fetching graph data.');
    } finally {
      setIsLoading(false);
    }
  }, [investigationId]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  return { graphData, isLoading, error, refetch: fetchGraphData };
};