'use client';

import { useMemo } from 'react';
import { useAllResults, useCategoryFilter, useEmailFilter, usePlatformFilter, useAppActions } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { CATEGORY_COLORS } from '@/lib/utils';

const CategoryFilter = () => {
  const allResults = useAllResults();
  const categoryFilter = useCategoryFilter();
  const { setCategoryFilter } = useAppActions();

  const emailFilter = useEmailFilter();
  const platformFilter = usePlatformFilter();

  const uniqueCategories = useMemo(() => {
    if (!allResults) return [];
    let accounts = allResults.persons.flatMap(p => p.emails.flatMap(e => e.accounts.map(a => ({...a, email: e.email}))));

    if (emailFilter) {
      accounts = accounts.filter(a => a.email === emailFilter);
    }
    if (platformFilter) {
      accounts = accounts.filter(a => a.platform === platformFilter);
    }

    const categories = accounts.map(a => a.category || 'Other');
    return Array.from(new Set(categories)).sort((a, b) => {
      if (a === 'Adult') return -1;
      if (b === 'Adult') return 1;
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });
  }, [allResults, emailFilter, platformFilter]);

  if (uniqueCategories.length === 0) {
    return null;
  }

  return (
    <Select
      value={categoryFilter || 'all'}
      onValueChange={(value) => setCategoryFilter(value === 'all' ? null : value)}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filtrer par catégorie..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Toutes les catégories</SelectItem>
        {uniqueCategories.map(category => (
          <SelectItem key={category} value={category}>{category}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CategoryFilter;