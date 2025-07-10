'use client';

import { Case } from '@/lib/investigation-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CaseSummaryViewProps {
  caseDetails: Case;
}

export function CaseSummaryView({ caseDetails }: CaseSummaryViewProps) {
  // 1. Agréger les données
  // 1. Agréger les données
  const totalInvestigations = caseDetails.investigations.length;
  const allResults = caseDetails.investigations.flatMap(inv => inv.results || []);
  const totalResults = allResults.length;

  const investigationStatus = caseDetails.investigations.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const resultsByTool = allResults.reduce((acc, result) => {
    acc[result.toolSource] = (acc[result.toolSource] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allIndicators = caseDetails.investigations.flatMap(inv => inv.indicators || []);
  const indicatorsByType = allIndicators.reduce((acc, indicator) => {
    acc[indicator.type] = (acc[indicator.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const resultsByToolChartData = Object.entries(resultsByTool).map(([name, value]) => ({ name, value }));
  const indicatorsByTypeChartData = Object.entries(indicatorsByType).map(([name, value]) => ({ name, value }));

  const statusColors: Record<string, string> = {
    PENDING: 'text-yellow-500',
    IN_PROGRESS: 'text-blue-500',
    COMPLETED: 'text-green-500',
    FAILED: 'text-red-500',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statistiques Générales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 border rounded-lg">
            <p className="text-4xl font-bold">{totalInvestigations}</p>
            <p className="text-sm text-muted-foreground">Investigations totales</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-4xl font-bold">{totalResults}</p>
            <p className="text-sm text-muted-foreground">Résultats trouvés</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>État des Investigations</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(investigationStatus).map(([status, count]) => (
            <div key={status} className="text-center">
              <p className={`text-3xl font-bold ${statusColors[status] || 'text-gray-500'}`}>{count}</p>
              <p className="text-sm text-muted-foreground">{status}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résultats par Outil</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resultsByToolChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Résultats" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Répartition par Type d'Indicateur</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={indicatorsByTypeChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => (percent ? `${name} ${(percent * 100).toFixed(0)}%` : name)}
              >
                {indicatorsByTypeChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}