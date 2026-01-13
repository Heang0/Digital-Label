// types.ts
export type UserRole = 'admin' | 'vendor' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  branchId?: string;
  permissions?: string[];
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  subscription: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  address: string;
  phone: string;
  managerId?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  basePrice: number;
  imageUrl?: string;
  createdAt: Date;
}

export interface BranchProduct {
  id: string;
  branchId: string;
  productId: string;
  price: number;
  stock: number;
  minStock: number;
  lastUpdated: Date;
}

export interface DigitalLabel {
  id: string;
  branchId: string;
  productId?: string;
  labelId: string;
  location: string;
  battery: number;
  status: 'active' | 'inactive' | 'low-battery' | 'error';
  lastSync: Date;
  createdAt: Date;
}

export interface Staff {
  id: string;
  branchId: string;
  companyId: string;
  name: string;
  email: string;
  position: string;
  permissions: {
    canViewProducts: boolean;
    canEditProducts: boolean;
    canChangePrices: boolean;
    maxPriceChange: number;
    canUpdateStock: boolean;
    canViewReports: boolean;
    canCreatePromotions: boolean;
  };
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Promotion {
  id: string;
  companyId: string;
  name: string;
  type: 'percentage' | 'fixed' | 'bogo';
  value: number;
  appliesTo: 'all' | 'selected';
  branchIds?: string[];
  productIds?: string[];
  startDate: Date;
  endDate: Date;
  status: 'active' | 'scheduled' | 'ended';
  createdAt: Date;
}

export interface IssueReport {
  id: string;
  branchId: string;
  labelId: string;
  type: 'wrong-price' | 'blank-screen' | 'low-battery' | 'other';
  description: string;
  reportedBy: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: Date;
}