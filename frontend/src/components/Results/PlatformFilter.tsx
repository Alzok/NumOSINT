'use client';

import { useMemo } from 'react';
import { useAllResults, usePlatformFilter, useEmailFilter, useCategoryFilter, useAppActions } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const PlatformFilter = () => {
  const allResults = useAllResults();
  const platformFilter = usePlatformFilter();
  const { setPlatformFilter } = useAppActions();

  const emailFilter = useEmailFilter();
  const categoryFilter = useCategoryFilter();

  const uniquePlatforms = useMemo(() => {
    if (!allResults) return [];
    let accounts = allResults.persons.flatMap(p => p.emails.flatMap(e => e.accounts.map(a => ({...a, email: e.email}))));

    if (emailFilter) {
      accounts = accounts.filter(a => a.email === emailFilter);
    }
    if (categoryFilter) {
      accounts = accounts.filter(a => a.category === categoryFilter);
    }

    const platforms = accounts.map(a => a.platform);
    return Array.from(new Set(platforms));
  }, [allResults, emailFilter, categoryFilter]);

  if (uniquePlatforms.length === 0) {
    return null;
  }

  return (
    <Select
      value={platformFilter || 'all'}
      onValueChange={(value) => setPlatformFilter(value === 'all' ? null : value)}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filtrer par plateforme..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Toutes les plateformes</SelectItem>
        {uniquePlatforms.map(platform => (
          <SelectItem key={platform} value={platform}>{platform}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PlatformFilter;