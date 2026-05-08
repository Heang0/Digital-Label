import { Timestamp } from 'firebase/firestore';

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  subscription: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'pending' | 'suspended';
  ownerId: string;
  createdAt: Timestamp;
  code?: string;
  branches?: Branch[];
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager?: string;
  companyId: string;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  basePrice: number;
  imageUrl?: string;
  productCode?: string;
  stock?: number;
  minStock?: number;
  companyId: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BranchProduct {
  id: string;
  productId: string;
  branchId: string;
  companyId: string;
  currentPrice: number;
  stock: number;
  minStock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: Timestamp;
}

export interface StaffPermissions {
  canViewProducts: boolean;
  canUpdateStock: boolean;
  canReportIssues: boolean;
  canViewReports: boolean;
  canChangePrices: boolean;
  canCreateProducts?: boolean;
  canCreateLabels?: boolean;
  canCreatePromotions?: boolean;
  maxPriceChange?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  position: string;
  branchId: string;
  branchName?: string;
  companyId: string;
  status: 'active' | 'inactive';
  permissions: StaffPermissions;
  lastLogin?: Timestamp | Date;
  createdAt: Timestamp | Date;
}

export interface DigitalLabel {
  id: string;
  labelId: string;
  labelCode?: string;
  productId: string | null;
  productName?: string;
  productSku?: string;
  branchId: string;
  branchName?: string;
  companyId: string;
  location: string;
  battery: number;
  status: 'active' | 'inactive' | 'low-battery' | 'error' | 'syncing';
  currentPrice: number | null;
  basePrice?: number | null;
  finalPrice?: number | null;
  discountPercent?: number | null;
  discountPrice?: number | null;
  lastSync?: Timestamp | Date | null;
  createdAt: Timestamp | Date;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'bogo';
  value: number;
  companyId: string;
  applyTo: 'all' | 'selected';
  productIds: string[];
  branchIds: string[];
  startDate: Timestamp | Date;
  endDate: Timestamp | Date;
  status: 'active' | 'upcoming' | 'expired';
  createdAt: Timestamp | Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  companyId: string;
  createdAt: Timestamp;
}

export interface IssueReport {
  id: string;
  labelId: string;
  productId?: string | null;
  productName?: string | null;
  issue: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  reportedAt: Timestamp;
  branchId: string;
  branchName?: string;
  companyId: string;
  reportedByName?: string;
}
