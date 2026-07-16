// ============================================================
// PULSEGRID — AUTH CONTEXT PROVIDER (LOCAL JWT)
// ============================================================
import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { loginWithEmail, fetchUserProfile, logout as serviceLogout } from '../services/authService';
import type { UserProfile } from '../types';

interface AuthContextType {
  token:        string | null;
  userProfile:  UserProfile | null;
  isLoading:    boolean;
  isAuthenticated: boolean;
  error:        string | null;
  login:        (email: string, password: string) => Promise<{ token: string; profile: UserProfile }>;
  logout:       () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    token, userProfile, isLoading, isAuthenticated, error,
    setToken, setUserProfile, setLoading, setError, reset,
  } = useAuthStore();

  // Load profile on mount if token exists
  useEffect(() => {
    const loadProfile = async () => {
      if (token && !userProfile) {
        setLoading(true);
        try {
          const profile = await fetchUserProfile(token);
          setUserProfile(profile);
        } catch (err) {
          console.error('[Auth] Failed to load profile with token', err);
          reset(); // Invalid token, clear state
        } finally {
          setLoading(false);
        }
      }
    };
    loadProfile();
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { token: newToken, profile } = await loginWithEmail(email, password);
      setToken(newToken);
      setUserProfile(profile);
      return { token: newToken, profile };
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    serviceLogout();
    reset();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userProfile,
        isLoading,
        isAuthenticated,
        error,
        login,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
}
