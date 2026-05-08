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
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
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

  const menuGroups = isAdmin ? [
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
        { id: 'analytics', label: 'Performance', icon: BarChart2 },
        { id: 'revenue', label: 'Financials', icon: Wallet },
      ]
    },
    {
      label: 'General',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'support', label: 'Support', icon: HelpCircle },
      ]
    }
  ] : [
    {
      label: 'Inventory',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutGridIcon },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'categories', label: 'Categories', icon: LayoutGridIcon },
        { id: 'labels', label: 'Digital Labels', icon: Tag },
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
      label: 'General',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'support', label: 'Support', icon: HelpCircle },
      ]
    }
  ];

  return (
    <aside className="h-full flex flex-col bg-white dark:bg-[#1C2434] border-r border-[#E2E8F0] dark:border-slate-800 transition-colors duration-300 relative overflow-hidden shadow-sm">
      
      {/* Background Subtle Gradient (Light Mode) */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#5750F1]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

      {/* Brand Identity */}
      <div className="flex items-center gap-3.5 px-8 py-10 relative z-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-none bg-[#5750F1] text-white shadow-lg shadow-[#5750F1]/20">
          <Zap className="h-5.5 w-5.5 fill-current" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-[#111928] dark:text-white tracking-tight leading-none">NextAdmin</p>
            <span className="bg-[#5750F1]/10 text-[#5750F1] text-[8px] font-black px-1.5 py-0.5 rounded-none border border-[#5750F1]/20">PRO</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#637381] dark:text-slate-400 mt-1">Management Console</p>
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
                    className={`group relative flex w-full items-center gap-3.5 rounded-none px-5 py-3 text-sm font-bold transition-all duration-300 ${
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

      {/* Footer Identity (NextAdmin Style) */}
      <div className="p-6 mt-auto border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1C2434] relative z-10">
        <div className="flex items-center gap-3 mb-6 p-2 rounded-none group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-slate-700">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center font-bold text-slate-400 text-xs text-center">
                  {currentUser.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#10B981] border-2 border-white dark:border-slate-800 shadow-sm" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#111928] dark:text-white leading-none mb-1">{currentUser.name}</p>
            <p className="truncate text-[10px] font-medium text-[#637381] dark:text-slate-500 uppercase tracking-widest">{currentUser.role || 'User'}</p>
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
