import axios, { AxiosResponse, AxiosError } from 'axios';
import { PersonResult } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteurs pour gérer les erreurs
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    console.error('Investigation API Error:', error);
    return Promise.reject(error);
  }
);

export interface InvestigationInput {
  names?: string[];
  emails?: string[];
  usernames?: string[];
  phones?: string[];
  ips?: string[];
  domains?: string[];
  urls?: string[];
  maxGeneration?: number;
  minConfidence?: number;
}

export interface Investigation {
  id: string;
  status: 'INITIALIZING' | 'ENRICHING' | 'SCANNING' | 'CONSOLIDATING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  currentPhase: 'ENRICHMENT' | 'SCANNING' | 'CONSOLIDATION' | 'FINISHED';
  currentStep?: string;
  inputData?: InvestigationInput;
  finalReport?: any;
  createdAt: string;
  updatedAt: string;
  caseId?: string | null;
  results?: Result[];
  indicators?: Indicator[];
}

export interface Case {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    investigations: Investigation[];
}

export interface Indicator {
  id: string;
  investigationId: string;
  type: 'NAME' | 'EMAIL' | 'USERNAME' | 'PHONE' | 'IP' | 'DOMAIN' | 'URL';
  value: string;
  source?: string;
  confidence: number;
  verified: boolean;
  createdAt: string;
}

export interface Result {
  id: string;
  investigationId: string;
  indicatorId?: string;
  toolSource: string;
  data: any;
  score: number;
  createdAt: string;
  investigation?: {
    id: string;
    inputData: any;
  };
  indicator?: Indicator;
}

export interface InvestigationLog {
  id: string;
  investigationId: string;
  step: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'DEBUG';
  timestamp: string;
  metadata?: {
    progress?: number;
    tool?: string;
    duration?: number;
    count?: number;
  };
}

export interface ToolInfo {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  documentation?: string;
}

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  configurableOptions: string[];
  documentation: string;
}

