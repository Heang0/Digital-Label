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

export type StaffPosition = 'Manager' | 'Cashier' | 'Inventory Specialist' | 'IT Support' | 'Sales Associate';

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
    label: 'Branch Manager',
    description: 'Full branch control — inventory, pricing, labels, staff, and reports. Cannot create new branches.',
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
    label: 'Cashier',
    description: 'View products and pricing. Can report issues but cannot modify stock or labels.',
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
  'Inventory Specialist': {
    position: 'Inventory Specialist',
    label: 'Stock Controller',
    description: 'Manage shelf stock levels and report discrepancies. Cannot adjust pricing or manage staff.',
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
  'IT Support': {
    position: 'IT Support',
    label: 'Technical Support',
    description: 'Manage digital labels, troubleshoot hardware, and view system reports.',
    color: 'cyan',
    permissions: {
      canViewProducts: true,
      canUpdateStock: false,
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
  'Sales Associate': {
    position: 'Sales Associate',
    label: 'Sales Associate',
    description: 'View products and assist customers. Can report issues but has no management access.',
    color: 'rose',
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
  canViewProducts: { label: 'View Inventory', icon: Package },
  canUpdateStock: { label: 'Update Stock', icon: BarChart3 },
  canChangePrices: { label: 'Adjust Pricing', icon: DollarSign },
  canCreateProducts: { label: 'Create Products', icon: Tag },
  canCreateLabels: { label: 'Manage Labels', icon: Zap },
  canCreatePromotions: { label: 'Run Promotions', icon: Tag },
  canReportIssues: { label: 'Report Issues', icon: AlertCircle },
  canViewReports: { label: 'Access Reports', icon: TrendingUp },
  canManageStaff: { label: 'Manage Staff', icon: Users },
};
