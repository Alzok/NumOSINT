'use client';

import { useMemo } from 'react';
import { useAllResults, useEmailFilter, useCategoryFilter, usePlatformFilter, useAppActions } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const EmailFilter = () => {
  const allResults = useAllResults();
  const emailFilter = useEmailFilter();
  const { setEmailFilter } = useAppActions();

  const categoryFilter = useCategoryFilter();
  const platformFilter = usePlatformFilter();

  const uniqueEmails = useMemo(() => {
    if (!allResults) return [];
    let accounts = allResults.persons.flatMap(p => p.emails.flatMap(e => e.accounts.map(a => ({...a, email: e.email}))));

    if (categoryFilter) {
      accounts = accounts.filter(a => a.category === categoryFilter);
    }
    if (platformFilter) {
      accounts = accounts.filter(a => a.platform === platformFilter);
    }

    const emails = accounts.map(a => a.email);
    return Array.from(new Set(emails));
  }, [allResults, categoryFilter, platformFilter]);

  if (uniqueEmails.length === 0) {
    return null;
  }

  return (
    <Select
      value={emailFilter || 'all'}
      onValueChange={(value) => setEmailFilter(value === 'all' ? null : value)}
    >
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Filtrer par email..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tous les emails</SelectItem>
        {uniqueEmails.map(email => (
          <SelectItem key={email} value={email}>{email}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default EmailFilter;