"use client"

import { useMemo } from 'react';
import { PersonResult } from '@/types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useAppActions } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CATEGORY_COLORS } from '@/lib/utils';

const CategoryPieChart = ({ data }: { data: { name: string, value: number }[] }) => {
  const { setCategoryFilter } = useAppActions();
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} onClick={(d) => setCategoryFilter(d.name)}>
          {data.map((entry) => <Cell key={`cell-${entry.name}`} fill={CATEGORY_COLORS[entry.name]?.base || CATEGORY_COLORS['Other'].base} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

const PlatformBarChart = ({ data }: { data: { name: string, value: number }[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data}>
      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
      <Tooltip />
      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

const MethodRadarChart = ({ data }: { data: { subject: string, A: number }[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
      <PolarGrid />
      <PolarAngleAxis dataKey="subject" />
      <Radar dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
    </RadarChart>
  </ResponsiveContainer>
);

const GlobalStats = ({ persons }: { persons: PersonResult[] }) => {
  const { categoryData, platformData, methodData } = useMemo(() => {
    const allAccounts = persons.flatMap(p => p.emails.flatMap(e => e.accounts));

    const statsByCategory = allAccounts.reduce((acc, account) => {
      const category = account.category || 'Other';
      if (!acc[category]) acc[category] = { count: 0 };
      acc[category].count++;
      return acc;
    }, {} as Record<string, { count: number }>);
    const categoryData = Object.entries(statsByCategory).map(([name, data]: [string, {count: number}]) => ({ name, value: data.count })).sort((a, b) => b.value - a.value);

    const topPlatforms = allAccounts.reduce((acc, account) => {
      acc[account.platform] = (acc[account.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const platformData = Object.entries(topPlatforms).sort(([, a]: [string, number], [, b]: [string, number]) => b - a).slice(0, 5).map(([name, value]) => ({ name, value }));

    const statsByMethod = allAccounts.reduce((acc, account) => {
      const method = account.method || 'Unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const methodData = Object.entries(statsByMethod).map(([subject, A]) => ({ subject, A }));

    return { categoryData, platformData, methodData };
  }, [persons]);

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Catégorie</CardTitle>
          <CardDescription>Cliquez sur une section pour filtrer le tableau.</CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <CategoryPieChart data={categoryData} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Plateformes</CardTitle>
          <CardDescription>Les plateformes avec le plus de comptes trouvés.</CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformBarChart data={platformData} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Méthodes de Détection</CardTitle>
          <CardDescription>Répartition des méthodes de découverte.</CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <MethodRadarChart data={methodData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalStats;