'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Play, 
  Square, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  FileText,
  Search,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useInvestigation } from '@/hooks/useInvestigation';
import { useAppStore } from '@/lib/store';
import { Investigation, Indicator, Result, InvestigationLog } from '@/lib/investigation-api';

export default function InvestigationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const { 
    currentInvestigation,
    indicators, 
    results, 
    logs,
    isLoading,
    loadInvestigation,
    startInvestigation,
    stopInvestigation,
    deleteInvestigation,
    loadIndicators,
    loadResults,
    loadLogs
  } = useInvestigation();
  
  const { addNotification } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadInvestigation(id);
    }
  }, [id, loadInvestigation]);

  useEffect(() => {
    if (currentInvestigation) {
      loadIndicators(currentInvestigation.id);
      loadResults(currentInvestigation.id);
      loadLogs(currentInvestigation.id);
    }
  }, [currentInvestigation, loadIndicators, loadResults, loadLogs]);

  const handleStartInvestigation = async () => {
    if (!currentInvestigation) return;
    const success = await startInvestigation(currentInvestigation.id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Investigation démarrée',
        message: `L'investigation a été démarrée avec succès`
      });
    }
  };

  const handleStopInvestigation = async () => {
    if (!currentInvestigation) return;
    const success = await stopInvestigation(currentInvestigation.id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Investigation arrêtée',
        message: `L'investigation a été arrêtée avec succès`
      });
    }
  };

  const handleDeleteInvestigation = async () => {
    if (!currentInvestigation) return;
    const success = await deleteInvestigation(currentInvestigation.id);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Investigation supprimée',
        message: `L'investigation a été supprimée avec succès`
      });
      router.push('/investigations');
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

  const getToolIcon = (toolSource: string) => {
    switch (toolSource.toLowerCase()) {
      case 'buster':
        return <Search className="h-4 w-4" />;
      case 'mosint':
        return <FileText className="h-4 w-4" />;
      case 'maigret':
        return <Activity className="h-4 w-4" />;
      case 'phoneinfoga':
        return <AlertCircle className="h-4 w-4" />;
      case 'spiderfoot':
        return <Search className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (!currentInvestigation) {
    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar variant="sidebar" collapsible="icon" />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/investigations')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Investigation {currentInvestigation.id}
                  </h1>
                  <p className="text-muted-foreground">
                    Créée le {formatDate(currentInvestigation.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(currentInvestigation.status)}
                <Button onClick={() => loadInvestigation(currentInvestigation.id)} disabled={isLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>

          <div className="px-4 lg:px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="indicators">Indicateurs ({indicators.length})</TabsTrigger>
                <TabsTrigger value="results">Résultats ({results.length})</TabsTrigger>
                <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Statut</CardTitle>
                      {getStatusIcon(currentInvestigation.status)}
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{currentInvestigation.status}</div>
                      {currentInvestigation.currentStep && (
                        <p className="text-xs text-muted-foreground">
                          {currentInvestigation.currentStep}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Progression</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{currentInvestigation.progress}%</div>
                      <Progress value={currentInvestigation.progress} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Indicateurs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{indicators.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Analysés
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Résultats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{results.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Trouvés
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {currentInvestigation.status === 'INITIALIZING' && (
                        <Button onClick={handleStartInvestigation} className="w-full">
                          <Play className="h-4 w-4 mr-2" />
                          Démarrer l'investigation
                        </Button>
                      )}
                      
                      {(currentInvestigation.status === 'SCANNING' || currentInvestigation.status === 'ENRICHING') && (
                        <Button onClick={handleStopInvestigation} variant="destructive" className="w-full">
                          <Square className="h-4 w-4 mr-2" />
                          Arrêter l'investigation
                        </Button>
                      )}
                      
                      <Button onClick={handleDeleteInvestigation} variant="outline" className="w-full text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer l'investigation
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Données d'entrée</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentInvestigation.inputData ? (
                        <div className="space-y-2">
                          {currentInvestigation.inputData.names && currentInvestigation.inputData.names.length > 0 && (
                            <div>
                              <p className="text-sm font-medium">Noms:</p>
                              <p className="text-sm text-muted-foreground">{currentInvestigation.inputData.names.join(', ')}</p>
                            </div>
                          )}
                          {currentInvestigation.inputData.emails && currentInvestigation.inputData.emails.length > 0 && (
                            <div>
                              <p className="text-sm font-medium">Emails:</p>
                              <p className="text-sm text-muted-foreground">{currentInvestigation.inputData.emails.join(', ')}</p>
                            </div>
                          )}
                          {currentInvestigation.inputData.usernames && currentInvestigation.inputData.usernames.length > 0 && (
                            <div>
                              <p className="text-sm font-medium">Noms d'utilisateur:</p>
                              <p className="text-sm text-muted-foreground">{currentInvestigation.inputData.usernames.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucune donnée d'entrée</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="indicators" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Indicateurs analysés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {indicators.length === 0 ? (
                      <p className="text-muted-foreground">Aucun indicateur trouvé</p>
                    ) : (
                      <div className="space-y-2">
                        {indicators.map((indicator) => (
                          <div key={indicator.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{indicator.value}</p>
                              <p className="text-sm text-muted-foreground">Type: {indicator.type}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={indicator.verified ? "default" : "outline"}>
                                {indicator.verified ? "Vérifié" : "Non vérifié"}
                              </Badge>
                              <Badge variant="outline">
                                Confiance: {indicator.confidence}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="results" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Résultats trouvés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.length === 0 ? (
                      <p className="text-muted-foreground">Aucun résultat trouvé</p>
                    ) : (
                      <div className="space-y-2">
                        {results.map((result) => (
                          <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {getToolIcon(result.toolSource)}
                              <div>
                                <p className="font-medium">{result.toolSource}</p>
                                <p className="text-sm text-muted-foreground">
                                  Score: {result.score}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {formatDate(result.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Logs d'exécution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {logs.length === 0 ? (
                      <p className="text-muted-foreground">Aucun log disponible</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {logs.map((log) => (
                          <div key={log.id} className="flex items-start gap-3 p-2 border rounded">
                            <div className="flex-shrink-0">
                              <Badge variant={log.level === 'ERROR' ? 'destructive' : log.level === 'WARNING' ? 'default' : 'outline'}>
                                {log.level}
                              </Badge>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{log.step}</p>
                              <p className="text-sm text-muted-foreground">{log.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(log.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}