import React from 'react';
import { Handle, Position } from 'reactflow';
import { Email, Language, Public, Person, Phone, Link as LinkIcon, HelpOutline } from '@mui/icons-material';
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
  fontSize: '12px',
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

const BaseNode = ({ data, icon, color, typeLabel }: { data: { label: string }, icon: React.ReactNode, color: string, typeLabel: string }) => (
    <NodeWrapper tooltipText={`${typeLabel}: ${data.label}`}>
        <div style={{ ...nodeStyle, background: color }}>
            <Handle type="target" position={Position.Top} />
            {icon}
            <div style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.label}</div>
            <Handle type="source" position={Position.Bottom} />
        </div>
    </NodeWrapper>
);

const IpNode = (props: any) => <BaseNode {...props} icon={<Public />} color="#e0f7fa" typeLabel="Adresse IP" />;
const DomainNode = (props: any) => <BaseNode {...props} icon={<Language />} color="#e8f5e9" typeLabel="Domaine" />;
const EmailNode = (props: any) => <BaseNode {...props} icon={<Email />} color="#fffde7" typeLabel="Email" />;
const UsernameNode = (props: any) => <BaseNode {...props} icon={<Person />} color="#f3e5f5" typeLabel="Username" />;
const PhoneNode = (props: any) => <BaseNode {...props} icon={<Phone />} color="#e3f2fd" typeLabel="Téléphone" />;
const NameNode = (props: any) => <BaseNode {...props} icon={<Person />} color="#fbe9e7" typeLabel="Nom" />;
const UrlNode = (props: any) => <BaseNode {...props} icon={<LinkIcon />} color="#eeeeee" typeLabel="URL" />;
const DefaultNode = (props: any) => <BaseNode {...props} icon={<HelpOutline />} color="#fafafa" typeLabel="Indicateur" />;

export const nodeTypes = {
  IP: IpNode,
  DOMAIN: DomainNode,
  EMAIL: EmailNode,
  USERNAME: UsernameNode,
  PHONE: PhoneNode,
  NAME: NameNode,
  URL: UrlNode,
  DEFAULT: DefaultNode,
};