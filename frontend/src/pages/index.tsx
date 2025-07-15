'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvestigationActions } from '@/hooks/useInvestigationActions';
import { useInvestigationsList } from '@/hooks/useInvestigationsList';
import { InvestigationLog } from '@/types';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import AnimationOutlinedIcon from '@mui/icons-material/AnimationOutlined';
import Silk from '@/components/ui/Backgrounds/Silk/Silk';

import InvestigationForm from '@/components/Investigation/InvestigationForm';
import ActiveInvestigations from '@/components/Investigation/ActiveInvestigations';
import RecentActivity from '@/components/Dashboard/RecentActivity';
import ModernInvestigationTimeline from '@/components/Investigation/ModernInvestigationTimeline';

const InvestigationsChart = dynamic(() => import('@/components/Dashboard/InvestigationsChart'), {
  loading: () => <p>Chargement du graphique...</p>,
  ssr: false
});
import { mapStatusToPhase } from '@/lib/utils';

export default function DashboardPage() {
  const {
    createInvestigation,
    startInvestigation,
    isCreating,
    isStarting
  } = useInvestigationActions();
  const isLoading = isCreating || isStarting;
  const { investigations, refreshInvestigations: loadInvestigations } = useInvestigationsList();
  
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
  
import { useSession } from 'next-auth/react';

// ...

export default function DashboardPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  // ...
  useEffect(() => {
    if (investigationForTimeline && token) {
      console.log("Investigation for timeline:", investigationForTimeline.id);
      setTimelineLoading(true);
      api.getLogs(investigationForTimeline.id, token)
        .then((response: { data: { logs: InvestigationLog[] } | null, error: string | null }) => {
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

  const totalResults = investigations.reduce((acc, inv) => acc + (inv.results?.length || 0), 0);

  return (
        <main className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <header className="px-4 lg:px-6">
                <Card className="relative overflow-hidden">
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 z-10">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <h1 className="flex items-center gap-2">
                        <AnimationOutlinedIcon />
                        NumOSINT
                      </h1>
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
                    <p className="relative z-10 text-xl font-bold text-[#e5ee10]">Plateforme d&apos;investigation numérique unifiée</p>
                  </CardContent>
                </Card>
            </header>
            
            <section aria-labelledby="investigation-form-title" className="grid grid-cols-1 gap-8 px-4 lg:px-6">
              <div className="w-full">
                <h2 id="investigation-form-title" className="sr-only">Créer une investigation</h2>
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

            </section>

            <section aria-label="Investigations actives et activité récente" className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 lg:px-6">
              <ActiveInvestigations />
              <RecentActivity />
            </section>

            <section aria-label="Graphique des investigations" className="px-4 lg:px-6">
                <InvestigationsChart />
            </section>

            <section aria-label="Statistiques générales" className="grid gap-4 px-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 lg:px-6">
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
                      Voir l&apos;historique complet
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
            </section>
        </main>
  );
}
