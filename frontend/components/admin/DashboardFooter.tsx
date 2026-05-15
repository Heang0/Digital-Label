'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';

export const DashboardFooter = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-4 px-8 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-[#1C2434]/50 backdrop-blur-sm">
      <div className="flex items-center justify-center gap-1.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('powered_by')}</p>
        <div className="h-4 w-4 overflow-hidden rounded-sm shadow-sm">
          <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
        </div>
        <p className="text-[10px] font-black text-[#111928] dark:text-white uppercase tracking-[0.2em]">Kitzu-Tech</p>
      </div>
    </footer>
  );
};
