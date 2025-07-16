'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { CreditHistoryTable } from '@/components/Billing/CreditHistoryTable';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditTransaction } from '@/types';

const BillingPage = () => {
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
      <h1 className="text-2xl font-bold">Facturation</h1>
      
      <Card>
          <CardHeader>
              <CardTitle>Acheter des crédits</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center p-12">
              <Coins className="w-16 h-16 mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Bientôt disponible</h3>
              <p className="text-muted-foreground">
                  La possibilité d'acheter des crédits sera bientôt disponible.
              </p>
          </CardContent>
      </Card>

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

export default BillingPage;