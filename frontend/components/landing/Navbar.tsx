'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Store, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '../admin/LanguageSelector';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur"
    >
      <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex items-center gap-2"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.jpg" 
                alt="Logo" 
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                  (e.target as any).nextSibling.style.display = 'block';
                }}
              />
              <Store className="h-5 w-5 text-white hidden" />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900 uppercase">
              Kitzu-Tech
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { id: 'features', label: t('features') },
              { id: 'usecases', label: t('use_cases') },
              { id: 'pricing', label: t('pricing') },
              { id: 'contact', label: t('contact') }
            ].map((item, index) => (
              <motion.a
                key={item.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                href={`#${item.id}`}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </motion.a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSelector />
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Link href="/login">
                <Button variant="outline" size="sm" className="relative overflow-hidden group">
                  <span className="relative z-10">{t('sign_in')}</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Link href="/register">
                <Button size="sm" className="relative overflow-hidden group">
                  <span className="relative z-10">{t('get_started')}</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                </Button>
              </Link>
            </motion.div>
          </div>
          
          {/* Mobile menu toggle */}
          <motion.button
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            type="button"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>
        </div>
      </div>
      
      {mobileOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden border-t bg-white overflow-hidden"
        >
          <div className="container mx-auto px-4 lg:px-10 max-w-6xl py-4 space-y-3">
            {[
              { id: 'features', label: t('features') },
              { id: 'usecases', label: t('use_cases') },
              { id: 'pricing', label: t('pricing') },
              { id: 'contact', label: t('contact') }
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors py-2 border-b border-gray-50"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2 pb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{t('language') || 'Language'}</span>
              <LanguageSelector />
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  {t('sign_in')}
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">
                  {t('get_started')}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};
