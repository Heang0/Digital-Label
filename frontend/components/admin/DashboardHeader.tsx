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
      case 'overview': return 'Digital Dashboard';
      case 'dashboard': return 'Inventory Console';
      case 'users': return 'Vendor Management';
      case 'companies': return 'Retail Ecosystem';
      case 'products': return 'Product Repository';
      case 'categories': return 'Inventory Classification';
      case 'labels': return 'Electronic Labels';
      case 'staff': return 'Team Management';
      case 'promotions': return 'Growth Marketing';
      case 'sales': return 'Sales Intelligence';
      case 'support': return 'Support Center';
      case 'settings': return 'Account Workspace';
      default: return 'Management Console';
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
            <div className="hidden md:block">
               <p className="text-[10px] font-bold text-[#637381] dark:text-slate-500 uppercase tracking-[0.2em] mb-1">
                 {title === 'overview' ? 'Main Menu' : 'Dashboard'}
               </p>
               <h1 className="text-lg font-bold text-[#111928] dark:text-white leading-none tracking-tight">
                 {getPageTitle(title)}
               </h1>
            </div>

            <div className="hidden lg:block">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[#637381] group-focus-within:text-[#5750F1] transition-colors" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-[240px] h-10 pl-11 pr-4 rounded-none bg-[#F3F4F6] dark:bg-[#24303F] border-transparent text-xs font-medium text-[#111928] dark:text-white placeholder-[#637381] focus:bg-white dark:focus:bg-slate-800 focus:border-[#5750F1] outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Action Console & Profile */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Action Group */}
            <div className="flex items-center gap-2 sm:gap-4 border-r border-[#E2E8F0] dark:border-slate-700 pr-3 sm:pr-6">
              <ThemeToggle />
              <NotificationDropdown />
              <button 
                onClick={onRefresh}
                className={`h-10 w-10 flex items-center justify-center rounded-none bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 ${isRefreshing ? 'animate-spin text-[#5750F1]' : ''}`}
              >
                 <RefreshCw className="h-4.5 w-4.5 text-[#637381] dark:text-slate-400" />
              </button>
            </div>

            {/* NextAdmin Profile */}
            <ProfileDropdown onTabChange={onTabChange} />
          </div>
        </div>
      </header>

    </>
  );
};
