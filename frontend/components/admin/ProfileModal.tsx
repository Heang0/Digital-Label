'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileUpload } from './ProfileUpload';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md bg-white dark:bg-[#24303F] rounded-[20px] shadow-2xl overflow-hidden border border-[#E2E8F0] dark:border-slate-800 max-h-[90vh] flex flex-col pointer-events-auto transition-colors">
              <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] dark:border-slate-800 shrink-0">
                <h2 className="text-lg font-bold text-[#111928] dark:text-white">Manage Profile</h2>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-xl text-[#637381] dark:text-slate-400 hover:text-[#111928] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                <ProfileUpload />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
