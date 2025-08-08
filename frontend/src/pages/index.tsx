'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvestigationActions } from '@/hooks/useInvestigationActions';
import { useInvestigationsList } from '@/hooks/useInvestigationsList';
import { InvestigationLog, DashboardStats } from '@/types';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import AnimationOutlinedIcon from '@mui/icons-material/AnimationOutlined';
import { Coins } from 'lucide-react';
import Silk from '@/components/ui/Backgrounds/Silk/Silk';
import { CreditDisplay } from '@/components/common/CreditDisplay';
import InvestigationForm from '@/components/Investigation/InvestigationForm';
import ActiveInvestigations from '@/components/Investigation/ActiveInvestigations';
import RecentActivity from '@/components/Dashboard/RecentActivity';
import ModernInvestigationTimeline from '@/components/Investigation/ModernInvestigationTimeline';
import { ServiceStatusDashboard } from '@/components/Dashboard/ServiceStatus';
import { InvestigationErrorState } from '@/components/Investigation/InvestigationErrorState';

const InvestigationsChart = dynamic(() => import('@/components/Dashboard/InvestigationsChart'), {
  loading: () => <p>Chargement du graphique...</p>,
  ssr: false
});

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;

  const {
    createInvestigation,
    startInvestigation,
    isCreating,
    isStarting
  } = useInvestigationActions();
  const isLoading = isCreating || isStarting;
  const { investigations, refreshInvestigations: loadInvestigations } = useInvestigationsList();
  const { dashboardFilters } = useAppStore();
  const { period, date } = dashboardFilters;
  
  const [stats, setStats] = useState<DashboardStats>({
    totalInvestigations: 0,
    completedInvestigations: 0,
    runningInvestigations: 0,
    totalResults: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      setStatsLoading(true);
      const params: { period?: string; date?: string } = {};
      if (date) {
        params.date = date;
      } else {
        params.period = period;
      }
      const response = await api.getGlobalStats(params, token);
      if (response.data) {
        setStats(response.data);
      }
      setStatsLoading(false);
    };
    fetchStats();
  }, [token, period, date]);

  // La logique de la timeline reste la même pour l'instant
  const [timelineLogs, setTimelineLogs] = useState<InvestigationLog[]>([]);
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);
  
  useEffect(() => {
    loadInvestigations();
  }, [loadInvestigations]);

  const runningInvestigationsList = investigations.filter(inv => ['SCANNING', 'ENRICHING', 'CONSOLIDATING'].includes(inv.status));
  const completedInvestigationsList = investigations.filter(inv => inv.status === 'COMPLETED');
  
  let investigationForTimeline = null;
  if (runningInvestigationsList.length > 0) {
    investigationForTimeline = runningInvestigationsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  } else if (completedInvestigationsList.length > 0) {
    investigationForTimeline = completedInvestigationsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  useEffect(() => {
    if (investigationForTimeline && token) {
      setTimelineLoading(true);
      api.getLogs(investigationForTimeline.id, token)
        .then((response: { data: { logs: InvestigationLog[] } | null, error: string | null }) => {
          if (response.data && response.data.logs) {
            setTimelineLogs(response.data.logs);
          }
        })
        .finally(() => setTimelineLoading(false));
    } else {
      setTimelineLogs([]);
    }
  }, [investigationForTimeline, token]);

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
                    <p className="relative z-10 text-xl font-bold text-[#e5ee10]">Plateforme d'investigation numérique unifiée</p>
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
                <ServiceStatusDashboard />
              </div>

              <div className="w-full">
                {investigationForTimeline && investigationForTimeline.status === 'FAILED' ? (
                  <InvestigationErrorState investigation={investigationForTimeline} />
                ) : (
                  <Card>
                      <CardHeader>
                          <CardTitle>
                              {investigationForTimeline ? (runningInvestigationsList.length > 0 ? "Progression de l'investigation en cours" : "Dernière investigation terminée") : "Progression de l'investigation"}
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
                )}
              </div>

            </section>

            <section aria-label="Investigations actives et activité récente" className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 lg:px-6">
              <ActiveInvestigations />
              <RecentActivity />
            </section>


            <section aria-label="Statistiques générales" className="grid gap-4 px-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 lg:px-6">
              <Link href="/store">
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Jetons restants</CardTitle>
                    <Coins className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <CreditDisplay credits={session?.user?.credits} isLoading={status === 'loading'} />
                    </div>
                     <p className="text-xs text-muted-foreground">
                        Utilisés pour lancer des investigations
                      </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/investigations?status=active">
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Investigations en cours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statsLoading ? '...' : stats.runningInvestigations}</div>
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
                    <div className="text-2xl font-bold">{statsLoading ? '...' : stats.completedInvestigations}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalInvestigations > 0 ? `${Math.round((stats.completedInvestigations / stats.totalInvestigations) * 100)}% du total` : '0% du total'}
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
                    <div className="text-2xl font-bold">{statsLoading ? '...' : stats.totalResults}</div>
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
