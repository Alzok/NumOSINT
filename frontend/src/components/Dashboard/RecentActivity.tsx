import { useEffect, useState } from 'react';
import { investigationAPI, Result } from '@/lib/investigation-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const RecentActivity = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentResults = async () => {
      try {
        setLoading(true);
        const response = await investigationAPI.getRecentResults(15);
        if (response.data) {
          setResults(response.data);
        } else {
          setError(response.error || 'Une erreur est survenue.');
        }
      } catch (err) {
        setError('Impossible de charger les résultats récents.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentResults();
  }, []);

  const getPrimaryTarget = (result: Result): string => {
    const inputData = result.investigation?.inputData;
    if (!inputData) return 'N/A';
    if (inputData.names?.length > 0) return inputData.names[0];
    if (inputData.emails?.length > 0) return inputData.emails[0];
    if (inputData.usernames?.length > 0) return inputData.usernames[0];
    return 'Inconnu';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activité Récente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité Récente</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {results.map((result) => (
            <li key={result.id} className="flex items-center space-x-4">
              <div className="p-2 bg-secondary rounded-md">
                <FileText className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div className="flex-grow">
                <p className="text-sm font-medium">
                  Nouveau résultat de <Badge variant="outline">{result.toolSource}</Badge> pour l'investigation sur{' '}
                  <Link href={`/investigation/${result.investigationId}`} className="text-primary hover:underline">
                    {getPrimaryTarget(result)}
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true, locale: fr })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;