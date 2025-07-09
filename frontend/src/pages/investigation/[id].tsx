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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  AlertCircle,
  Mail,
  User,
  Phone,
  Globe,
  Wifi,
  WifiOff,
  Info
} from 'lucide-react';
import { useInvestigation } from '@/hooks/useInvestigation';
import { useAppStore } from '@/lib/store';
import { Investigation, Indicator, Result, InvestigationLog } from '@/lib/investigation-api';
import EmailAnalysisView from '@/components/Investigation/EmailAnalysisView';
import UsernameAnalysisView from '@/components/Investigation/UsernameAnalysisView';
import PhoneAnalysisView from '@/components/Investigation/PhoneAnalysisView';
import ComprehensiveReportView from '@/components/Investigation/ComprehensiveReportView';
import RealTimeNotifications from '@/components/Investigation/RealTimeNotifications';
import InvestigationReportView from '@/components/Investigation/InvestigationReportView';

export default function InvestigationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const investigationId = typeof id === 'string' ? id : undefined;

  const {
    currentInvestigation,
    indicators,
    results,
    logs,
    isLoading,
    isSocketConnected,
    loadInvestigation,
    startInvestigation,
    stopInvestigation,
    deleteInvestigation,
  } = useInvestigation(investigationId);
  
  const { addNotification } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (investigationId) {
      loadInvestigation(investigationId);
    }
  }, [investigationId, loadInvestigation]);

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

  const isAnalysisRunning = currentInvestigation?.status === 'SCANNING' || currentInvestigation?.status === 'ENRICHING';

  // Filtrer les résultats par type d'outil
  const emailResults = results.filter(result => result.toolSource.toLowerCase() === 'mosint');
  const usernameResults = results.filter(result => result.toolSource.toLowerCase() === 'maigret');
  const phoneResults = results.filter(result => result.toolSource.toLowerCase() === 'phoneinfoga');
  const comprehensiveResults = results.filter(result => result.toolSource.toLowerCase() === 'spiderfoot');

  // Transformer les résultats pour les vues spécialisées
  const transformEmailResults = (results: Result[]) => {
    return results.map(result => ({
      email: result.data?.email || '',
      breaches: result.data?.breaches || [],
      reputation: result.data?.reputation || { score: 0, status: 'clean' as const, sources: [] },
      social_profiles: result.data?.social_profiles || [],
      metadata: result.data?.metadata || {
        domain: '',
        mx_records: [],
        created_at: '',
        last_seen: ''
      }
    }));
  };

  const transformUsernameResults = (results: Result[]) => {
    return results.map(result => ({
      search_username: result.data?.search_username || result.data?.username || '',
      username_variations: result.data?.username_variations || [],
      found_profiles: result.data?.found_profiles || result.data?.accounts || [],
      related_usernames: result.data?.related_usernames || [],
      statistics: result.data?.statistics || {
        total_sites: 0,
        found_sites: 0,
        success_rate: 0,
        by_category: {},
        by_country: {},
        top_platforms: []
      }
    }));
  };

  const transformPhoneResults = (results: Result[]) => {
    return results.map(result => ({
      phone_number: result.data?.phone_number || '',
      country_info: result.data?.country_info || {
        name: result.data?.country || '',
        code: '',
        calling_code: ''
      },
      carrier_info: result.data?.carrier_info || {
        name: result.data?.carrier || '',
        type: '',
        country: ''
      },
      location_info: result.data?.location_info || result.data?.location || {},
      validation: result.data?.validation || { is_valid: true, type: 'mobile' },
      risk_assessment: result.data?.risk_assessment || {
        score: 0,
        level: 'low',
        factors: []
      },
      social_media: result.data?.social_media || [],
      metadata: result.data?.metadata || {}
    }));
  };

  const transformComprehensiveResults = (results: Result[]) => {
    return results.map(result => ({
      scan_id: result.id,
      target: result.data?.target || '',
      start_time: result.createdAt,
      end_time: result.createdAt,
      duration: 0,
      modules: result.data?.modules || [],
      findings: result.data?.findings || [],
      total_findings: result.data?.total_findings || 0,
      high_risk_findings: result.data?.high_risk_findings || 0,
      summary: result.data?.summary || {},
      recommendations: result.data?.recommendations || [],
      statistics: result.data?.statistics || {
        total_modules: 0,
        successful_modules: 0,
        failed_modules: 0,
        execution_time: 0
      },
      risk_assessment: result.data?.risk_assessment || {
        overall_risk: 'low',
        risk_factors: [],
        mitigation_suggestions: []
      }
    }));
  };

  if (isLoading && !currentInvestigation) {
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
  
  if (!currentInvestigation) {
      return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar variant="sidebar" collapsible="icon" />
        <SidebarInset>
          <div className="flex flex-col items-center justify-center h-screen">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Investigation non trouvée</h2>
            <p className="text-muted-foreground mb-4">L'investigation que vous cherchez n'existe pas ou a été supprimée.</p>
            <Button onClick={() => router.push('/investigations')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const analysisCardClass = isAnalysisRunning ? "border-blue-500 border-2 animate-pulse" : "";

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
                <Badge variant={isSocketConnected ? "default" : "destructive"}>
                  {isSocketConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                  {isSocketConnected ? 'Connecté' : 'Déconnecté'}
                </Badge>
                {getStatusBadge(currentInvestigation.status)}
              </div>
            </div>
          </div>

          {isAnalysisRunning && (
            <div className="px-4 lg:px-6">
              <Alert className="border-blue-500 bg-blue-50 text-blue-800">
                <Info className="h-4 w-4 !text-blue-800" />
                <AlertTitle>Analyse en cours</AlertTitle>
                <AlertDescription>
                  Les résultats s'affichent en temps réel. De nouvelles informations peuvent apparaître à tout moment.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="px-4 lg:px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="indicators">Indicateurs ({indicators.length})</TabsTrigger>
                <TabsTrigger value="results">Résultats ({results.length})</TabsTrigger>
                <TabsTrigger value="email-analysis">
                  <Mail className="h-4 w-4 mr-1" />
                  Emails ({emailResults.length})
                </TabsTrigger>
                <TabsTrigger value="username-analysis">
                  <User className="h-4 w-4 mr-1" />
                  Usernames ({usernameResults.length})
                </TabsTrigger>
                <TabsTrigger value="phone-analysis">
                  <Phone className="h-4 w-4 mr-1" />
                  Téléphones ({phoneResults.length})
                </TabsTrigger>
                <TabsTrigger value="comprehensive-analysis">
                  <Globe className="h-4 w-4 mr-1" />
                  Complet ({comprehensiveResults.length})
                </TabsTrigger>
                <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
                <TabsTrigger value="report" disabled={currentInvestigation.status !== 'COMPLETED'}>
                  <FileText className="h-4 w-4 mr-1" />
                  Rapport
                </TabsTrigger>
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
                        Trouvés
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
                        Générés
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
                      
                      {isAnalysisRunning && (
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
                      <p className="text-muted-foreground">Aucun indicateur trouvé pour le moment...</p>
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
                    <CardTitle>Résultats bruts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.length === 0 ? (
                      <p className="text-muted-foreground">Aucun résultat trouvé pour le moment...</p>
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

              <TabsContent value="email-analysis" className="space-y-4">
                <Card className={analysisCardClass}>
                  <CardHeader>
                    <CardTitle>Analyse des emails (Mosint)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {emailResults.length === 0 ? (
                      <p className="text-muted-foreground">Aucun résultat d'email disponible pour le moment...</p>
                    ) : (
                      <EmailAnalysisView data={transformEmailResults(emailResults)} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="username-analysis" className="space-y-4">
                <Card className={analysisCardClass}>
                  <CardHeader>
                    <CardTitle>Analyse des noms d'utilisateur (Maigret)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {usernameResults.length === 0 ? (
                      <p className="text-muted-foreground">Aucun résultat de nom d'utilisateur disponible pour le moment...</p>
                    ) : (
                      <UsernameAnalysisView data={transformUsernameResults(usernameResults)} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="phone-analysis" className="space-y-4">
                <Card className={analysisCardClass}>
                  <CardHeader>
                    <CardTitle>Analyse des téléphones (PhoneInfoga)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {phoneResults.length === 0 ? (
                      <p className="text-muted-foreground">Aucun résultat de téléphone disponible pour le moment...</p>
                    ) : (
                      <PhoneAnalysisView data={transformPhoneResults(phoneResults)} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comprehensive-analysis" className="space-y-4">
                <Card className={analysisCardClass}>
                  <CardHeader>
                    <CardTitle>Analyse complète (SpiderFoot)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {comprehensiveResults.length === 0 ? (
                      <p className="text-muted-foreground">Aucun résultat complet disponible pour le moment...</p>
                    ) : (
                      <ComprehensiveReportView data={transformComprehensiveResults(comprehensiveResults)} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="space-y-4">
                <RealTimeNotifications
                  logs={logs}
                  investigationId={currentInvestigation.id}
                />
              </TabsContent>

              <TabsContent value="report" className="space-y-4">
                <InvestigationReportView
                  investigation={currentInvestigation}
                  results={results}
                  indicators={indicators}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}