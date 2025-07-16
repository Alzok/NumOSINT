'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { InvestigationsOverTimeData } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvestigationsChart() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [data, setData] = useState<InvestigationsOverTimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dashboardFilters, setDashboardDateFilter, setDashboardPeriodFilter } = useAppStore();
  const { period, date: selectedDate } = dashboardFilters;

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      };
      setLoading(true);
      const response = await api.getInvestigationsOverTime({ period }, token);
      if (response.data) {
        setData(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch chart data.');
      }
      setLoading(false);
    };

    fetchData();
  }, [token, period]);

  const handleBarClick = (payload: any) => {
    if (payload && payload.activePayload && payload.activePayload.length > 0) {
      const date = payload.activePayload[0].payload.date;
      // Toggle functionality: if clicking the same date, clear the filter
      setDashboardDateFilter(selectedDate === date ? null : date);
    }
  };

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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Investigations Créées par Jour</CardTitle>
        <Select value={period} onValueChange={(p) => setDashboardPeriodFilter(p as '7d' | '30d' | '90d')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="90d">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Investigations" style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}