export interface ToolStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdate: string;
  stats: {
    totalResults: number;
    recentResults: number;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface GlobalStats {
  totalInvestigations: number;
  totalResults: number;
  resultsByTool: { toolSource: string; count: number }[];
  indicatorsByType: { type: string; count: number }[];
}

export const investigationAPI = {
  // Investigations
  createInvestigation: async (input: InvestigationInput): Promise<ApiResponse<Investigation>> => {
    try {
      const response = await api.post('/api/investigations', input);
      // La réponse de l'API contient { message: string, investigation: Investigation }
      // Nous retournons directement l'objet investigation.
      return { data: response.data.investigation };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la création de l\'investigation' };
    }
  },

  getInvestigation: async (id: string): Promise<ApiResponse<Investigation>> => {
    try {
      const response = await api.get(`/api/investigations/${id}`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération de l\'investigation' };
    }
  },

  listInvestigations: async (): Promise<ApiResponse<Investigation[]>> => {
    try {
      const response = await api.get('/api/investigations');
      return { data: response.data.investigations || [] };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des investigations' };
    }
  },

  startInvestigation: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.post(`/api/investigations/${id}/start`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors du démarrage de l\'investigation' };
    }
  },

  stopInvestigation: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.post(`/api/investigations/${id}/stop`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de l\'arrêt de l\'investigation' };
    }
  },

  deleteInvestigation: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.delete(`/api/investigations/${id}`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la suppression de l\'investigation' };
    }
  },

  // Indicateurs
  getIndicators: async (investigationId: string): Promise<ApiResponse<Indicator[]>> => {
    try {
      const response = await api.get(`/api/investigations/${investigationId}/indicators`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des indicateurs' };
    }
  },

  // Résultats
  getResults: async (investigationId: string): Promise<ApiResponse<Result[]>> => {
    try {
      const response = await api.get(`/api/investigations/${investigationId}/results`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des résultats' };
    }
  },

  getResultsByTool: async (investigationId: string, toolSource: string): Promise<ApiResponse<Result[]>> => {
    try {
      const response = await api.get(`/api/investigations/${investigationId}/results/${toolSource}`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des résultats' };
    }
  },

  getAllResults: async (params: { page?: number; limit?: number; sortBy?: string; sortOrder?: string; toolSource?: string; indicatorType?: string; }): Promise<ApiResponse<PaginatedResponse<Result>>> => {
    try {
      const response = await api.get('/api/results', { params });
      return { data: { data: response.data.results, pagination: response.data.pagination } };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération de tous les résultats' };
    }
  },

  getRecentResults: async (limit: number = 10): Promise<ApiResponse<Result[]>> => {
    try {
      const response = await api.get(`/api/results/recent?limit=${limit}`);
      return { data: response.data.results || [] };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des résultats récents' };
    }
  },
getGroupedResults: async (): Promise<ApiResponse<{ persons: PersonResult[] }>> => {
    try {
      const response = await api.get('/api/results/grouped');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des résultats groupés' };
    }
  },

  // Logs
  getLogs: async (investigationId: string): Promise<ApiResponse<InvestigationLog[]>> => {
    try {
      const response = await api.get(`/api/investigations/${investigationId}/logs`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des logs' };
    }
  },

  // Outils
  listTools: async (): Promise<ApiResponse<ToolInfo[]>> => {
    try {
      const response = await api.get('/api/tools');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des outils' };
    }
  },

  getToolDetails: async (toolId: string): Promise<ApiResponse<ToolConfig>> => {
    try {
      const response = await api.get(`/api/tools/${toolId}`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des détails de l\'outil' };
    }
  },

  testTool: async (toolId: string): Promise<ApiResponse<{ status: string }>> => {
    try {
      const response = await api.post(`/api/tools/${toolId}/test`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors du test de l\'outil' };
    }
  },

  getToolStatus: async (toolId: string): Promise<ApiResponse<ToolStatus>> => {
    try {
      const response = await api.get(`/api/tools/${toolId}/status`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération du statut de l\'outil' };
    }
  },

  getToolConfig: async (toolId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get(`/api/tools/${toolId}/config`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération de la configuration de l\'outil' };
    }
  },

  updateToolConfig: async (toolId: string, config: any): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.put(`/api/tools/${toolId}/config`, config);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la mise à jour de la configuration de l\'outil' };
    }
  },

  getToolLogs: async (toolId: string): Promise<ApiResponse<any[]>> => {
    try {
      const response = await api.get(`/api/tools/${toolId}/logs`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des logs de l\'outil' };
    }
  },

  // Santé
  healthCheck: async (): Promise<ApiResponse<{ status: string }>> => {
    try {
      const response = await api.get('/api/health');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Service indisponible' };
    }
  },

  detailedHealthCheck: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/api/health/detailed');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la vérification de santé détaillée' };
    }
  },

  readinessCheck: async (): Promise<ApiResponse<{ status: string }>> => {
    try {
      const response = await api.get('/api/health/readiness');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Service non prêt' };
    }
  },

  livenessCheck: async (): Promise<ApiResponse<{ status: string }>> => {
    try {
      const response = await api.get('/api/health/liveness');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Service non vivant' };
    }
  },

  // Statistiques
  getGlobalStats: async (): Promise<ApiResponse<GlobalStats>> => {
    try {
      const response = await api.get('/api/statistics');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des statistiques globales' };
    }
  },

  // Case Management
  getCases: async (): Promise<ApiResponse<Case[]>> => {
    try {
      const response = await api.get('/api/cases');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des dossiers' };
    }
  },
  createCase: async (data: { name: string; description?: string; investigationIds?: string[] }): Promise<ApiResponse<Case>> => {
    try {
      const response = await api.post('/api/cases', data);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la création du dossier' };
    }
  },
  getCase: async (id: string): Promise<ApiResponse<Case>> => {
    try {
      const response = await api.get(`/api/cases/${id}`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération du dossier' };
    }
  },
  updateCaseInvestigations: async (caseId: string, data: { investigationIdsToConnect?: string[]; investigationIdsToDisconnect?: string[] }): Promise<ApiResponse<Case>> => {
    try {
      const response = await api.put(`/api/cases/${caseId}/investigations`, data);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la mise à jour du dossier' };
    }
  },

  // Reports
  exportInvestigation: async (id: string, format: 'pdf' | 'csv' | 'json') => {
    const response = await api.get(`/api/reports/investigation/${id}/export?format=${format}`, {
      responseType: format === 'json' ? 'json' : 'blob',
    });
    return response.data;
  },

  exportCase: async (id: string, format: 'pdf' | 'csv') => {
    const response = await api.get(`/api/reports/case/${id}/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Graph
  getInvestigationGraph: async (id: string): Promise<ApiResponse<{ nodes: any[], edges: any[] }>> => {
    try {
      const response = await api.get(`/api/v1/investigations/${id}/graph`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des données du graphe' };
    }
  },
};

export default investigationAPI;