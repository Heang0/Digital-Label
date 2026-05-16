'use client';

import { 
  Store, 
  Users, 
  Building2, 
  BarChart2, 
  Settings, 
  LogOut, 
  X,
  LayoutDashboard,
  Wallet,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Zap,
  LayoutGrid as LayoutGridIcon,
  Activity,
  Package,
  Tag,
  Terminal,
  Percent,
  Plus,
  AlertCircle,
  History,
  ShoppingCart,
  RefreshCcw,
  Layers,
  Shield,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/user-store';
import { motion } from 'framer-motion';
import { useUserStore } from '@/lib/user-store';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface SidebarProps {
  currentUser: User;
  selectedTab: string;
  setSelectedTab: (tab: any) => void;
  onLogout: () => void;
  onClose?: () => void;
}

export const DashboardSidebar = ({ 
  currentUser, 
  selectedTab, 
  setSelectedTab, 
  onLogout,
  onClose,
}: SidebarProps) => {
  const { t } = useLanguage();
  const isAdmin = currentUser?.role === 'admin';
  const isVendor = currentUser?.role === 'vendor';
  const isStaff = currentUser?.role === 'staff';
  const isStock = currentUser?.role === 'stock';
  const isInventoryManager = currentUser?.role === 'inventory_manager';
  const isManager = currentUser?.position === 'Manager';

  const getMenuGroups = () => {
    if (isAdmin) return [
      {
        label: t('platform_control'),
        items: [
          { id: 'overview', label: t('overview'), icon: LayoutGridIcon },
          { id: 'users', label: t('vendors'), icon: Users },
          { id: 'companies', label: t('companies'), icon: Building2 },
          { id: 'audit', label: t('audit'), icon: History },
          { id: 'sync', label: t('sync'), icon: RefreshCcw },
        ]
      },
      {
        label: t('insights'),
        items: [
          { id: 'analytics', label: t('analytics'), icon: Activity },
          { id: 'revenue', label: t('financial_control'), icon: Wallet },
        ],
      },
      {
        label: t('system_config'),
        items: [
          { id: 'label-ui', label: t('label_ui'), icon: Store },
          { id: 'settings', label: t('settings'), icon: Settings },
        ]
      }
    ];

    if (isVendor) return [
      {
        label: t('inventory_mgmt'),
        items: [
          { id: 'dashboard', label: t('overview'), icon: LayoutGridIcon },
          { id: 'products', label: t('product_mgmt'), icon: Package },
          { id: 'categories', label: t('category_mgmt'), icon: Layers },
        ]
      },
      {
        label: t('operations'),
        items: [
          { id: 'staff', label: t('staff_mgmt'), icon: Users },
          { id: 'promotions', label: t('promo_scheduler'), icon: Percent },
        ]
      },
      {
        label: t('label_mgmt'),
        items: [
          { id: 'labels', label: t('label_mgmt'), icon: Terminal },
          { id: 'label-ui', label: t('label_ui_setting'), icon: Store },
        ]
      },
      {
        label: t('insights'),
        items: [
          { id: 'analytics', label: t('scan_analytics'), icon: Activity },
          { id: 'reports', label: t('reporting'), icon: BarChart2 },
          { id: 'activity', label: t('tenant_audit'), icon: History },
        ]
      },
      {
        label: t('system_config'),
        items: [
          { id: 'branches', label: t('branch_mgmt'), icon: Building2 },
          { id: 'pos', label: t('pos_integration'), icon: Zap },
          { id: 'settings', label: t('settings'), icon: Settings },
          { id: 'support', label: t('support_tickets'), icon: HelpCircle },
        ]
      }
    ];

    // Staff — Manager gets vendor-level nav
    const isAdvancedStaff = isManager || currentUser?.permissions?.canCreateProducts || currentUser?.permissions?.canCreateLabels;
    
    if (isAdvancedStaff) {
      const branchItems = [
        { id: 'dashboard', label: t('branch_overview'), icon: LayoutGridIcon },
        { id: 'products', label: t('product_mgmt'), icon: Package },
      ];
      if (currentUser?.permissions?.canCreateProducts || isManager) {
        branchItems.push({ id: 'categories', label: t('category_mgmt'), icon: Layers });
      }
      branchItems.push({ id: 'labels', label: t('label_mgmt'), icon: Terminal });

      const teamItems = [];
      if (currentUser?.permissions?.canManageStaff || isManager) {
        teamItems.push({ id: 'staff', label: t('staff_mgmt'), icon: Users });
      }
      teamItems.push({ id: 'issues', label: t('reported_issues'), icon: AlertCircle });
      
      if (currentUser?.permissions?.canCreatePromotions || isManager) {
        teamItems.push({ id: 'promotions', label: t('promo_scheduler'), icon: Percent });
      }

      const insightItems = [];
      if (currentUser?.permissions?.canViewReports || isManager) {
        insightItems.push({ id: 'reports', label: t('performance'), icon: BarChart2 });
        insightItems.push({ id: 'activity', label: t('tenant_audit'), icon: History });
      }

      const menu = [
        { label: t('branch_mgmt'), items: branchItems },
        { label: t('team'), items: teamItems },
      ];

      if (insightItems.length > 0) {
        menu.push({ label: t('insights'), items: insightItems });
      }

      menu.push({
        label: t('general'),
        items: [{ id: 'settings', label: t('settings'), icon: Settings }]
      });

      return menu;
    }

    // Regular staff (Cashier, Stock, IT, etc.)
    const operationsItems = [
      { id: 'dashboard', label: t('branch_overview'), icon: LayoutGridIcon },
      { id: 'pos', label: t('pos_checkout') || 'POS Checkout', icon: ShoppingCart },
      { id: 'inventory', label: t('stock_directory'), icon: Package },
    ];
    
    if (currentUser?.permissions?.canCreateProducts) {
      operationsItems.push({ id: 'products', label: t('product_mgmt'), icon: Package });
    }
    
    if (currentUser?.permissions?.canCreateLabels) {
      operationsItems.push({ id: 'labels', label: t('label_mgmt'), icon: Terminal });
    }

    const insightItems = [];
    if (currentUser?.permissions?.canViewReports) {
      insightItems.push({ id: 'reports', label: t('reporting'), icon: BarChart2 });
    }

    const menu = [
      {
        label: t('operations'),
        items: operationsItems
      },
      {
        label: t('incident_control'),
        items: [
          { id: 'issues', label: t('incident_control'), icon: AlertCircle },
        ]
      },
      {
        label: t('general'),
        items: [
          { id: 'settings', label: t('settings'), icon: Settings },
        ]
      }
    ];

    if (insightItems.length > 0) {
      menu.push({
        label: t('insights'),
        items: insightItems
      });
    }

    // Inventory Manager Role
    if (isInventoryManager) {
      return [
        {
          label: t('inventory_mgmt'),
          items: [
            { id: 'dashboard', label: t('overview'), icon: LayoutGridIcon },
            { id: 'products', label: t('product_mgmt'), icon: Package },
            { id: 'categories', label: t('category_mgmt'), icon: Layers },
          ]
        },
        {
          label: t('label_mgmt'),
          items: [
            { id: 'labels', label: t('label_mgmt'), icon: Terminal },
          ]
        },
        {
          label: t('insights'),
          items: [
            { id: 'reports', label: t('reporting'), icon: BarChart2 },
          ]
        },
        {
          label: t('general'),
          items: [
            { id: 'settings', label: t('profile'), icon: Settings },
            { id: 'support', label: t('support_tickets'), icon: HelpCircle },
          ]
        }
      ];
    }

    // Stock Controller Role
    if (isStock) {
      return [
        {
          label: t('operations'),
          items: [
            { id: 'dashboard', label: t('overview'), icon: LayoutGridIcon },
            { id: 'inventory', label: t('inventory_mgmt'), icon: Package },
          ]
        },
        {
          label: t('incident_control'),
          items: [
            { id: 'issues', label: t('incident_control'), icon: AlertCircle },
          ]
        },
        {
          label: t('general'),
          items: [
            { id: 'settings', label: t('profile'), icon: Settings },
            { id: 'support', label: t('support_tickets'), icon: HelpCircle },
          ]
        }
      ];
    }

    return menu;
  };

  const menuGroups = getMenuGroups();

  return (
    <aside className="h-full flex flex-col bg-white dark:bg-[#1C2434] border-r border-[#E2E8F0] dark:border-slate-800 transition-colors duration-300 relative overflow-hidden shadow-sm">
      
      {/* Background Subtle Gradient (Light Mode) */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#5750F1]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

      <div className="flex items-center gap-2.5 px-4 py-2 relative z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-none bg-white dark:bg-[#1C2434] text-white shadow-lg border border-slate-100 dark:border-slate-800 transform hover:scale-105 transition-transform overflow-hidden group">
          <img 
            src={currentUser?.companyLogo || "/logo.jpg"} 
            alt="Logo" 
            className="h-full w-full object-contain p-1"
            onError={(e) => {
              (e.target as any).src = "/logo.jpg";
            }}
          />
        </div>
        <div className="min-w-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <p className="text-[15px] font-black text-[#111928] dark:text-white tracking-tight leading-none truncate max-w-[180px]">
                {currentUser?.role === 'staff' 
                  ? (currentUser?.branchName || 'Kitzu-Tech')
                  : (currentUser?.companyName || 'Kitzu-Tech')}
              </p>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#5750F1] mt-1.5">{t('platform_brand_name')}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden ml-auto p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation (NextAdmin Consistency) */}
      <div className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar relative z-10 pt-2">
        {menuGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#637381] dark:text-slate-500 mb-2 opacity-80">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = selectedTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (selectedTab !== item.id) {
                        setSelectedTab(item.id);
                      }
                      if (onClose) onClose();
                    }}
                    className={`group relative flex w-full items-center gap-3.5 rounded-none px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                      active 
                        ? 'bg-[#5750F1] text-white shadow-lg shadow-[#5750F1]/30' 
                        : 'text-[#637381] dark:text-slate-400 hover:text-[#5750F1] dark:hover:text-[#5750F1] hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 transition-all duration-300 ${
                      active ? 'text-white scale-110' : 'text-[#637381] dark:text-slate-500 group-hover:text-[#5750F1]'
                    }`} strokeWidth={active ? 2.5 : 2} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {active && <div className="h-full w-1.5 bg-[#10B981] absolute left-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Identity (Premium Role Display) */}
      <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-[#1C2434]/50 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-3 mb-3 p-1.5 rounded-none group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
          <div className="relative shrink-0">
            <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser?.name || 'User'} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center font-black text-slate-400 text-xs text-center uppercase">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-[#10B981] border-2 border-white dark:border-slate-800 shadow-sm" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#111928] dark:text-white leading-none mb-1.5">{currentUser?.name || 'Loading...'}</p>
            <div className="flex flex-col gap-0.5">
              <p className="truncate text-[9px] font-bold text-[#5750F1] uppercase tracking-widest">
                {currentUser?.role === 'staff' 
                  ? (currentUser?.position || 'Staff Member')
                  : currentUser?.role === 'vendor' 
                    ? 'Business Owner' 
                    : currentUser?.role === 'admin' 
                      ? 'System Administrator'
                      : currentUser?.role === 'stock'
                        ? 'Stock Controller'
                        : currentUser?.role === 'inventory_manager'
                          ? 'Inventory Manager'
                          : currentUser?.role}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full h-9 flex items-center justify-center gap-2 rounded-none text-[#637381] dark:text-slate-400 hover:text-[#FB5050] dark:hover:text-[#FB5050] hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all font-bold text-xs border border-transparent hover:border-rose-200"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
};
