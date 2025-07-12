'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvestigation } from '@/hooks/useInvestigation';
import { Investigation, InvestigationLog, investigationAPI } from '@/lib/investigation-api';
import { useAppStore } from '@/lib/store';
import AnimationOutlinedIcon from '@mui/icons-material/AnimationOutlined';
import Silk from '@/components/ui/Backgrounds/Silk/Silk';

import InvestigationForm from '@/components/Investigation/InvestigationForm';
import SearchLogs from '@/components/Search/SearchLogs';
import ActiveInvestigations from '@/components/Investigation/ActiveInvestigations';
import RecentActivity from '@/components/Dashboard/RecentActivity';
import InvestigationsChart from '@/components/Dashboard/InvestigationsChart';
import ModernInvestigationTimeline from '@/components/Investigation/ModernInvestigationTimeline';
import { mapStatusToPhase } from '@/lib/utils';

export default function DashboardPage() {
  const {
    investigations,
    indicators,
    results,
    isLoading,
    loadInvestigations,
    createInvestigation,
    startInvestigation
  } = useInvestigation();
  
  const { addToastNotification } = useAppStore();
  const [timelineLogs, setTimelineLogs] = useState<InvestigationLog[]>([]);
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);

  useEffect(() => {
    loadInvestigations();
  }, [loadInvestigations]);

  // Calculer les statistiques à partir des investigations
  const totalInvestigations = investigations.length;
  const completedInvestigationsList = investigations.filter(inv => inv.status === 'COMPLETED');
  const completedInvestigations = completedInvestigationsList.length;
  const runningInvestigationsList = investigations.filter(inv => ['SCANNING', 'ENRICHING', 'CONSOLIDATING'].includes(inv.status));
  const runningInvestigations = runningInvestigationsList.length;
  
  // Déterminer quelle investigation afficher dans la timeline
  let investigationForTimeline = null;
  if (runningInvestigations > 0) {
    // Priorité à l'investigation en cours la plus récente
    investigationForTimeline = runningInvestigationsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  } else if (completedInvestigations > 0) {
    // Sinon, montrer la dernière investigation terminée
    investigationForTimeline = completedInvestigationsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }
  
  useEffect(() => {
    if (investigationForTimeline) {
      console.log("Investigation for timeline:", investigationForTimeline.id);
      setTimelineLoading(true);
      investigationAPI.getLogs(investigationForTimeline.id)
        .then(response => {
          console.log("Logs response:", response);
          if (response.data && response.data.logs) {
            setTimelineLogs(response.data.logs);
          }
        })
        .finally(() => setTimelineLoading(false));
    } else {
      console.log("No investigation for timeline.");
      setTimelineLogs([]);
    }
  }, [investigationForTimeline]);

  const totalIndicators = indicators.length;
  const totalResults = results.length;

  return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
                              <Card className="relative overflow-hidden">
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <AnimationOutlinedIcon />
                      NumOSINT
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="absolute inset-0 overflow-hidden rounded-md">
                      <Silk
                        speed={4}
                        scale={0.8}
                        color="#6B6B6B"
                        noiseIntensity={10}
                        rotation={0}
                      />
                    </div>
                    <div className="relative z-10 text-xl font-bold text-[#e5ee10]">Plateforme d'investigation numérique unifiée</div>
                  </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-8 px-4 lg:px-6">
              <div id="investigation-section" className="w-full">
                <InvestigationForm onSubmit={async (input) => {
                  const investigation = await createInvestigation(input);
                  if (investigation) {
                    await startInvestigation(investigation.id);
                    return true;
                  }
                  return false;
                }}
                isLoading={isLoading} />
              </div>

              <div className="w-full">
                  <Card>
                      <CardHeader>
                          <CardTitle>
                              {investigationForTimeline ? (runningInvestigations > 0 ? "Progression de l'investigation en cours" : "Dernière investigation terminée") : "Progression de l'investigation"}
                          </CardTitle>
                      </CardHeader>
                      <CardContent>
                          {timelineLoading ? (
                            <div className="flex justify-center items-center h-24">
                              <p className="text-sm text-muted-foreground">Chargement de la timeline...</p>
                            </div>
                          ) : (
                            <ModernInvestigationTimeline
                                logs={timelineLogs}
                            />
                          )}
                      </CardContent>
                  </Card>
              </div>

              <div id="logs-section">
                <SearchLogs />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 lg:px-6">
              <ActiveInvestigations />
              <RecentActivity />
            </div>

            <div className="px-4 lg:px-6">
                <InvestigationsChart />
            </div>

            <div className="grid gap-4 px-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 lg:px-6">
              <Link href="/investigations?status=active">
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Investigations en cours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{runningInvestigations}</div>
                    <p className="text-xs text-muted-foreground">
                      Cliquez pour voir les détails
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/investigations?status=completed">
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Investigations terminées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{completedInvestigations}</div>
                    <p className="text-xs text-muted-foreground">
                      {totalInvestigations > 0 ? `${Math.round((completedInvestigations / totalInvestigations) * 100)}% du total` : '0% du total'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/investigations">
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toutes les investigations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalInvestigations}</div>
                    <p className="text-xs text-muted-foreground">
                      Voir l'historique complet
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/results">
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total des résultats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalResults}</div>
                    <p className="text-xs text-muted-foreground">
                      Tous types confondus
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
        </div>
  );
}
