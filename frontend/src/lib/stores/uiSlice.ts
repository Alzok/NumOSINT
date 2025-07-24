import { StateCreator } from 'zustand';
import { useAppStore } from '../store';

export interface UiSlice {
  isLoading: boolean;
  darkMode: boolean;
  isSearchLogExpanded: boolean;
  tokenAnimation: number;
  setLoading: (loading: boolean) => void;
  toggleDarkMode: () => void;
  setIsSearchLogExpanded: (isExpanded: boolean) => void;
  triggerTokenAnimation: () => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  isLoading: false,
  darkMode: true,
  isSearchLogExpanded: false,
  tokenAnimation: 0,
  setLoading: (loading) => set({ isLoading: loading }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setIsSearchLogExpanded: (isExpanded) => set({ isSearchLogExpanded: isExpanded }),
  triggerTokenAnimation: () => set((state) => ({ tokenAnimation: state.tokenAnimation + 1 })),
});

export const useIsLoading = () => useAppStore((state) => state.isLoading);