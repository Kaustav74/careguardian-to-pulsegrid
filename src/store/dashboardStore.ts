// ============================================================
// PULSEGRID — DASHBOARD ZUSTAND STORE
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WidgetConfig, RoleId } from '../types';

interface DashboardStoreState {
  widgetConfigs: Partial<Record<RoleId, WidgetConfig[]>>;
  activeTab:     string;

  setWidgetConfigs: (roleId: RoleId, configs: WidgetConfig[]) => void;
  setActiveTab:     (tab: string) => void;
}

export const useDashboardStore = create<DashboardStoreState>()(
  persist(
    (set) => ({
      widgetConfigs: {},
      activeTab:     'overview',

      setWidgetConfigs: (roleId, configs) =>
        set((s) => ({ widgetConfigs: { ...s.widgetConfigs, [roleId]: configs } })),

      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    { name: 'cg-dashboard' }
  )
);
