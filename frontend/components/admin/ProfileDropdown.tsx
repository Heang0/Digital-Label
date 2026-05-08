'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/lib/user-store';
import { logOut } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface ProfileDropdownProps {
  onTabChange: (tab: 'overview' | 'users' | 'companies' | 'analytics' | 'settings') => void;
}

export const ProfileDropdown = ({ onTabChange }: ProfileDropdownProps) => {
  const { user, clearUser } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
      clearUser();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3.5 cursor-pointer group"
      >
        <div className="relative">
          <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-[#E2E8F0] dark:border-slate-700 ring-2 ring-transparent group-hover:ring-[#5750F1]/20 transition-all">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center font-bold text-slate-400 text-xs">
                {user?.name?.charAt(0)}
              </div>
            )}
          </div>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#10B981] border-2 border-white dark:border-[#1C2434]" />
        </div>
        
        <div className="flex items-center gap-2.5 hidden sm:flex">
          <div className="text-left">
            <p className="text-sm font-bold text-[#111928] dark:text-white leading-none mb-1 group-hover:text-[#5750F1] transition-colors">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] font-medium text-[#637381] dark:text-slate-500 uppercase tracking-widest">
              Administrator
            </p>
          </div>
          <ChevronDown className={`h-4 w-4 text-[#637381] dark:text-slate-400 group-hover:text-[#111928] dark:group-hover:text-white transition-all ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#1C2434] rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-slate-800 z-[100] overflow-hidden"
          >
            {/* User Info Header */}
            <div className="p-5 border-b border-[#E2E8F0] dark:border-slate-800">
              <p className="text-sm font-bold text-[#111928] dark:text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs font-medium text-[#637381] dark:text-slate-400 truncate mt-0.5">
                {user?.email || 'user@nextadmin.com'}
              </p>
            </div>

            {/* Menu Links */}
            <div className="p-2">
              <button 
                onClick={() => {
                  onTabChange('settings');
                  setIsOpen(false);
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('set-settings-tab', { detail: 'profile' }));
                  }, 100);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-[#637381] dark:text-slate-400 hover:text-[#5750F1] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all group"
              >
                <User className="h-4 w-4" />
                View profile
              </button>
              <button 
                onClick={() => {
                  onTabChange('settings');
                  setIsOpen(false);
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('set-settings-tab', { detail: 'security' }));
                  }, 100);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-[#637381] dark:text-slate-400 hover:text-[#5750F1] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all group"
              >
                <Settings className="h-4 w-4" />
                Account Settings
              </button>
            </div>

            {/* Logout Footer */}
            <div className="p-2 border-t border-[#E2E8F0] dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-[#FB5050] hover:bg-[#FB5050]/5 rounded-xl transition-all"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
