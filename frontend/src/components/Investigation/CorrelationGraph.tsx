import React, { useCallback, useEffect } from 'react';
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
import { toast } from "sonner";
import { nodeTypes } from './GraphNodes';
import { useInvestigationGraph } from '@/hooks/useInvestigationGraph';
import { Skeleton } from '@/components/ui/skeleton';

interface CorrelationGraphProps {
  investigationId: string;
}

const CorrelationGraph: React.FC<CorrelationGraphProps> = ({ investigationId }) => {
  const { graphData, isLoading, error } = useInvestigationGraph(investigationId);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (graphData) {
      setNodes(graphData.nodes);
      setEdges(graphData.edges);
    }
  }, [graphData, setNodes, setEdges]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  if (isLoading) {
    return <Skeleton className="h-[70vh] w-full" />;
  }

  if (error) {
    return <div className="text-red-500">Erreur: {error}</div>;
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
        panOnScroll
        zoomOnScroll
        zoomOnDoubleClick
        zoomOnPinch
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default CorrelationGraph;