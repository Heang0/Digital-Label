'use client';

import { useState, useEffect } from 'react';
import { Menu, RefreshCw, Search, ChevronDown, Bell, MessageSquare, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/user-store';
import { ProfileModal } from './ProfileModal';
import { ThemeToggle } from './ThemeToggle';
import { ProfileDropdown } from './ProfileDropdown';
import { NotificationDropdown } from './NotificationDropdown';
import { SearchInput } from './SearchInput';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface HeaderProps {
  onMenuOpen: () => void;
  onRefresh: () => void;
  title: string;
  isRefreshing?: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: any) => void;
}

export const DashboardHeader = ({ 
  onMenuOpen, 
  onRefresh, 
  title, 
  isRefreshing,
  searchTerm,
  onSearchChange,
  onTabChange
}: HeaderProps) => {
  const { user } = useUserStore();
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);

  // Simulate progress when refreshing
  useEffect(() => {
    let interval: any;
    if (isRefreshing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + (Math.random() * 15) : prev));
      }, 200);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 400);
    }
    return () => clearInterval(interval);
  }, [isRefreshing]);

  // Map internal tab IDs to professional titles
  const getPageTitle = (tab: string) => {
    switch(tab) {
      case 'overview': return t('overview');
      case 'dashboard': return t('overview');
      case 'labels': return t('label_mgmt');
      case 'products': return t('product_mgmt');
      case 'categories': return t('category_mgmt');
      case 'staff': return t('staff_mgmt');
      case 'branches': return t('branch_mgmt');
      case 'promotions': return t('promo_scheduler');
      case 'sales': return t('sales_intelligence');
      case 'activity': return t('activity_log');
      case 'support': return t('support_center');
      case 'settings': return t('settings');
      case 'audit': return t('audit');
      case 'sync': return t('sync');
      case 'label-ui': return t('label_ui');
      case 'analytics': return t('analytics');
      case 'pos': return t('pos_system');
      case 'reports': return t('reporting');
      case 'analytics': return t('scan_analytics');
      case 'audit': return t('tenant_audit');
      case 'rbac': return t('rbac');
      case 'inventory': return t('inventory');
      default: return t('overview');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex w-full glass border-b border-[#E2E8F0] dark:border-[#2E3A47] transition-colors duration-300 h-20 shadow-none">
        {/* Modern "Filling" Loading Indicator (Absolute positioned at top) */}
        <div className="absolute top-0 left-0 w-full overflow-hidden h-[3px] pointer-events-none">
          <AnimatePresence>
            {(isRefreshing || progress > 0) && (
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                exit={{ opacity: 0 }}
                transition={{ 
                  width: { type: 'spring', damping: 20, stiffness: 50 },
                  opacity: { duration: 0.3 } 
                }}
                className="h-full bg-gradient-to-r from-[#5750F1] to-[#10B981] shadow-[0_0_8px_rgba(87,80,241,0.5)]"
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-grow items-center justify-between px-4 lg:px-10">
          
          {/* Left Side: Professional Title & Breadcrumb */}
          <div className="flex items-center gap-4 lg:gap-8">
            <button
              onClick={onMenuOpen}
              className="lg:hidden h-10 w-10 flex items-center justify-center rounded-none border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#5750F1] shadow-sm hover:bg-slate-50 transition-all"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>

            {/* Title Cluster (Professional Breadcrumb style in Header) */}
            <div 
              className="hidden md:block cursor-pointer group"
              onClick={() => onTabChange('dashboard')}
            >
               <p className="text-[10px] font-semibold text-[#637381] dark:text-slate-500 uppercase tracking-[0.2em] mb-1 group-hover:text-[#5750F1] transition-colors">
                 {title === 'overview' ? t('admin_workspace') : t('overview')}
               </p>
               <h1 className="text-lg font-semibold text-[#111928] dark:text-white leading-none tracking-tight group-hover:text-[#5750F1] transition-colors">
                 {getPageTitle(title)}
               </h1>
            </div>

            <div className="hidden lg:block">
              <SearchInput 
                value={searchTerm}
                onChange={onSearchChange}
                placeholder={t('search_resources')}
                className="w-[280px]"
              />
            </div>
          </div>

          {/* Right Side: Action Console & Profile */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Action Group */}
            <div className="flex items-center gap-2 sm:gap-4 border-r border-[#E2E8F0] dark:border-slate-700 pr-3 sm:pr-6">
              <LanguageSelector />
              <ThemeToggle />
              <NotificationDropdown onTabChange={onTabChange} />
              <button 
                onClick={() => {
                  if (title === 'labels') {
                    onRefresh();
                  } else {
                    onRefresh();
                  }
                }}
                className={`h-10 w-10 flex items-center justify-center rounded-none bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 ${isRefreshing ? 'animate-spin text-[#10B981]' : ''}`}
                title={title === 'labels' ? 'Global Hardware Sync' : 'Refresh Data'}
              >
                 <RefreshCw className={`h-4.5 w-4.5 ${title === 'labels' ? 'text-[#10B981]' : 'text-[#637381] dark:text-slate-400'}`} />
              </button>
            </div>
            <ProfileDropdown onTabChange={onTabChange} />
          </div>
        </div>
      </header>

    </>
  );
};
