'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is stored in localStorage
        const storedUser = authApi.getUser();
        const isAuthenticated = authApi.isAuthenticated();

        if (storedUser && isAuthenticated) {
          // Verify token by fetching profile
          try {
            const profile = await authApi.getProfile();
            setUser(profile.data);
          } catch (error) {
            // Token is invalid, clear storage
            authApi.logout();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
