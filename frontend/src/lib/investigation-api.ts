import axios, { AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
}

export interface Investigation {
  id: string;
  status: 'INITIALIZING' | 'ENRICHING' | 'SCANNING' | 'CONSOLIDATING' | 'COMPLETED' | 'FAILED';
  progress: number;
  currentStep?: string;
  inputData?: InvestigationInput;
  finalReport?: any;
  createdAt: string;
  updatedAt: string;
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
}

export interface InvestigationLog {
  id: string;
  investigationId: string;
  step: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  timestamp: string;
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

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export const investigationAPI = {
  // Investigations
  createInvestigation: async (input: InvestigationInput): Promise<ApiResponse<Investigation>> => {
    try {
      const response = await api.post('/api/investigations', { inputData: input });
      return { data: response.data };
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
      return { data: response.data };
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
};

export default investigationAPI;