import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createNotificationSlice, NotificationSlice } from './stores/notificationSlice';
import { createSearchSlice, SearchSlice } from './stores/searchSlice';
import { createUiSlice, UiSlice } from './stores/uiSlice';
import { createFormSlice, FormSlice } from './stores/formSlice';
import { createDashboardSlice, DashboardSlice } from './stores/dashboardSlice';
import { createAuthSlice, AuthSlice } from './stores/authSlice';
import { FormIndicator, IndicatorType } from '@/types';

export interface AppStore extends NotificationSlice, SearchSlice, UiSlice, FormSlice, DashboardSlice, AuthSlice {}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get, api) => ({
      ...createNotificationSlice(set, get, api),
      ...createSearchSlice(set, get, api),
      ...createUiSlice(set, get, api),
      ...createFormSlice(set, get, api),
      ...createDashboardSlice(set, get, api),
      ...createAuthSlice(set, get, api),
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
      version: 1, // Bump version to trigger migration
      migrate: (persistedState: any, version) => {
        if (version === 0) {
          const oldFormState = persistedState.investigationForm;
          if (oldFormState && !oldFormState.indicators) {
            const newIndicators: FormIndicator[] = [];
            let idCounter = Date.now();
            const indicatorTypes: string[] = ['names', 'emails', 'usernames', 'phones', 'ips', 'domains', 'urls'];
            
            indicatorTypes.forEach(type => {
              if (oldFormState[type] && Array.isArray(oldFormState[type])) {
                oldFormState[type].forEach((field: { value: string }) => {
                  if (field.value) {
                    newIndicators.push({
                      id: idCounter++,
                      type: (type as string).slice(0, -1).toUpperCase() as IndicatorType,
                      value: field.value
                    });
                  }
                });
              }
            });

            if (newIndicators.length === 0) {
              newIndicators.push({ id: idCounter, type: 'NAME', value: '' });
            }

            persistedState.investigationForm = {
              ...oldFormState,
              indicators: newIndicators,
            };
            
            indicatorTypes.forEach(type => delete persistedState.investigationForm[type]);
          }
        }
        return persistedState;
      },
    }
  )
);