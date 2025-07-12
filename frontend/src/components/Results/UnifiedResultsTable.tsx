"use client";

import { useMemo } from 'react';
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getItemIcon, ItemType } from "@/lib/icons";
import { getCategoryColorClass } from '@/lib/utils';
import { OpenInNew } from '@mui/icons-material';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

// Définir le type pour un item de preuve standardisé
export interface ProofItem {
  type: ItemType | string;
  value: string;
  category: string;
  sourceTool: string;
  details: object;
  link?: string;
  timestamp: string; // Ajout du timestamp
}

interface UnifiedResultsTableProps {
  items: ProofItem[];
}

export const UnifiedResultsTable = ({ items }: UnifiedResultsTableProps) => {

  const columns: ColumnDef<ProofItem>[] = useMemo(() => [
    {
      accessorKey: 'type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" tooltip="Le type de donnée trouvé (ex: email, pseudo)." />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getItemIcon(row.original.type)}
          <span className="font-mono text-xs">{row.original.type}</span>
        </div>
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      size: 150,
    },
    {
      accessorKey: 'value',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Valeur" tooltip="La donnée brute qui a été découverte." />,
      cell: ({ row }) => (
        <div className="font-medium break-all">
          {row.original.value}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Catégorie" tooltip="La nature de la découverte (ex: Compte en ligne, Fuite de données)." />,
      cell: ({ row }) => {
        const category = row.original.category || 'Inconnue';
        return <Badge variant="outline" className={getCategoryColorClass(category)}>{category}</Badge>;
      },
      size: 150,
    },
    {
      accessorKey: 'sourceTool',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Source" tooltip="L'outil OSINT qui a trouvé cette information." />,
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.sourceTool}</Badge>
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      size: 120,
    },
    {
      accessorKey: 'timestamp',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" tooltip="La date et l'heure auxquelles l'information a été découverte." />,
      cell: ({ row }) => {
        const date = new Date(row.original.timestamp);
        return <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>;
      },
      size: 180,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        if (row.original.link) {
          return (
            <Button variant="ghost" size="sm" asChild>
              <a href={row.original.link} target="_blank" rel="noopener noreferrer">
                <OpenInNew className="h-4 w-4" />
              </a>
            </Button>
          );
        }
        return null;
      },
      size: 80,
    }
  ], []);

  const uniqueSources = useMemo(() => {
    const sources = new Set(items.map(item => item.sourceTool));
    return Array.from(sources).map(source => ({ label: source, value: source }));
  }, [items]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(items.map(item => item.type as string));
    return Array.from(types).map(type => ({ label: type, value: type, icon: getItemIcon(type) }));
  }, [items]);


  return (
    <DataTable
      columns={columns}
      data={items}
      showPagination={true}
      filterColumnId="value"
      filterPlaceholder="Filtrer par valeur..."
      facetedFilterColumns={[
        {
          id: 'sourceTool',
          title: 'Source',
          options: uniqueSources,
        },
        {
          id: 'type',
          title: 'Type',
          options: uniqueTypes,
        }
      ]}
    />
  );
};