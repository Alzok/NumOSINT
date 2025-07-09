'use client';

import { useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvestigation } from '@/hooks/useInvestigation';
import { useAppStore } from '@/lib/store';

import InvestigationForm from '@/components/Investigation/InvestigationForm';
import SearchLogs from '@/components/Search/SearchLogs';
import ActiveInvestigations from '@/components/Investigation/ActiveInvestigations';
import AccountsTable from '@/components/Results/AccountsTable';
import GlobalStats from '@/components/Results/GlobalStats';

export default function DashboardPage() {
  const { 
    currentInvestigation, 
    investigations, 
    indicators, 
    results, 
    logs, 
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
  const completedInvestigations = investigations.filter(inv => inv.status === 'COMPLETED').length;
  const runningInvestigations = investigations.filter(inv => inv.status === 'SCANNING' || inv.status === 'ENRICHING').length;
  const totalIndicators = indicators.length;
  const totalResults = results.length;

  // Convertir les résultats en format compatible avec les composants existants
  const persons = results.map(result => ({
    id: result.id,
    firstName: result.data?.first_name || result.data?.firstName || '',
    lastName: result.data?.last_name || result.data?.lastName || '',
    emails: [{
      email: result.data?.email || '',
      accounts: [{
        platform: result.toolSource,
        url: result.data?.url || '',
        status: 'active' as const,
        category: result.data?.category || 'unknown',
        method: result.data?.method || 'unknown'
      }],
      total_accounts: 1
    }]
  }));

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
            <div className="grid gap-4 px-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5 lg:px-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    NumOSINT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">Plateforme d'investigation numérique unifiée</div>
                </CardContent>
              </Card>
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
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 lg:px-6">
              <div id="investigation-section">
                <InvestigationForm onSubmit={async (input) => {
                  const investigation = await createInvestigation(input);
                  if (investigation) {
                    await startInvestigation(investigation.id);
                  }
                }} />
              </div>
              <SearchLogs />
            </div>

            <div className="grid gap-8 px-4 lg:px-6">
              <ActiveInvestigations />
              {persons.length > 0 && (
                <>
                  <div id="stats-section">
                    <GlobalStats persons={persons} />
                  </div>
                  <div id="results-section">
                    <AccountsTable persons={persons} />
                  </div>
                </>
              )}
            </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
