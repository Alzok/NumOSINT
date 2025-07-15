import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api-client';
import { Investigation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Article, ErrorOutline } from '@mui/icons-material';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const RecentActivity = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentInvestigations = async () => {
      if (!token) {
        setLoading(false);
        return;
      };
      try {
        setLoading(true);
        const response = await api.getInvestigations({ limit: 5, sortBy: 'updatedAt', sortOrder: 'desc' }, token);
        if (response.data) {
          setInvestigations(response.data);
        } else {
          setError(response.error || 'Une erreur est survenue.');
        }
      } catch (err) {
        setError('Impossible de charger l\'activité récente.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentInvestigations();
  }, [token]);

  const getPrimaryTarget = (investigation: Investigation): string => {
    const inputData = investigation?.inputData;
    if (!inputData) return 'N/A';
    if (inputData.names && inputData.names.length > 0) return inputData.names[0];
    if (inputData.emails && inputData.emails.length > 0) return inputData.emails[0];
    if (inputData.usernames && inputData.usernames.length > 0) return inputData.usernames[0];
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
        <ErrorOutline className="h-4 w-4" />
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
          {investigations.map((investigation) => (
            <li key={investigation.id} className="flex items-center space-x-4">
              <div className="p-2 bg-secondary rounded-md">
                <Article className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div className="flex-grow">
                <div className="text-sm font-medium">
                  Investigation sur <Badge variant="outline">{getPrimaryTarget(investigation)}</Badge> mise à jour.
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(investigation.updatedAt), { addSuffix: true, locale: fr })}
                </p>
                 <Link href={`/investigation/${investigation.id}`} className="text-primary hover:underline text-xs">
                    Voir les détails
                  </Link>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;