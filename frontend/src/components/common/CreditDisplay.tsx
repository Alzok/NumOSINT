'use client';

import { Coins } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CreditDisplayProps {
  credits: number | undefined | null;
  isLoading?: boolean;
}

export function CreditDisplay({ credits, isLoading }: CreditDisplayProps) {
  if (isLoading) {
    return <Skeleton className="h-8 w-20 rounded-md" />;
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-secondary/50 px-3 py-1.5 text-sm font-semibold">
      <Coins className="h-5 w-5 text-yellow-500" />
      <span>{credits ?? 0}</span>
      <span className="hidden sm:inline">Crédits</span>
    </div>
  );
}