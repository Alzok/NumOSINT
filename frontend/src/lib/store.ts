import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SearchTask, SearchResults, ToastNotification, AppNotification, AppState, InvestigationFormState, InputField } from '@/types';
import { generateId } from './utils';

const initialFormField = { id: 1, value: '' };
const initialFormState: InvestigationFormState = {
    names: [initialFormField],
    emails: [initialFormField],
    usernames: [initialFormField],
    phones: [initialFormField],
    ips: [initialFormField],
    domains: [initialFormField],
    urls: [initialFormField],
    maxGeneration: 3,
    minConfidence: 0.7,
};

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
  addToastNotification: (notification: Omit<ToastNotification, 'id'>) => void;
  removeToastNotification: (id: string) => void;
  clearToastNotifications: () => void;
  setAppNotifications: (notifications: AppNotification[]) => void;
  addAppNotification: (notification: AppNotification) => void;
  markAppNotificationsAsRead: (ids: string[]) => void;
  markAllAppNotificationsAsRead: () => void;
  setLoading: (loading: boolean) => void;
  toggleDarkMode: () => void;
  isSearchLogExpanded: boolean;
  setIsSearchLogExpanded: (isExpanded: boolean) => void;
  // Form state actions
  setInvestigationFormField: (type: keyof Omit<InvestigationFormState, 'maxGeneration' | 'minConfidence'>, id: number, value: string) => void;
  addInvestigationFormField: (type: keyof Omit<InvestigationFormState, 'maxGeneration' | 'minConfidence'>) => void;
  removeInvestigationFormField: (type: keyof Omit<InvestigationFormState, 'maxGeneration' | 'minConfidence'>, id: number) => void;
  setInvestigationFormOptions: (options: { maxGeneration?: number; minConfidence?: number }) => void;
  resetInvestigationForm: () => void;
  setInvestigationForm: (formState: InvestigationFormState) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      activeSearches: [],
      searchResults: null,
      allResults: null,
      searchLogs: [],
      toastNotifications: [],
      appNotifications: [],
      isLoading: false,
      darkMode: true,
      personFilter: null,
      emailFilter: null,
      categoryFilter: null,
      platformFilter: null,
      searchProgress: 0,
      isSearchLogExpanded: false,
      investigationForm: initialFormState,

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
      addToastNotification: (notification) => {
        const id = generateId();
        const newNotification = { ...notification, id };
        set((state) => ({ toastNotifications: [newNotification, ...state.toastNotifications] }));
        if (notification.duration && notification.duration > 0) {
          setTimeout(() => get().removeToastNotification(id), notification.duration);
        }
      },
      removeToastNotification: (id) =>
        set((state) => ({
          toastNotifications: state.toastNotifications.filter((n) => n.id !== id),
        })),
      clearToastNotifications: () => set({ toastNotifications: [] }),
      
      setAppNotifications: (notifications) => set({ appNotifications: notifications }),
      addAppNotification: (notification) => set((state) => ({
        appNotifications: [notification, ...state.appNotifications]
      })),
      markAppNotificationsAsRead: (ids) => set((state) => ({
        appNotifications: state.appNotifications.map((n) =>
          ids.includes(n.id) ? { ...n, read: true } : n
        ),
      })),
      markAllAppNotificationsAsRead: () => set((state) => ({
        appNotifications: state.appNotifications.map((n) => ({ ...n, read: true })),
      })),

      setLoading: (loading) => set({ isLoading: loading }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setIsSearchLogExpanded: (isExpanded) => set({ isSearchLogExpanded: isExpanded }),
      
      // Form state implementation
      setInvestigationFormField: (type, id, value) => set(state => ({
        investigationForm: {
            ...state.investigationForm,
            [type]: state.investigationForm[type].map(field => field.id === id ? { ...field, value } : field)
        }
      })),
      addInvestigationFormField: (type) => set(state => ({
        investigationForm: {
            ...state.investigationForm,
            [type]: [...state.investigationForm[type], { id: Date.now(), value: '' }]
        }
      })),
      removeInvestigationFormField: (type, id) => set(state => ({
        investigationForm: {
            ...state.investigationForm,
            [type]: state.investigationForm[type].filter(field => field.id !== id)
        }
      })),
      setInvestigationFormOptions: (options) => set(state => ({
        investigationForm: {
            ...state.investigationForm,
            ...options
        }
      })),
      resetInvestigationForm: () => set({ investigationForm: initialFormState }),
      setInvestigationForm: (formState) => set({ investigationForm: formState }),
    }),
    {
      name: 'turbolehe-store',
      partialize: (state) => ({
        darkMode: state.darkMode,
        allResults: state.allResults,
        emailFilter: state.emailFilter,
        categoryFilter: state.categoryFilter,
        investigationForm: state.investigationForm, // Persist form state
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