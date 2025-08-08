'use client';

import { useRouter } from 'next/router';
import { useCase } from '@/hooks/useCase';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CaseSummaryView } from '@/components/Investigation/CaseSummaryView';
import { api } from '@/lib/api-client';
import { saveAs } from 'file-saver';

// --- Local SVG Icon Components ---
const FolderIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.23A2 2 0 0 0 8.27 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
);
const ErrorOutlineIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 8l0 4" /><path d="M12 16l.01 0" /></svg>
);


const CaseDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { caseDetails, isLoading, error } = useCase(id as string);

  const { data: session } = useSession();
  const token = session?.accessToken;

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (!id || !token) return;
    try {
      const response = await api.exportCase(id as string, format, token);
      if (response.data) {
        saveAs(response.data, `rapport-dossier-${id}.${format}`);
      } else {
        console.error('Failed to export case', response.error);
      }
    } catch (err) {
      console.error('Failed to export case', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-6 w-3/4 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !caseDetails) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <ErrorOutlineIcon className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : error || "Le dossier demandé n'a pas pu être trouvé."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <FolderIcon className="h-8 w-8 text-blue-600" />
                    <h1 className="text-4xl font-bold tracking-tight">{caseDetails.name}</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  {caseDetails.description || 'Aucune description pour ce dossier.'}
                </p>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => handleExport('pdf')}>Exporter en PDF</Button>
                <Button onClick={() => handleExport('csv')} variant="outline">Exporter en CSV</Button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold">Investigations ({caseDetails.investigations.length})</h2>
            {caseDetails.investigations.map(inv => (
                <Card key={inv.id} onClick={() => router.push(`/investigation/${inv.id}`)} className="cursor-pointer hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="flex justify-between">
                            <span>{(inv.inputData?.indicators?.[0]?.value) || inv.id}</span>
                            <Badge>{inv.status}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Créé le: {new Date(inv.createdAt).toLocaleDateString()}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
        <div className="lg:col-span-1">
            <CaseSummaryView caseDetails={caseDetails} />
        </div>
      </div>
    </div>
  );
};

export default CaseDetailPage;