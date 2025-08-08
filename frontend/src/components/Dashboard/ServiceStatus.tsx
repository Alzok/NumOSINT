import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getServiceIcon } from '@/lib/services-config';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle2, ServerCrash, Ticket } from 'lucide-react';
import { HeartbeatIcon } from '@/components/ui/HeartbeatIcon';

interface Service {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: string;
  error?: string;
}

interface StatusData {
  infrastructure: Service[];
  tools: Service[];
}

const fetchServiceStatus = async (token?: string | null) => {
  if (!token) return null;
  const { data } = await api.getHealthStatus(token); // Assuming getHealthStatus exists in api-client
  return data;
};

const getStatusInfo = (status: Service['status']) => {
  switch (status) {
    case 'healthy':
      return { text: 'OK', color: 'text-green-500', Icon: CheckCircle2 };
    case 'degraded':
      return { text: 'ERREUR', color: 'text-yellow-500', Icon: AlertCircle };
    case 'unhealthy':
      return { text: 'KO', color: 'text-red-500', Icon: ServerCrash };
    default:
      return { text: 'INCONNU', color: 'text-gray-500', Icon: AlertCircle };
  }
};

const ServiceCard = ({ service }: { service: Service }) => {
  const { data: session } = useSession();
  const Icon = getServiceIcon(service.name);
  const { text: statusText, color: statusColor, Icon: StatusIcon } = getStatusInfo(service.status);

  const handleOpenTicket = () => {
    const subject = `Problème avec le service : ${service.name}`;
    
    const userInfo = `--- Informations Utilisateur ---
Email: ${session?.user?.email || 'Non disponible'}
Plan: ${session?.user?.plan?.name || 'Non disponible'}
Rôle: ${session?.user?.role || 'Non disponible'}
`;

    const serviceInfo = `--- Informations Service ---
Service: ${service.name}
État: ${statusText}
Erreur: ${service.error || 'Non disponible'}
`;

    const description = `Un utilisateur a signalé un problème.

${serviceInfo}
${userInfo}
`;
    const encodedSubject = encodeURIComponent(subject);
    const encodedDescription = encodeURIComponent(description);
    const customerEmail = encodeURIComponent(session?.user?.email || '');
    
    // L'URL de base pour un nouveau ticket dans Frappe Helpdesk est généralement /app/hd-ticket/new
    const ticketUrl = `/helpdesk/app/hd-ticket/new?subject=${encodedSubject}&description=${encodedDescription}&customer=${customerEmail}`;
    
    window.open(ticketUrl, '_blank');
  };

  const isFailing = service.status === 'degraded' || service.status === 'unhealthy';

  return (
    <div className="flex-1 min-w-[200px] flex flex-col gap-3 p-3 rounded-lg bg-background border border-border/60">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3">
              <Icon className={`h-7 w-7 ${statusColor}`} />
              <div className="flex-grow">
                <p className="font-semibold text-base">{service.name}</p>
                <div className="flex items-center gap-1.5">
                  <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                  <p className={`text-sm font-semibold ${statusColor}`}>{statusText}</p>
                </div>
              </div>
              <HeartbeatIcon className={`h-6 w-6 ${statusColor}`} />
            </div>
          </TooltipTrigger>
          {service.error && (
            <TooltipContent>
              <p>{service.error}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      {isFailing && (
        <Button variant="outline" size="sm" onClick={handleOpenTicket} className="w-full mt-2 border-dashed border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500">
          <Ticket className="h-4 w-4 mr-2" />
          Ouvrir un ticket
        </Button>
      )}
    </div>
  );
};

export const ServiceStatusDashboard = () => {
  const { data: session } = useSession();
  const { data, isLoading, error } = useQuery<StatusData | null>({
    queryKey: ['serviceStatus'],
    queryFn: () => fetchServiceStatus(session?.accessToken),
    enabled: !!session?.accessToken,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>État des Services</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>Impossible de charger l'état des services.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>État des Services</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Infrastructure</h3>
          <div className="flex flex-wrap gap-4">
            {data?.infrastructure.map(service => <ServiceCard key={service.name} service={service} />)}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">Outils OSINT</h3>
          <div className="flex flex-wrap gap-4">
            {data?.tools.map(service => <ServiceCard key={service.name} service={service} />)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};