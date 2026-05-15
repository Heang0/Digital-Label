import { StaffPermissions } from '@/types';
import { 
  Package, 
  BarChart3, 
  DollarSign, 
  Tag, 
  Zap, 
  AlertCircle, 
  TrendingUp, 
  Users 
} from 'lucide-react';

export type StaffPosition = 'Manager' | 'Cashier' | 'Inventory Manager' | 'Stock Controller';

export interface RolePreset {
  position: StaffPosition;
  label: string;
  description: string;
  color: string;
  permissions: StaffPermissions;
}

export const ROLE_PRESETS: Record<StaffPosition, RolePreset> = {
  'Manager': {
    position: 'Manager',
    label: 'branch_manager',
    description: 'manager_desc',
    color: 'indigo',
    permissions: {
      canViewProducts: true,
      canUpdateStock: true,
      canReportIssues: true,
      canViewReports: true,
      canChangePrices: true,
      canCreateProducts: true,
      canCreateLabels: true,
      canCreatePromotions: true,
      canManageStaff: true,
      maxPriceChange: 100,
    },
  },
  'Cashier': {
    position: 'Cashier',
    label: 'cashier',
    description: 'cashier_desc',
    color: 'emerald',
    permissions: {
      canViewProducts: true,
      canUpdateStock: false,
      canReportIssues: true,
      canViewReports: false,
      canChangePrices: false,
      canCreateProducts: false,
      canCreateLabels: false,
      canCreatePromotions: false,
      canManageStaff: false,
      maxPriceChange: 0,
    },
  },
  'Inventory Manager': {
    position: 'Inventory Manager',
    label: 'inventory_manager',
    description: 'inventory_manager_desc',
    color: 'purple',
    permissions: {
      canViewProducts: true,
      canUpdateStock: true,
      canReportIssues: true,
      canViewReports: true,
      canChangePrices: false,
      canCreateProducts: true,
      canCreateLabels: true,
      canCreatePromotions: false,
      canManageStaff: false,
      maxPriceChange: 0,
    },
  },
  'Stock Controller': {
    position: 'Stock Controller',
    label: 'stock_controller',
    description: 'stock_controller_desc',
    color: 'amber',
    permissions: {
      canViewProducts: true,
      canUpdateStock: true,
      canReportIssues: true,
      canViewReports: true,
      canChangePrices: false,
      canCreateProducts: false,
      canCreateLabels: true,
      canCreatePromotions: false,
      canManageStaff: false,
      maxPriceChange: 0,
    },
  },
};

export function getPermissionsForRole(position: string): StaffPermissions {
  const preset = ROLE_PRESETS[position as StaffPosition];
  if (preset) return { ...preset.permissions };
  // Default: minimal read-only access
  return {
    canViewProducts: true,
    canUpdateStock: false,
    canReportIssues: true,
    canViewReports: false,
    canChangePrices: false,
    canCreateProducts: false,
    canCreateLabels: false,
    canCreatePromotions: false,
    canManageStaff: false,
    maxPriceChange: 0,
  };
}

export const PERMISSION_LABELS: Record<string, { label: string; icon: any }> = {
  canViewProducts: { label: 'view_inventory', icon: Package },
  canUpdateStock: { label: 'update_stock', icon: BarChart3 },
  canChangePrices: { label: 'adjust_pricing', icon: DollarSign },
  canCreateProducts: { label: 'create_products', icon: Tag },
  canCreateLabels: { label: 'manage_labels', icon: Zap },
  canCreatePromotions: { label: 'run_promotions', icon: Tag },
  canReportIssues: { label: 'report_issues', icon: AlertCircle },
  canViewReports: { label: 'access_reports', icon: TrendingUp },
  canManageStaff: { label: 'manage_staff', icon: Users },
};
