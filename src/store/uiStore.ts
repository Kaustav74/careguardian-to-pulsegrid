// ============================================================
// PULSEGRID — UI ZUSTAND STORE
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface UIStoreState {
  theme:            Theme;
  sidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;

  // Actions
  setTheme:            (theme: Theme) => void;
  toggleTheme:         () => void;
  toggleSidebar:       () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen:   (open: boolean) => void;
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set, get) => ({
      theme:            'dark',
      sidebarCollapsed: false,
      isMobileMenuOpen: false,

      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        set({ theme: next });
      },

      toggleSidebar:       () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setMobileMenuOpen:   (open) => set({ isMobileMenuOpen: open }),
    }),
    {
      name: 'cg-ui',
      partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
);
