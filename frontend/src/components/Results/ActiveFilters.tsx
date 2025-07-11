'use client';

import { useEmailFilter, useCategoryFilter, useAppActions } from '@/lib/store';
import { getCategoryColorClass } from '@/lib/utils';
import { Close } from '@mui/icons-material';

const ActiveFilters = () => {
  const emailFilter = useEmailFilter();
  const categoryFilter = useCategoryFilter();
  const { setEmailFilter, setCategoryFilter } = useAppActions();

  const hasFilters = emailFilter || categoryFilter;

  if (!hasFilters) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-muted/50 rounded-lg flex items-center gap-4">
      <h4 className="text-sm font-semibold">Filtres actifs:</h4>
      <div className="flex items-center gap-2">
        {emailFilter && (
          <span className="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
            Email: {emailFilter}
            <button onClick={() => setEmailFilter(null)} className="ml-1">
              <Close className="h-3 w-3" />
            </button>
          </span>
        )}
        {categoryFilter && (
          <span className={`inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium ${getCategoryColorClass(categoryFilter)}`}>
            Catégorie: {categoryFilter}
            <button onClick={() => setCategoryFilter(null)} className="ml-1">
              <Close className="h-3 w-3" />
            </button>
          </span>
        )}
      </div>
    </div>
  );
};

export default ActiveFilters;