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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/user-store';
import { motion } from 'framer-motion';

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
  const isAdmin = currentUser?.role === 'admin';
  const isVendor = currentUser?.role === 'vendor';
  const isStaff = currentUser?.role === 'staff';
  const isManager = currentUser?.position === 'Manager';

  const getMenuGroups = () => {
    if (isAdmin) return [
      {
        label: 'Main Menu',
        items: [
          { id: 'overview', label: 'Dashboard', icon: LayoutGridIcon },
          { id: 'users', label: 'Vendors', icon: Users },
          { id: 'companies', label: 'Companies', icon: Building2 },
        ]
      },
      {
        label: 'Insights',
        items: [
          { id: 'sales', label: 'Sales Intelligence', icon: Activity },
          { id: 'staff', label: 'Team Management', icon: Users },
        ],
      },
      {
        label: 'Expansion',
        items: [
          { id: 'add-branch', label: 'Create New Branch', icon: Plus },
        ],
      },
      {
        label: 'Enterprise',
        items: [
          { id: 'settings', label: 'Global Settings', icon: Settings },
          { id: 'support', label: 'Support', icon: HelpCircle },
        ]
      }
    ];

    if (isVendor) return [
      {
        label: 'Inventory',
        items: [
          { id: 'dashboard', label: 'Overview', icon: LayoutGridIcon },
          { id: 'products', label: 'Products', icon: Package },
          { id: 'categories', label: 'Categories', icon: LayoutGridIcon },
          { id: 'labels', label: 'Digital Labels', icon: Terminal },
        ]
      },
      {
        label: 'Operations',
        items: [
          { id: 'staff', label: 'Staff Management', icon: Users },
          { id: 'promotions', label: 'Promotions', icon: Percent },
        ]
      },
      {
        label: 'Expansion',
        items: [
          { id: 'branches', label: 'Manage Branches', icon: Building2 },
        ]
      },
      {
        label: 'General',
        items: [
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'support', label: 'Support', icon: HelpCircle },
        ]
      }
    ];

    // Staff — Manager gets vendor-level nav
    if (isManager) return [
      {
        label: 'Branch Management',
        items: [
          { id: 'dashboard', label: 'Overview', icon: LayoutGridIcon },
          { id: 'products', label: 'Products', icon: Package },
          { id: 'categories', label: 'Categories', icon: LayoutGridIcon },
          { id: 'labels', label: 'Digital Labels', icon: Terminal },
        ]
      },
      {
        label: 'Team',
        items: [
          { id: 'staff', label: 'Staff', icon: Users },
          { id: 'issues', label: 'Reported Issues', icon: AlertCircle },
        ]
      },
      {
        label: 'Insights',
        items: [
          { id: 'reports', label: 'Performance', icon: BarChart2 },
        ]
      },
      {
        label: 'General',
        items: [
          { id: 'settings', label: 'Settings', icon: Settings },
        ]
      }
    ];

    // Regular staff (Cashier, Stock, IT, etc.)
    return [
      {
        label: 'Operations',
        items: [
          { id: 'dashboard', label: 'Overview', icon: LayoutGridIcon },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'labels', label: 'Labels', icon: Terminal },
        ]
      },
      {
        label: 'Incident Control',
        items: [
          { id: 'issues', label: 'Reported Issues', icon: AlertCircle },
        ]
      },
      {
        label: 'Insights',
        items: [
          { id: 'reports', label: 'Performance', icon: BarChart2 },
        ]
      },
      {
        label: 'General',
        items: [
          { id: 'settings', label: 'Profile', icon: Settings },
          { id: 'support', label: 'Help Desk', icon: HelpCircle },
        ]
      }
    ];
  };

  const menuGroups = getMenuGroups();

  return (
    <aside className="h-full flex flex-col bg-white dark:bg-[#1C2434] border-r border-[#E2E8F0] dark:border-slate-800 transition-colors duration-300 relative overflow-hidden shadow-sm">
      
      {/* Background Subtle Gradient (Light Mode) */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#5750F1]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

      {/* Brand Identity */}
      <div className="flex items-center gap-4 px-8 py-10 relative z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-none bg-[#5750F1] text-white shadow-xl shadow-[#5750F1]/30 transform hover:scale-105 transition-transform">
          <Zap className="h-6 w-6 fill-current" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <p className="text-xl font-bold text-[#111928] dark:text-white tracking-tighter leading-none truncate max-w-[120px]">
                {currentUser?.role === 'staff' 
                  ? (currentUser?.branchName || 'NextAdmin')
                  : (currentUser?.companyName || 'NextAdmin')}
              </p>
              <span className="bg-[#5750F1] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-none shadow-sm shadow-[#5750F1]/20">PRO</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#637381] dark:text-slate-400 mt-1.5">Digital Label System</p>
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
            <p className="px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#637381] dark:text-slate-500 mb-2 opacity-80">
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
                      setSelectedTab(item.id);
                      if (onClose) onClose();
                    }}
                    className={`group relative flex w-full items-center gap-3.5 rounded-none px-5 py-3 text-sm font-semibold transition-all duration-300 ${
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
      <div className="p-6 mt-auto border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-[#1C2434]/50 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-3 mb-6 p-2.5 rounded-none group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
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
                      : currentUser?.role}
              </p>
              {currentUser?.branchId && (
                <p className="truncate text-[8px] font-semibold text-[#637381] dark:text-slate-500 uppercase tracking-tight">
                  <span className="opacity-50">Branch:</span> {currentUser.branchName || 'Primary Location'}
                </p>
              )}
              {currentUser?.role === 'vendor' && currentUser?.companyId && (
                <p className="truncate text-[8px] font-semibold text-[#637381] dark:text-slate-500 uppercase tracking-tight">
                  <span className="opacity-50">Corporate ID:</span> {currentUser.companyId.slice(0, 8)}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-none text-[#637381] dark:text-slate-400 hover:text-[#FB5050] dark:hover:text-[#FB5050] hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all font-bold text-xs border border-transparent hover:border-rose-200"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
};
