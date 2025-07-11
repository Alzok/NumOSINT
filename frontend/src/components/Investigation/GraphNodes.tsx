import React from 'react';
import { Handle, Position } from 'reactflow';
import { Email, Language, Public } from '@mui/icons-material';

const nodeStyle = {
  padding: '10px',
  borderRadius: '5px',
  border: '1px solid #ddd',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  background: 'white',
};

const IpNode = ({ data }: { data: { label: string } }) => (
  <div style={{ ...nodeStyle, background: '#e0f7fa' }}>
    <Handle type="target" position={Position.Top} />
    <Public />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const DomainNode = ({ data }: { data: { label: string } }) => (
  <div style={{ ...nodeStyle, background: '#e8f5e9' }}>
    <Handle type="target" position={Position.Top} />
    <Language />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const EmailNode = ({ data }: { data: { label: string } }) => (
  <div style={{ ...nodeStyle, background: '#fffde7' }}>
    <Handle type="target" position={Position.Top} />
    <Email />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

export const nodeTypes = {
  IP_ADDRESS: IpNode,
  DOMAIN_NAME: DomainNode,
  EMAILADDR: EmailNode,
};