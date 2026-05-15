import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'vendor' | 'staff';
export type UserStatus = 'active' | 'pending' | 'suspended';
export type CompanyStatus = 'active' | 'pending' | 'suspended';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  photoURL?: string;
  companyId?: string;
  branchId?: string;
  phone?: string;
  position?: string;
  username?: string;
  bio?: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  permissions?: StaffPermissions;
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
  canManageStaff?: boolean;
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

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  code?: string;
  subscription: 'basic' | 'pro' | 'enterprise';
  status: CompanyStatus;
  ownerId: string;
  ownerName?: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  labelsCount?: number;
  branchesCount?: number;
  staffCount?: number;
  productsCount?: number;
  categoriesCount?: number;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  address: string;
  phone: string;
  managerId?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'closed';
  createdAt: Timestamp | Date;
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
  productCode?: string;
  stock?: number;
  minStock?: number;
  createdBy?: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface DigitalLabel {
  id: string;
  branchId: string;
  branchName?: string;
  productId?: string | null;
  productName?: string;
  productSku?: string;
  stock?: number;
  labelId: string;
  labelCode?: string;
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

export interface SystemMetrics {
  totalUsers: number;
  totalCompanies: number;
  totalLabels: number;
  totalBranches: number;
  systemHealth: number;
  apiResponseTime: number;
  databaseLoad: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  trialAccounts: number;
  activeUsers24h: number;
  totalRevenue: number;
  conversionRate: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetId?: string;
  targetType?: 'user' | 'company' | 'label' | 'product' | 'system';
  details: string;
  timestamp: Timestamp | Date;
}

export interface LabelSyncRecord {
  id: string;
  labelId: string;
  labelCode: string;
  companyId: string;
  companyName?: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  retryCount: number;
  lastAttempt: Timestamp | Date;
}