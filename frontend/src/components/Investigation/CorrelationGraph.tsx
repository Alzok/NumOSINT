import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { investigationAPI } from '@/lib/investigation-api';
import { toast } from "sonner";
import { nodeTypes } from './GraphNodes';

interface CorrelationGraphProps {
  investigationId: string;
}

const CorrelationGraph: React.FC<CorrelationGraphProps> = ({ investigationId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  useEffect(() => {
    const fetchGraphData = async () => {
      setIsLoading(true);
      try {
        const response = await investigationAPI.getInvestigationGraph(investigationId);
        if (response.data) {
          setNodes(response.data.nodes || []);
          setEdges(response.data.edges || []);
        } else {
          toast.error(response.error || "Impossible de charger les données du graphe.");
        }
      } catch (error) {
        toast.error("Une erreur est survenue lors du chargement du graphe.");
      } finally {
        setIsLoading(false);
      }
    };

    if (investigationId) {
      fetchGraphData();
    }
  }, [investigationId, setNodes, setEdges]);

  if (isLoading) {
    return <div>Chargement du graphe...</div>;
  }

  return (
    <div style={{ height: '70vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default CorrelationGraph;