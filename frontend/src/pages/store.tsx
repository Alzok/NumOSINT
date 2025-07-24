'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CreditHistoryTable } from '@/components/Billing/CreditHistoryTable';
import PurchaseSection from '@/components/Billing/PurchaseSection';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditTransaction } from '@/types';

const StorePage = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getBillingHistory(token).then(response => {
        if (response.data) {
          setTransactions(response.data);
        }
        setLoading(false);
      });
    }
  }, [token]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Boutique</h1>
      
      <PurchaseSection />

      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <CreditHistoryTable transactions={transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StorePage;