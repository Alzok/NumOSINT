import { StateCreator } from 'zustand';
import { useAppStore } from '../store';

export interface UiSlice {
  isLoading: boolean;
  darkMode: boolean;
  isSearchLogExpanded: boolean;
  setLoading: (loading: boolean) => void;
  toggleDarkMode: () => void;
  setIsSearchLogExpanded: (isExpanded: boolean) => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  isLoading: false,
  darkMode: true,
  isSearchLogExpanded: false,
  setLoading: (loading) => set({ isLoading: loading }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setIsSearchLogExpanded: (isExpanded) => set({ isSearchLogExpanded: isExpanded }),
});

export const useIsLoading = () => useAppStore((state) => state.isLoading);