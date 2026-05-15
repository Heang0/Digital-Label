'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load from localStorage on mount and apply styles
  useEffect(() => {
    const saved = localStorage.getItem('app_language') as Language;
    const lang = saved && (saved === 'en' || saved === 'km') ? saved : 'en';
    setLanguageState(lang);
    
    // Apply Khmer-specific class for font and no-bold
    if (lang === 'km') {
      document.documentElement.classList.add('lang-km');
    } else {
      document.documentElement.classList.remove('lang-km');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    
    if (lang === 'km') {
      document.documentElement.classList.add('lang-km');
    } else {
      document.documentElement.classList.remove('lang-km');
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        // Fallback to English if key missing in current language
        let fallback: any = translations['en'];
        for (const fk of keys) {
          if (fallback && fallback[fk]) {
            fallback = fallback[fk];
          } else {
            return key; // Return the key itself as a last resort
          }
        }
        return fallback;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
