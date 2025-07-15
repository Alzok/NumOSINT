import { StateCreator } from 'zustand';
import { SearchTask, SearchResults } from '@/types';
import { useAppStore } from '../store';

export interface SearchSlice {
  activeSearches: SearchTask[];
  searchResults: SearchResults | null;
  allResults: SearchResults | null;
  searchLogs: string[];
  searchProgress: number;
  personFilter: string | null;
  emailFilter: string | null;
  categoryFilter: string | null;
  platformFilter: string | null;
  isSearchLogExpanded: boolean;
  addActiveSearch: (search: SearchTask) => void;
  updateSearchStatus: (taskId: string, updates: Partial<SearchTask>) => void;
  removeActiveSearch: (taskId: string) => void;
  clearActiveSearches: () => void;
  clearCompletedSearches: () => void;
  setSearchResults: (results: SearchResults) => void;
  setAllResults: (results: SearchResults | null) => void;
  clearSearchResults: () => void;
  addSearchLog: (log: string) => void;
  clearSearchLogs: () => void;
  setSearchProgress: (progress: number) => void;
  setPersonFilter: (personId: string | null) => void;
  setEmailFilter: (email: string | null) => void;
  setCategoryFilter: (category: string | null) => void;
  setPlatformFilter: (platform: string | null) => void;
  setIsSearchLogExpanded: (isExpanded: boolean) => void;
}

export const createSearchSlice: StateCreator<SearchSlice, [], [], SearchSlice> = (set) => ({
  activeSearches: [],
  searchResults: null,
  allResults: null,
  searchLogs: [],
  searchProgress: 0,
  personFilter: null,
  emailFilter: null,
  categoryFilter: null,
  platformFilter: null,
  isSearchLogExpanded: false,
  addActiveSearch: (search) => set((state) => ({ activeSearches: [...state.activeSearches, search] })),
  updateSearchStatus: (taskId, updates) =>
    set((state) => ({
      activeSearches: state.activeSearches.map((search) =>
        search.task_id === taskId ? { ...search, ...updates } : search
      ),
    })),
  removeActiveSearch: (taskId) =>
    set((state) => ({
      activeSearches: state.activeSearches.filter((search) => search.task_id !== taskId),
    })),
  clearActiveSearches: () => set({ activeSearches: [] }),
  clearCompletedSearches: () => set((state) => ({
    activeSearches: state.activeSearches.filter(s => s.status === 'started' || s.status === 'running')
  })),
  setSearchResults: (results) => set({ searchResults: results }),
  setAllResults: (results) => set({ allResults: results }),
  clearSearchResults: () => set({ searchResults: null, allResults: null }),
  addSearchLog: (log) => set((state) => ({ searchLogs: [...state.searchLogs, log] })),
  clearSearchLogs: () => set({ searchLogs: [], searchProgress: 0 }),
  setSearchProgress: (progress) => set({ searchProgress: progress }),
  setPersonFilter: (personId) => set({ personFilter: personId }),
  setEmailFilter: (email) => set({ emailFilter: email }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setPlatformFilter: (platform) => set({ platformFilter: platform }),
  setIsSearchLogExpanded: (isExpanded) => set({ isSearchLogExpanded: isExpanded }),
});

export const useAllResults = () => useAppStore((state) => state.allResults);
export const useEmailFilter = () => useAppStore((state) => state.emailFilter);
export const useCategoryFilter = () => useAppStore((state) => state.categoryFilter);
export const usePlatformFilter = () => useAppStore((state) => state.platformFilter);
export const useSearchLogs = () => useAppStore((state) => state.searchLogs);
export const useSearchProgress = () => useAppStore((state) => state.searchProgress);

export const useAppActions = () => useAppStore((state) => ({
  setPersonFilter: state.setPersonFilter,
  setEmailFilter: state.setEmailFilter,
  setCategoryFilter: state.setCategoryFilter,
  setPlatformFilter: state.setPlatformFilter,
}));