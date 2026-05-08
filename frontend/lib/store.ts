import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'vendor' | 'staff';
  companyId?: string;
  branchId?: string;
  permissions?: string[];
  createdAt: Date;
}

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  subscription: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
}

interface AppState {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setCompany: (company: Company | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  company: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setCompany: (company) => set({ company }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));