import { Dna, Server, Database, Ghost, Mail, Fingerprint, Phone, Bug, Network, LayoutDashboard } from 'lucide-react';

export const serviceIcons: { [key: string]: React.ElementType } = {
  // Infrastructure
  Backend: Server,
  Frontend: LayoutDashboard,
  Nginx: Network,
  Database: Database,
  Redis: Database, // Using Database icon as a fallback for Redis
  // Tools
  Buster: Ghost,
  Mosint: Mail,
  Maigret: Fingerprint,
  PhoneInfoga: Phone,
  SpiderFoot: Bug,
  // Default
  Default: Dna,
};

export const getServiceIcon = (serviceName: string) => {
  const normalizedName = Object.keys(serviceIcons).find(key => 
    serviceName.toLowerCase().includes(key.toLowerCase())
  );
  return normalizedName ? serviceIcons[normalizedName] : serviceIcons.Default;
};