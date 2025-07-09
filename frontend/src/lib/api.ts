import axios from 'axios';
import { SearchRequest, SearchTask, SearchResults, ApiResponse } from '@/types';

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
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const searchAPI = {
  // Démarrer une nouvelle recherche
  startSearch: async (request: SearchRequest): Promise<ApiResponse<{ task_id: string }>> => {
    try {
      const response = await api.post('/api/search', request);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors du démarrage de la recherche' };
    }
  },

  // Obtenir le statut d'une recherche
  getSearchStatus: async (taskId: string): Promise<ApiResponse<SearchTask>> => {
    try {
      const response = await api.get(`/api/search/${taskId}`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération du statut' };
    }
  },

  // Obtenir tous les résultats
  getAllResults: async (): Promise<ApiResponse<SearchResults>> => {
    try {
      const response = await api.get('/api/results');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des résultats' };
    }
  },

  // Obtenir les résultats d'une recherche spécifique
  getSpecificResults: async (filename: string): Promise<ApiResponse<SearchResults>> => {
    try {
      const response = await api.get(`/api/results/${filename}`);
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des résultats' };
    }
  },

  // Lister toutes les recherches
  listSearches: async (): Promise<ApiResponse<SearchTask[]>> => {
    try {
      const response = await api.get('/api/searches');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors de la récupération des recherches' };
    }
  },

  // Reparser les fichiers CSV
  parseCSV: async (): Promise<ApiResponse<{ stats: any }>> => {
    try {
      const response = await api.post('/api/parse');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Erreur lors du parsing' };
    }
  },

  // Vérification de santé
  healthCheck: async (): Promise<ApiResponse<{ status: string }>> => {
    try {
      const response = await api.get('/api/health');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.error || 'Service indisponible' };
    }
  },
};

export default api; 