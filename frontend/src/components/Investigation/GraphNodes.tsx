import React from 'react';
import { Handle, Position } from 'reactflow';
import { Email, Language, Public } from '@mui/icons-material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const nodeStyle = {
  padding: '10px',
  borderRadius: '5px',
  border: '1px solid #ddd',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  background: 'white',
  cursor: 'pointer',
};

const NodeWrapper: React.FC<{ children: React.ReactNode, tooltipText: string }> = ({ children, tooltipText }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);


const IpNode = ({ data }: { data: { label: string } }) => (
  <NodeWrapper tooltipText={`Adresse IP: ${data.label}`}>
    <div style={{ ...nodeStyle, background: '#e0f7fa' }}>
      <Handle type="target" position={Position.Top} />
      <Public />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  </NodeWrapper>
);

const DomainNode = ({ data }: { data: { label: string } }) => (
  <NodeWrapper tooltipText={`Nom de domaine: ${data.label}`}>
    <div style={{ ...nodeStyle, background: '#e8f5e9' }}>
      <Handle type="target" position={Position.Top} />
      <Language />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  </NodeWrapper>
);

const EmailNode = ({ data }: { data: { label: string } }) => (
  <NodeWrapper tooltipText={`Adresse e-mail: ${data.label}`}>
    <div style={{ ...nodeStyle, background: '#fffde7' }}>
      <Handle type="target" position={Position.Top} />
      <Email />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  </NodeWrapper>
);

export const nodeTypes = {
  IP_ADDRESS: IpNode,
  DOMAIN_NAME: DomainNode,
  EMAILADDR: EmailNode,
};