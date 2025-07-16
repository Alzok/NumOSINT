'use client';

import { useMemo } from 'react';
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  amount: number;
  type: 'INITIAL_GRANT' | 'INVESTIGATION_COST' | 'PURCHASE';
  createdAt: string;
  investigation?: {
    id: string;
    name: string;
  };
}

interface CreditHistoryTableProps {
  transactions: Transaction[];
}

const transactionTypeMapping = {
  INITIAL_GRANT: 'Crédits initiaux',
  INVESTIGATION_COST: 'Coût d\'investigation',
  PURCHASE: 'Achat de crédits',
};

export const CreditHistoryTable = ({ transactions }: CreditHistoryTableProps) => {
  const columns: ColumnDef<Transaction>[] = useMemo(() => [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const isDebit = row.original.amount < 0;
        return (
          <div className="flex items-center gap-2">
            {isDebit ? <ArrowDownCircle className="h-4 w-4 text-red-500" /> : <ArrowUpCircle className="h-4 w-4 text-green-500" />}
            <span>{transactionTypeMapping[row.original.type] || row.original.type}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Montant',
      cell: ({ row }) => {
        const isDebit = row.original.amount < 0;
        return <span className={isDebit ? 'text-red-500' : 'text-green-500'}>{row.original.amount}</span>;
      },
    },
    {
      accessorKey: 'investigation',
      header: 'Détails',
      cell: ({ row }) => {
        if (row.original.investigation) {
          return <Link href={`/investigation/${row.original.investigation.id}`} className="underline hover:text-primary">{row.original.investigation.name}</Link>;
        }
        return <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
  ], []);

  return <DataTable columns={columns} data={transactions} />;
};