"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ErrorOutline } from '@mui/icons-material';
import { api } from '@/lib/api-client';
import { GlobalStats } from '@/types';

export default function StatisticsPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.getGlobalStats({}, token);
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
  }, [token]);

  return (
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
              <ErrorOutline className="h-4 w-4" />
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
  );
}