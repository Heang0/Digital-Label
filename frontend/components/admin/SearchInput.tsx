'use client';

import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput = ({ 
  value, 
  onChange, 
  placeholder = "Search anything...", 
  className = "" 
}: SearchInputProps) => {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-[#637381] group-focus-within:text-[#5750F1] transition-colors" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-11 pr-11 bg-white dark:bg-[#1C2434] border-2 border-[#E2E8F0] dark:border-slate-800 rounded-xl text-sm font-medium text-[#111928] dark:text-white placeholder-[#637381] focus:border-[#5750F1] focus:ring-4 focus:ring-[#5750F1]/5 transition-all outline-none"
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#637381] hover:text-[#FB5050] transition-colors"
          >
            <div className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-4 w-4" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
