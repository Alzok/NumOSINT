import { InvestigationInput, Investigation, Indicator, Result, InvestigationLog, Case, AppNotification as Notification } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

async function fetcher<T>(url: string, options: RequestInit = {}, token?: string | null): Promise<{ data: T | null, error: string | null }> {
  try {
    const authToken = token || localStorage.getItem('token');
    const headers = new Headers(options.headers || {});
    if (authToken) {
      headers.append('Authorization', `Bearer ${authToken}`);
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
  createInvestigation: (data: InvestigationInput) => fetcher<Investigation>('/api/investigations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  getInvestigations: (params: { limit?: number; sortBy?: string; sortOrder?: string; status?: string } = {}, token?: string | null) => {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params.status) query.append('status', params.status);
    return fetcher<Investigation[]>(`/api/investigations?${query.toString()}`, {}, token);
  },
  getInvestigation: (id: string, token?: string | null) => fetcher<Investigation>(`/api/investigations/${id}`, {}, token),
  startInvestigation: (id: string) => fetcher<{ message: string }>(`/api/investigations/${id}/start`, { method: 'POST' }),
  stopInvestigation: (id: string) => fetcher<{ message: string }>(`/api/investigations/${id}/stop`, { method: 'POST' }),
  deleteInvestigation: (id: string, token?: string | null) => fetcher<{ message: string }>(`/api/investigations/${id}`, { method: 'DELETE' }, token),
  getResults: (id: string, token?: string | null) => fetcher<Result[]>(`/api/investigations/${id}/results`, {}, token),
  getGroupedResults: (params: any, token?: string | null) => fetcher<any>(`/api/results/grouped?${new URLSearchParams(params)}`, {}, token),
  getLogs: (id: string, token?: string | null) => fetcher<{ logs: InvestigationLog[] }>(`/api/investigations/${id}/logs`, {}, token),
  getInvestigationGraph: (id: string, token?: string | null) => fetcher<{ nodes: any[], edges: any[] }>(`/api/investigations/${id}/graph`, {}, token),

  // Tools
  listTools: () => fetcher<any[]>('/api/tools'),

  // Statistics
  getInvestigationsOverTime: (token?: string | null) => fetcher<any>('/api/statistics/investigations-over-time', {}, token),
  getGlobalStats: (token?: string | null) => fetcher<any>('/api/statistics/global', {}, token),

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
};