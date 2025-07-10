"use client";

import { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ErrorOutline } from '@mui/icons-material';
import { investigationAPI } from '@/lib/investigation-api';
import { PersonResult } from '@/types';
import AccountsTable from '@/components/Results/AccountsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AllResultsPage() {
  const [persons, setPersons] = useState<PersonResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupedResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await investigationAPI.getGroupedResults();
        if (response.data?.persons) {
          setPersons(response.data.persons);
        } else {
          setError(response.error || 'Une erreur est survenue lors de la récupération des résultats groupés.');
        }
      } catch (err) {
        setError('Impossible de charger les résultats groupés.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupedResults();
  }, []);

  return (
        <div className="p-4 sm:p-6 lg:p-8">
          {loading && (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          )}
          {error && (
            <Alert variant="destructive">
              <ErrorOutline className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!loading && !error && (
            <AccountsTable persons={persons} />
          )}
        </div>
  );
}