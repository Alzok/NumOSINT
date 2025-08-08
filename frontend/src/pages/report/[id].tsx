'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api-client';
import { Investigation, Result } from '@/types';
import { UnifiedResultsTable, ProofItem } from '@/components/Results/UnifiedResultsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ReportPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && typeof id === 'string' && token) {
      api.getInvestigation(id, token).then(response => {
        if (response.data) {
          setInvestigation(response.data);
        }
        setLoading(false);
      });
    }
  }, [id, token]);

  if (loading) {
    return <div>Chargement du rapport...</div>;
  }

  if (!investigation) {
    return <div>Rapport non trouvé.</div>;
  }

  // Transformer les résultats pour le tableau unifié
  const transformedResults = investigation.results ? (investigation.results as unknown as ProofItem[]) : [];

  return (
    <div className="p-8 bg-white text-black">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-4xl font-bold">Rapport d'Investigation</h1>
        <h2 className="text-2xl">{(investigation.inputData?.indicators?.[0]?.value) || `ID: ${investigation.id}`}</h2>
        <p className="text-sm text-gray-600">Généré le: {new Date().toLocaleDateString()}</p>
      </header>

      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Résumé</h3>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Statut</CardTitle></CardHeader>
            <CardContent><Badge>{investigation.status}</Badge></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Date de création</CardTitle></CardHeader>
            <CardContent>{new Date(investigation.createdAt).toLocaleString()}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Nombre de résultats</CardTitle></CardHeader>
            <CardContent>{transformedResults.length}</CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-4">Résultats Détaillés</h3>
        <UnifiedResultsTable items={transformedResults} />
      </section>
    </div>
  );
};

export default ReportPage;