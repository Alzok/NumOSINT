'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import { InvestigationsOverTimeData } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvestigationsChart() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [data, setData] = useState<InvestigationsOverTimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      };
      setLoading(true);
      const response = await api.getInvestigationsOverTime(token);
      if (response.data) {
        setData(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch chart data.');
      }
      setLoading(false);
    };

    fetchData();
  }, [token]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution des Investigations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investigations Créées par Jour</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Investigations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}