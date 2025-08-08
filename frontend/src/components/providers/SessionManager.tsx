import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { signOut } from 'next-auth/react';

export const SessionManager = () => {
  const isSessionExpired = useAppStore((state) => state.isSessionExpired);
  const resetSessionExpired = useAppStore((state) => state.resetSessionExpired);

  useEffect(() => {
    if (isSessionExpired) {
      signOut({ callbackUrl: '/login?error=SessionExpired' });
      // On réinitialise l'état pour éviter des boucles de redirection
      resetSessionExpired();
    }
  }, [isSessionExpired, resetSessionExpired]);

  return null; // Ce composant ne rend rien
};