'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvestigation } from '@/hooks/useInvestigation';
import { useAppStore } from '@/lib/store';

import InvestigationForm from '@/components/Investigation/InvestigationForm';
import SearchLogs from '@/components/Search/SearchLogs';
import ActiveInvestigations from '@/components/Investigation/ActiveInvestigations';
import RecentActivity from '@/components/Dashboard/RecentActivity';
import InvestigationTimeline from '@/components/Investigation/InvestigationTimeline';
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
  
  const { addNotification } = useAppStore();

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

  const totalIndicators = indicators.length;
  const totalResults = results.length;

  return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                        <path d="M17 14c-.24-.24-.44-.49-.65-.75C17.51 11.5 19 8.56 19 5c0-1.95-.74-3-2-3-1.54 0-3.96 2.06-5 5.97C10.96 4.06 8.54 2 7 2 5.74 2 5 3.05 5 5c0 3.56 1.49 6.5 2.65 8.25-.21.26-.41.51-.65.75-.25.25-2 1.39-2 3.5C5 19.98 7.02 22 9.5 22c1.5 0 2.5-.5 2.5-.5s1 .5 2.5.5c2.48 0 4.5-2.02 4.5-4.5 0-2.11-1.75-3.25-2-3.5m-.12-9.97c.06.17.12.48.12.97 0 2.84-1.11 5.24-2.07 6.78-.38-.26-.83-.48-1.4-.62.24-4.52 2.44-6.83 3.35-7.13M7 5c0-.49.06-.8.12-.97.91.3 3.11 2.61 3.36 7.13-.58.14-1.03.35-1.4.62C8.11 10.24 7 7.84 7 5m7.5 15c-1 0-1.8-.33-2.22-.56.42-.18.72-.71.72-.94 0-.28-.45-.5-1-.5s-1 .22-1 .5c0 .23.3.76.72.94-.42.23-1.22.56-2.22.56C8.12 20 7 18.88 7 17.5c0-.7.43-1.24 1-1.73.44-.36.61-.52 1.3-1.37.76-.95 1.09-1.4 2.7-1.4s1.94.45 2.7 1.4c.69.85.86 1.01 1.3 1.37.57.49 1 1.03 1 1.73 0 1.38-1.12 2.5-2.5 2.5m-.5-4c0 .41-.22.75-.5.75s-.5-.34-.5-.75.22-.75.5-.75.5.34.5.75m-3 0c0 .41-.22.75-.5.75s-.5-.34-.5-.75.22-.75.5-.75.5.34.5.75"></path>
                      </svg>
                      NumOSINT
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">Plateforme d'investigation numérique unifiée</div>
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
                          <InvestigationTimeline
                              currentPhase={investigationForTimeline ? mapStatusToPhase(investigationForTimeline.status) : ''}
                              status={investigationForTimeline ? investigationForTimeline.status : 'NONE'}
                          />
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

            <div className="grid gap-4 px-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 lg:px-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Investigations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalInvestigations}</div>
                  <p className="text-xs text-muted-foreground">
                    {completedInvestigations} terminées, {runningInvestigations} en cours
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Indicateurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalIndicators}</div>
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
                  <div className="text-2xl font-bold">{totalResults}</div>
                  <p className="text-xs text-muted-foreground">
                    Trouvés
                  </p>
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalInvestigations > 0 ? Math.round((completedInvestigations / totalInvestigations) * 100) : 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    Basé sur les investigations terminées
                  </p>
                </CardContent>
              </Card>
            </div>
        </div>
  );
}
