"use client";

import { useEffect, useState } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert';
import { AlertCircle, ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { investigationAPI, Result, PaginationInfo } from '@/lib/investigation-api';

export default function AllResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await investigationAPI.getAllResults({ page: currentPage, limit: 20 });
        if (response.data) {
          setResults(response.data.data);
          setPagination(response.data.pagination);
        } else {
          setError(response.error || 'Une erreur est survenue.');
        }
      } catch (err) {
        setError('Impossible de charger les résultats.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [currentPage]);

  const getPrimaryTarget = (result: Result): string => {
    const inputData = result.investigation?.inputData;
    if (!inputData) return 'N/A';
    if (inputData.names?.length > 0) return inputData.names[0];
    if (inputData.emails?.length > 0) return inputData.emails[0];
    if (inputData.usernames?.length > 0) return inputData.usernames[0];
    return 'Inconnu';
  };

  const renderResultData = (result: Result) => {
    if (typeof result.data === 'string') {
      return <span className="truncate">{result.data}</span>;
    }
    if (typeof result.data === 'object' && result.data !== null) {
      return <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto"><code>{JSON.stringify(result.data, null, 2)}</code></pre>;
    }
    return 'N/A';
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Tous les Résultats</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {!loading && !error && (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Outil</TableHead>
                          <TableHead>Indicateur</TableHead>
                          <TableHead>Données</TableHead>
                          <TableHead>Investigation</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>
                              <Badge variant="outline">{result.toolSource}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-mono text-xs">{result.indicator?.value}</span>
                                <Badge variant="secondary" className="w-fit mt-1">{result.indicator?.type}</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-sm">{renderResultData(result)}</TableCell>
                            <TableCell>
                              <Link href={`/investigation/${result.investigationId}`} passHref>
                                <Button variant="link" className="p-0 h-auto">
                                  {getPrimaryTarget(result)}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                              </Link>
                            </TableCell>
                            <TableCell>{format(new Date(result.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {pagination && (
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-muted-foreground">
                        Page {pagination.page} sur {pagination.totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setCurrentPage(p => p - 1)}
                          disabled={!pagination.hasPrev}
                          variant="outline"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Précédent
                        </Button>
                        <Button
                          onClick={() => setCurrentPage(p => p + 1)}
                          disabled={!pagination.hasNext}
                          variant="outline"
                        >
                          Suivant
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}