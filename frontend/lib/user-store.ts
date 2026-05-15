import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'vendor' | 'staff';
  photoURL?: string;
  companyId?: string;
  companyName?: string;
  companyLogo?: string;
  branchId?: string;
  branchName?: string;
  phone?: string;
  username?: string;
  bio?: string;
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
    canManageStaff?: boolean;
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
