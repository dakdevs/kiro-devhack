"use client"

import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setAuthState({
              user: data.user,
              loading: false,
              error: null,
            });
          } else {
            setAuthState({
              user: null,
              loading: false,
              error: null,
            });
          }
        } else {
          setAuthState({
            user: null,
            loading: false,
            error: 'Failed to fetch user session',
          });
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
        setAuthState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    fetchUser();
  }, []);

  return authState;
}