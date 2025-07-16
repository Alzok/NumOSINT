import { StateCreator } from 'zustand';
import { AppStore } from '../store';

export interface DashboardFilters {
  date: string | null;
  period: '7d' | '30d' | '90d';
}

export interface DashboardSlice {
  dashboardFilters: DashboardFilters;
  setDashboardDateFilter: (date: string | null) => void;
  setDashboardPeriodFilter: (period: '7d' | '30d' | '90d') => void;
}

export const createDashboardSlice: StateCreator<AppStore, [], [], DashboardSlice> = (set) => ({
  dashboardFilters: {
    date: null,
    period: '30d',
  },
  setDashboardDateFilter: (date) =>
    set((state) => ({
      dashboardFilters: { ...state.dashboardFilters, date },
    })),
  setDashboardPeriodFilter: (period) =>
    set((state) => ({
      dashboardFilters: { ...state.dashboardFilters, period },
    })),
});