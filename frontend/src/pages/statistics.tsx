"use client";

import { useEffect, useState } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { investigationAPI, GlobalStats } from '@/lib/investigation-api';

export default function StatisticsPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await investigationAPI.getGlobalStats();
        if (response.data) {
          setStats(response.data);
        } else {
          setError(response.error || 'Une erreur est survenue.');
        }
      } catch (err) {
        setError('Impossible de charger les statistiques.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8">
          <h1 className="text-3xl font-bold mb-6">Statistiques Globales</h1>
          
          {loading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>En cours de développement</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle>Investigations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.totalInvestigations}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Résultats</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.totalResults}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* D'autres visualisations de données viendront ici */}

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}