'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-10 w-10" />;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 group"
    >
      <div className="relative h-5 w-5 overflow-hidden">
        <Sun className={`h-5 w-5 text-amber-500 transition-all duration-500 ${
          theme === 'dark' ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'
        }`} />
        <Moon className={`absolute inset-0 h-5 w-5 text-indigo-400 transition-all duration-500 ${
          theme === 'dark' ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
        }`} />
      </div>
      
      {/* Tooltip */}
      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
      </span>
    </button>
  );
};
