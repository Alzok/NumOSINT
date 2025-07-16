'use client';

import { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { api } from '@/lib/api-client';
import { useSession } from 'next-auth/react';

interface InvestigationGraphProps {
  investigationId: string;
}

export default function InvestigationGraph({ investigationId }: InvestigationGraphProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  useEffect(() => {
    if (investigationId && session?.accessToken) {
      setIsLoading(true);
      api.getInvestigationGraph(investigationId, session.accessToken)
        .then(response => {
          if (response.data) {
            setNodes(response.data.nodes);
            setEdges(response.data.edges);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [investigationId, session]);

  if (isLoading) {
    return <div>Chargement du graphe...</div>;
  }

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}