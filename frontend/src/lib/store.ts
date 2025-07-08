import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SearchTask, SearchResults, NotificationState, AppState } from '@/types';
import { generateId } from './utils';

interface AppStore extends AppState {
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
  addNotification: (notification: Omit<NotificationState, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setLoading: (loading: boolean) => void;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      activeSearches: [],
      searchResults: null,
      allResults: null,
      searchLogs: [],
      notifications: [],
      isLoading: false,
      darkMode: true,
      personFilter: null,
      emailFilter: null,
      categoryFilter: null,
      platformFilter: null,
      searchProgress: 0,

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
      addNotification: (notification) => {
        const id = generateId();
        const newNotification = { ...notification, id };
        set((state) => ({ notifications: [...state.notifications, newNotification] }));
        if (notification.duration && notification.duration > 0) {
          setTimeout(() => get().removeNotification(id), notification.duration);
        }
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),
      setLoading: (loading) => set({ isLoading: loading }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'turbolehe-store',
      partialize: (state) => ({
        darkMode: state.darkMode,
        allResults: state.allResults,
        emailFilter: state.emailFilter,
        categoryFilter: state.categoryFilter,
      }),
    }
  )
);

// Sélecteurs
export const useAllResults = () => useAppStore((state) => state.allResults);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useEmailFilter = () => useAppStore((state) => state.emailFilter);
export const useCategoryFilter = () => useAppStore((state) => state.categoryFilter);
export const useAppActions = () => useAppStore((state) => ({
  setEmailFilter: state.setEmailFilter,
  setCategoryFilter: state.setCategoryFilter,
  setPlatformFilter: state.setPlatformFilter,
  setPersonFilter: state.setPersonFilter,
}));

export const useSearchLogs = () => useAppStore((state) => state.searchLogs);
export const useSearchProgress = () => useAppStore((state) => state.searchProgress);
export const usePlatformFilter = () => useAppStore((state) => state.platformFilter);