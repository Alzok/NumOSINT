import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api-client';
import { User } from '@/types';

// Définir un type pour la réponse de l'API de login
interface LoginResponse {
  token: string;
  user: User;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Idéalement, vous auriez un endpoint /api/auth/me pour vérifier le token et récupérer l'utilisateur
        // Pour l'instant, nous allons simplement décoder le token (ce n'est pas sécurisé pour vérifier l'expiration côté client)
        const decoded = JSON.parse(atob(token.split('.')[1]));
        // Supposons que le payload contient les informations de l'utilisateur
        // Dans une vraie application, ne faites confiance qu'à un appel API pour obtenir les données utilisateur
        setUser({ id: decoded.id, email: decoded.email || 'user@example.com' });
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse token:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const response = await api.login(email, password);
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      // Après la connexion, nous devons obtenir les informations de l'utilisateur.
      // L'API de login ne renvoie que le token, nous allons donc recharger les informations.
      await fetchUser();
      router.push('/');
      return { success: true };
    } else {
      return { success: false, error: response.error || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return { user, isAuthenticated, loading, login, logout };
}