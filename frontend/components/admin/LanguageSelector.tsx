'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'km' : 'en');
  };

  const flags = {
    en: "https://flagcdn.com/w160/us.png",
    km: "https://flagcdn.com/w160/kh.png"
  };

  return (
    <button
      onClick={toggleLanguage}
      className="relative h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
      title={language === 'en' ? 'Switch to Khmer' : 'Switch to English'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={language}
          initial={{ y: 20, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -20, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.3, ease: 'backOut' }}
          className="w-full h-full p-0.5"
        >
          <img 
            src={flags[language]} 
            alt={language}
            className="w-full h-full object-cover rounded-full shadow-inner"
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Premium Glass Effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-white/10 pointer-events-none rounded-full" />
    </button>
  );
};
