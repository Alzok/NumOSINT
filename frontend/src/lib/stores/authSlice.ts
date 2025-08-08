import { StateCreator } from 'zustand';
import { toast } from 'sonner';

export interface AuthSlice {
  isSessionExpired: boolean;
  handleSessionExpired: () => void;
  resetSessionExpired: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set, get) => ({
  isSessionExpired: false,
  handleSessionExpired: () => {
    if (get().isSessionExpired) {
      return;
    }
    set({ isSessionExpired: true });
    toast.error('Session expirée', {
      description: 'Votre session a expiré. Vous allez être redirigé vers la page de connexion.',
      duration: 5000,
    });
  },
  resetSessionExpired: () => {
    set({ isSessionExpired: false });
  },
});