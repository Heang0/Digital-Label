import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'vendor' | 'staff';
  companyId?: string;
  branchId?: string;
  position?: string; // Add this
  permissions?: { // Add this
    canViewProducts: boolean;
    canUpdateStock: boolean;
    canReportIssues: boolean;
    canViewReports: boolean;
    canChangePrices: boolean;
    canCreateProducts?: boolean;
    canCreateLabels?: boolean;
    canCreatePromotions?: boolean;
    maxPriceChange?: number;
  };
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'user-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
