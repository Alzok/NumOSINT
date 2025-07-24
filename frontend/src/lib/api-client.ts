import { InvestigationInput, Investigation, Indicator, Result, InvestigationLog, Case, AppNotification as Notification } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

async function fetcher<T>(url: string, options: RequestInit = {}, token?: string | null): Promise<{ data: T | null, error: string | null }> {
  try {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && options.body) {
      headers.append('Content-Type', 'application/json');
    }

    const res = await fetch(`${API_URL}${url}`, { ...options, headers });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'An unknown error occurred' }));
      return { data: null, error: errorData.message || res.statusText };
    }
    
    if (res.status === 204) { // No Content
      return { data: null, error: null };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Network error' };
  }
}

export const api = {
  // Auth
  login: (email: string, password: string) => fetcher<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  // Investigations
  createInvestigation: (data: InvestigationInput, token?: string | null) => fetcher<Investigation>('/api/investigations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }, token),
  getInvestigationCost: (indicators: { type: string, value: string }[], options: { maxGeneration?: number, minConfidence?: number }, userId: string, token?: string | null) => fetcher<{ cost: number; details: any; hasEnoughCredits: boolean; userCredits: number }>('/api/investigations/cost', {
    method: 'POST',
    body: JSON.stringify({ indicators, options, userId }),
  }, token),
  getInvestigations: (params: { limit?: number; sortBy?: string; sortOrder?: string; status?: string; date?: string } = {}, token?: string | null) => {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params.status) query.append('status', params.status);
    if (params.date) query.append('date', params.date);
    return fetcher<{ data: Investigation[], pagination: any }>(`/api/investigations?${query.toString()}`, {}, token);
  },
  getInvestigation: (id: string, token?: string | null) => fetcher<Investigation>(`/api/investigations/${id}`, {}, token),
  startInvestigation: (id: string, token?: string | null) => fetcher<{ message: string }>(`/api/investigations/${id}/start`, { method: 'POST' }, token),
  stopInvestigation: (id: string, token?: string | null) => fetcher<{ message: string }>(`/api/investigations/${id}/stop`, { method: 'POST' }, token),
  deleteInvestigation: (id: string, token?: string | null) => fetcher<{ message: string }>(`/api/investigations/${id}`, { method: 'DELETE' }, token),
  getResults: (id: string, token?: string | null) => fetcher<Result[]>(`/api/investigations/${id}/results`, {}, token),
  getGroupedResults: (params: any, token?: string | null) => fetcher<any>(`/api/results/grouped?${new URLSearchParams(params)}`, {}, token),
  getLogs: (id: string, token?: string | null) => fetcher<{ logs: InvestigationLog[] }>(`/api/investigations/${id}/logs`, {}, token),
  getInvestigationGraph: (id: string, token?: string | null) => fetcher<{ nodes: any[], edges: any[] }>(`/api/investigations/${id}/graph`, {}, token),
  exportInvestigation: async (id: string, format: 'pdf' | 'csv', token?: string | null): Promise<{ blob: Blob | null, error: string | null }> => {
    try {
      const headers = new Headers();
      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
      }
      const res = await fetch(`${API_URL}/api/reports/investigation/${id}/export?format=${format}`, { headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'An unknown error occurred' }));
        return { blob: null, error: errorData.message || res.statusText };
      }
      const blob = await res.blob();
      return { blob, error: null };
    } catch (error: any) {
      return { blob: null, error: error.message || 'Network error' };
    }
  },

  // Tools
  listTools: (token?: string | null) => fetcher<any[]>('/api/tools', {}, token),

  // Templates
  getTemplates: (token?: string | null) => fetcher<any[]>('/api/templates', {}, token),
  createTemplate: (data: { name: string, inputData: any }, token?: string | null) => fetcher<any>('/api/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token),
  deleteTemplate: (id: string, token?: string | null) => fetcher<null>(`/api/templates/${id}`, {
    method: 'DELETE',
  }, token),

  // Statistics
  getInvestigationsOverTime: (params: { period?: string }, token?: string | null) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher<any>(`/api/statistics/investigations-over-time?${query}`, {}, token);
  },
  getGlobalStats: (params: { period?: string, date?: string }, token?: string | null) => {
    const query = new URLSearchParams(params as any).toString();
    return fetcher<any>(`/api/statistics/dashboard?${query}`, {}, token);
  },

  // Billing
  getBillingHistory: (token?: string | null) => fetcher<any[]>('/api/billing/history', {}, token),

  // Cases
  getCases: (token?: string | null) => fetcher<Case[]>('/api/cases', {}, token),
  getCase: (id: string, token?: string | null) => fetcher<Case>(`/api/cases/${id}`, {}, token),
  createCase: (data: { name: string, description?: string }, token?: string | null) => fetcher<Case>('/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }, token),
  assignToCase: (caseId: string, investigationId: string, token?: string | null) => fetcher<Case>(`/api/cases/${caseId}/investigations`, {
    method: 'PUT',
    body: JSON.stringify({ investigationIdsToConnect: [investigationId] }),
  }, token),
  deleteCase: (id: string, token?: string | null) => fetcher<{ message: string }>(`/api/cases/${id}`, { method: 'DELETE' }, token),
  exportCase: (id: string, format: 'pdf' | 'csv', token?: string | null) => fetcher<Blob>(`/api/cases/${id}/export?format=${format}`, {}, token),
  
  // Notifications
  getNotifications: (token?: string | null) => fetcher<Notification[]>('/api/notifications', {}, token),
  markNotificationsAsRead: (ids: string[], token?: string | null) => fetcher<{ count: number }>('/api/notifications/mark-as-read', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  }, token),
  markAllNotificationsAsRead: (token?: string | null) => fetcher<{ count: number }>('/api/notifications/mark-all-as-read', {
    method: 'POST',
  }, token),
  deleteNotification: (id: string, token?: string | null) => fetcher<null>(`/api/notifications/${id}`, {
    method: 'DELETE',
  }, token),
};