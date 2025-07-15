import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createNotificationSlice, NotificationSlice } from './stores/notificationSlice';
import { createSearchSlice, SearchSlice } from './stores/searchSlice';
import { createUiSlice, UiSlice } from './stores/uiSlice';
import { createFormSlice, FormSlice } from './stores/formSlice';

export interface AppStore extends NotificationSlice, SearchSlice, UiSlice, FormSlice {}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get, api) => ({
      ...createNotificationSlice(set, get, api),
      ...createSearchSlice(set, get, api),
      ...createUiSlice(set, get, api),
      ...createFormSlice(set, get, api),
    }),
    {
      name: 'turbolehe-store',
      partialize: (state) => ({
        darkMode: state.darkMode,
        allResults: state.allResults,
        emailFilter: state.emailFilter,
        categoryFilter: state.categoryFilter,
        investigationForm: state.investigationForm,
      }),
    }
  )
);