'use client';

import { useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAllResults, useIsLoading } from '@/lib/store';
import { useSearch } from '@/hooks/useSearch';

import SearchForm from '@/components/Search/SearchForm';
import SearchLogs from '@/components/Search/SearchLogs';
import ActiveSearches from '@/components/Search/ActiveSearches';
import AccountsTable from '@/components/Results/AccountsTable';
import GlobalStats from '@/components/Results/GlobalStats';

export default function DashboardPage() {
  const { loadInitialData } = useSearch();
  const allResults = useAllResults();
  const isLoading = useIsLoading();

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const persons = allResults?.persons || [];
  const totalPersons = persons.length;
  const totalEmails = allResults?.stats?.total_emails || 0;
  const totalAccounts = allResults?.stats?.total_accounts || 0;
  const totalPlatforms = allResults?.stats?.total_platforms || 0;

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
                  <div className="text-sm text-muted-foreground">Plateforme d'investigation numérique</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comptes Trouvés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAccounts}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Emails Analysés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalEmails}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Plateformes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPlatforms}</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 lg:px-6">
              <div id="search-section">
                <SearchForm />
              </div>
              <SearchLogs />
            </div>

            <div className="grid gap-8 px-4 lg:px-6">
              <ActiveSearches />
              <div id="stats-section">
                <GlobalStats persons={persons} />
              </div>
              <div id="results-section">
                <AccountsTable persons={persons} />
              </div>
            </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
