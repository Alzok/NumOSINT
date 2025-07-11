"use client"

import { useMemo, useState, useEffect } from 'react';
import { ColumnDef, ExpandedState } from "@tanstack/react-table"
import { MoreHoriz, ExpandMore, ChevronRight } from "@mui/icons-material"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import React from 'react';
import { PersonResult, EmailResult, Account } from "@/types"
import { useEmailFilter, useCategoryFilter, usePlatformFilter, useAppActions, useAllResults } from '@/lib/store';
import ActiveFilters from './ActiveFilters';
import EmailFilter from './EmailFilter';
import CategoryFilter from './CategoryFilter';
import PlatformFilter from './PlatformFilter';
import { getCategoryColorClass } from '@/lib/utils';

interface AccountsTableProps {
  persons: PersonResult[];
}

// This component will render the sub-table for accounts
const AccountsSubTable = ({ emails }: { emails: EmailResult[] }) => {
  const emailFilter = useEmailFilter();
  const categoryFilter = useCategoryFilter();
  const platformFilter = usePlatformFilter();

  // Flatten the accounts from all emails into a single array
  const allAccountsRaw = useMemo(() => {
    return emails.flatMap(emailResult =>
      emailResult.accounts.map(account => ({
        ...account,
        email: emailResult.email,
      }))
    );
  }, [emails]);

  // Filter the flattened accounts
  const filteredAccounts = useMemo(() => {
    return allAccountsRaw.filter(account => {
      const emailMatch = emailFilter ? account.email === emailFilter : true;
      const categoryMatch = categoryFilter ? account.category === categoryFilter : true;
      const platformMatch = platformFilter ? account.platform === platformFilter : true;
      return emailMatch && categoryMatch && platformMatch;
    });
  }, [allAccountsRaw, emailFilter, categoryFilter, platformFilter]);

  // Define columns for the accounts sub-table
  const accountColumns: ColumnDef<Account & { email: string }>[] = [
    {
      accessorKey: 'email',
      header: 'Email Associé',
    },
    {
      accessorKey: 'platform',
      header: 'Plateforme',
      cell: ({ row }) => (
        <a href={row.original.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
          {row.original.platform}
        </a>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Catégorie',
      cell: ({ row }) => {
        const category = row.original.category || 'Other';
        return <Badge variant="outline" className={getCategoryColorClass(category)}>{category}</Badge>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const isActive = row.original.status === 'active';
        return <Badge variant={isActive ? 'default' : 'secondary'}>{isActive ? 'Actif' : 'Inactif'}</Badge>;
      },
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 my-4">
        <EmailFilter />
        <CategoryFilter />
        <PlatformFilter />
      </div>
      <ActiveFilters />
      <DataTable columns={accountColumns} data={filteredAccounts} showPagination={true} />
    </div>
  );
};


export const columns: ColumnDef<PersonResult>[] = [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <button
          {...{
            onClick: row.getToggleExpandedHandler(),
            style: { cursor: 'pointer' },
          }}
        >
          {row.getIsExpanded() ? <ExpandMore /> : <ChevronRight />}
        </button>
      ) : null;
    },
  },
  {
    id: "fullName",
    header: "Nom",
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ row }) => {
      const person = row.original;
      return `${person.firstName} ${person.lastName}`;
    }
  },
  {
    accessorKey: "emails",
    header: "Emails",
    cell: ({ row }) => {
      const person = row.original;
      return <Badge variant="secondary">{person.emails.length}</Badge>;
    }
  },
  {
    id: "totalAccounts",
    header: "Comptes",
    cell: ({ row }) => {
      const person = row.original;
      const total = person.emails.reduce((sum, email) => sum + email.accounts.length, 0);
      return <Badge variant="default">{total}</Badge>;
    }
  },
]

const AccountsTable = ({ persons }: AccountsTableProps) => {
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    if (persons && persons.length > 0) {
      setExpanded({ '0': true }); // Expand the first row by default
    }
  }, [persons]);

  const renderSubComponent = ({ row }: { row: any }) => {
    return (
      <div style={{ padding: '1rem', paddingLeft: '3rem', backgroundColor: 'hsl(var(--muted) / 0.5)' }}>
        <AccountsSubTable emails={row.original.emails} />
      </div>
    );
  };

  const toggleAllRows = (expand: boolean) => {
    const allRowsExpanded: ExpandedState = {};
    if (expand) {
      persons.forEach((_, index) => {
        allRowsExpanded[index] = true;
      });
    }
    setExpanded(allRowsExpanded);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Résultats Détaillés</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => toggleAllRows(true)}>Tout déplier</Button>
            <Button variant="outline" size="sm" onClick={() => toggleAllRows(false)}>Tout replier</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={persons}
          getRowCanExpand={() => true}
          renderSubComponent={renderSubComponent}
          filterColumnId="fullName"
          filterPlaceholder="Filtrer par nom..."
          expanded={expanded}
          onExpandedChange={setExpanded}
          showPagination={false}
        />
      </CardContent>
    </Card>
  );
};

export default AccountsTable;