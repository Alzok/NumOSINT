'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Square,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  FileText,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { useInvestigation } from '@/hooks/useInvestigation';
import { useAppStore } from '@/lib/store';
import { Investigation } from '@/lib/investigation-api';

export default function InvestigationsPage() {
  const router = useRouter();
  const {
    investigations,
    isLoading,
    loadInvestigations,
    startInvestigation,
    stopInvestigation,
    deleteInvestigation,
  } = useInvestigation();
  
  const { addNotification } = useAppStore();

  useEffect(() => {
    loadInvestigations();
  }, [loadInvestigations]);

  const handleAction = async (action: (id: string) => Promise<any>, id: string, successTitle: string, successMessage: string) => {
    const success = await action(id);
    if (success) {
      addNotification({
        type: 'success',
        title: successTitle,
        message: successMessage,
      });
      loadInvestigations(); // Recharger la liste après une action réussie
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'SCANNING':
      case 'ENRICHING':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Terminée</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Échouée</Badge>;
      case 'SCANNING':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Scan en cours</Badge>;
      case 'ENRICHING':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Enrichissement</Badge>;
      case 'INITIALIZING':
        return <Badge variant="outline">Initialisation</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getPrimaryTarget = (investigation: Investigation) => {
    const { inputData } = investigation;
    if (!inputData) return { type: 'ID', value: investigation.id };
    if (inputData.names?.[0]) return { type: 'Nom', value: inputData.names[0], icon: <User className="h-4 w-4" /> };
    if (inputData.emails?.[0]) return { type: 'Email', value: inputData.emails[0], icon: <Mail className="h-4 w-4" /> };
    if (inputData.usernames?.[0]) return { type: 'Username', value: inputData.usernames[0], icon: <User className="h-4 w-4" /> };
    if (inputData.phones?.[0]) return { type: 'Téléphone', value: inputData.phones[0], icon: <Phone className="h-4 w-4" /> };
    return { type: 'ID', value: investigation.id, icon: <FileText className="h-4 w-4" /> };
  };

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ "--sidebar-width": "18rem" } as React.CSSProperties}
    >
      <AppSidebar variant="sidebar" collapsible="icon" />
      <SidebarInset>
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Investigations</h1>
                <p className="text-muted-foreground">
                  Gérez et consultez vos investigations OSINT
                </p>
              </div>
              <Button onClick={() => loadInvestigations()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>

          <div className="px-4 lg:px-6">
            {isLoading && investigations.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : investigations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Aucune investigation</h3>
                    <p className="text-muted-foreground mb-4">
                      Créez votre première investigation pour commencer
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {investigations.map((investigation) => {
                  const primaryTarget = getPrimaryTarget(investigation);
                  return (
                    <Card key={investigation.id} className="hover:shadow-lg transition-shadow flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(investigation.status)}
                            <span className="truncate font-semibold">{primaryTarget.value}</span>
                          </div>
                          {getStatusBadge(investigation.status)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="text-sm text-muted-foreground space-y-2">
                          <div className="flex items-center gap-2">
                            {primaryTarget.icon}
                            <span>{primaryTarget.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(investigation.createdAt)}</span>
                          </div>
                        </div>
                        {(investigation.status === 'SCANNING' || investigation.status === 'ENRICHING') && (
                          <div className="mt-4">
                            <Progress value={investigation.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1 text-right">
                              {investigation.progress}%
                            </p>
                          </div>
                        )}
                      </CardContent>
                      <div className="p-6 pt-0 mt-auto">
                        <div className="flex items-center justify-between">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/investigation/${investigation.id}`)}
                            variant="outline"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                          
                          <div className="flex items-center gap-1">
                            {investigation.status === 'INITIALIZING' && (
                              <Button size="icon" variant="ghost" onClick={() => handleAction(startInvestigation, investigation.id, 'Investigation démarrée', `L'investigation ${primaryTarget.value} a été démarrée.`)} disabled={isLoading}>
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {(investigation.status === 'SCANNING' || investigation.status === 'ENRICHING') && (
                              <Button size="icon" variant="ghost" onClick={() => handleAction(stopInvestigation, investigation.id, 'Investigation arrêtée', `L'investigation ${primaryTarget.value} a été arrêtée.`)} disabled={isLoading}>
                                <Square className="h-4 w-4 text-yellow-600" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" onClick={() => handleAction(deleteInvestigation, investigation.id, 'Investigation supprimée', `L'investigation ${primaryTarget.value} a été supprimée.`)} disabled={isLoading}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}