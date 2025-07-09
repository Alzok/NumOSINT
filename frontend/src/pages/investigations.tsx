'use client';

import { useEffect, useState } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { useInvestigation } from '@/hooks/useInvestigation';
import { useAppStore } from '@/lib/store';
import { Investigation } from '@/lib/investigation-api';

export default function InvestigationsPage() {
  const { 
    investigations, 
    isLoading,
    loadInvestigations,
    startInvestigation,
    stopInvestigation,
    deleteInvestigation,
    loadInvestigation
  } = useInvestigation();
  
  const { addNotification } = useAppStore();
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);

  useEffect(() => {
    loadInvestigations();
  }, [loadInvestigations]);

  const handleStartInvestigation = async (id: string) => {
    const success = await startInvestigation(id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Investigation démarrée',
        message: `L'investigation ${id} a été démarrée avec succès`
      });
    }
  };

  const handleStopInvestigation = async (id: string) => {
    const success = await stopInvestigation(id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Investigation arrêtée',
        message: `L'investigation ${id} a été arrêtée avec succès`
      });
    }
  };

  const handleDeleteInvestigation = async (id: string) => {
    const success = await deleteInvestigation(id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Investigation supprimée',
        message: `L'investigation ${id} a été supprimée avec succès`
      });
    }
  };

  const handleViewInvestigation = async (id: string) => {
    const investigation = await loadInvestigation(id);
    if (investigation) {
      setSelectedInvestigation(investigation);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'SCANNING':
      case 'ENRICHING':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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

  return (
    <SidebarProvider
      defaultOpen={false}
      style={
        {
          "--sidebar-width": "18rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="sidebar" collapsible="icon" />
      <SidebarInset>
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Investigations</h1>
                <p className="text-muted-foreground">
                  Gérez vos investigations OSINT
                </p>
              </div>
              <Button onClick={() => loadInvestigations()} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>

          <div className="px-4 lg:px-6">
            <div className="grid gap-4">
              {investigations.length === 0 ? (
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
                investigations.map((investigation) => (
                  <Card key={investigation.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(investigation.status)}
                          <div>
                            <h3 className="font-semibold">Investigation {investigation.id}</h3>
                            <p className="text-sm text-muted-foreground">
                              Créée le {formatDate(investigation.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(investigation.status)}
                        </div>
                      </div>

                      {investigation.currentStep && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Étape actuelle: {investigation.currentStep}
                          </p>
                          <Progress value={investigation.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {investigation.progress}% terminé
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleViewInvestigation(investigation.id)}
                            variant="outline"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          
                          {investigation.status === 'INITIALIZING' && (
                            <Button
                              size="sm"
                              onClick={() => handleStartInvestigation(investigation.id)}
                              disabled={isLoading}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Démarrer
                            </Button>
                          )}
                          
                          {(investigation.status === 'SCANNING' || investigation.status === 'ENRICHING') && (
                            <Button
                              size="sm"
                              onClick={() => handleStopInvestigation(investigation.id)}
                              variant="destructive"
                              disabled={isLoading}
                            >
                              <Square className="h-4 w-4 mr-1" />
                              Arrêter
                            </Button>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleDeleteInvestigation(investigation.id)}
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}