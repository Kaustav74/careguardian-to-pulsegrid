// ============================================================
// PULSEGRID — AUTH ZUSTAND STORE (LOCAL JWT)
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, RoleId } from '../types';

interface AuthStoreState {
  token:        string | null;
  userProfile:  UserProfile | null;
  roleId:       RoleId | null;
  isLoading:    boolean;
  isAuthenticated: boolean;
  error:        string | null;

  // Actions
  setToken:         (token: string | null) => void;
  setUserProfile:   (profile: UserProfile | null) => void;
  setLoading:       (loading: boolean) => void;
  setError:         (error: string | null) => void;
  reset:            () => void;
}

const initialState = {
  token:            null,
  userProfile:      null,
  roleId:           null,
  isLoading:        false,
  isAuthenticated:  false,
  error:            null,
};

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      ...initialState,

      setToken: (token) =>
        set({ token, isAuthenticated: !!token }),

      setUserProfile: (profile) =>
        set({ userProfile: profile, roleId: profile?.roleId ?? null }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'cg-auth',
      partialize: (state) => ({
        token: state.token, // Persist token to keep user logged in
        roleId: state.roleId,
      }),
    }
  )
);
