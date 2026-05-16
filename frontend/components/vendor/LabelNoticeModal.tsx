'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface LabelNoticeModalProps {
  modal: {
    title: string;
    message: string;
    tone: 'info' | 'success' | 'warning' | 'error';
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void | Promise<void>;
  } | null;
  onClose: () => void;
}

export const LabelNoticeModal = ({ modal, onClose }: LabelNoticeModalProps) => {
  const { t } = useLanguage();
  if (!modal) return null;

  const getIcon = () => {
    switch (modal.tone) {
      case 'success': return <CheckCircle2 className="h-6 w-6 text-emerald-500" />;
      case 'error': return <XCircle className="h-6 w-6 text-rose-500" />;
      case 'warning': return <AlertCircle className="h-6 w-6 text-amber-500" />;
      default: return <Info className="h-6 w-6 text-indigo-500" />;
    }
  };

  const getToneColor = () => {
    switch (modal.tone) {
      case 'success': return 'text-emerald-500';
      case 'error': return 'text-rose-500';
      case 'warning': return 'text-amber-500';
      default: return 'text-[#5750F1]';
    }
  };

  return (
    <AnimatePresence>
      {modal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-[#1C2434] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Design Accent */}
            <div className={`h-1.5 w-full ${
              modal.tone === 'success' ? 'bg-emerald-500' :
              modal.tone === 'error' ? 'bg-rose-500' :
              modal.tone === 'warning' ? 'bg-amber-500' :
              'bg-[#5750F1]'
            }`} />

            {/* Header */}
            <div className="px-8 pt-8 pb-6 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-6 shadow-inner">
                {getIcon()}
              </div>
              
              <h3 className="text-xl font-black text-[#111928] dark:text-white uppercase tracking-tight mb-2">
                {modal.title}
              </h3>
              <p className="text-xs font-bold text-[#637381] dark:text-slate-500 uppercase tracking-widest">
                {t('action_response')}
              </p>
            </div>

            <div className="px-8 pb-8">
              <p className="text-sm font-medium text-center text-[#637381] dark:text-slate-400 leading-relaxed mb-8">
                {modal.message}
              </p>

              <div className="flex items-center gap-3">
                {modal.cancelLabel && (
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="flex-1 h-12 rounded-none text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {modal.cancelLabel}
                  </Button>
                )}
                <Button
                  onClick={async () => {
                    if (modal.onConfirm) await modal.onConfirm();
                    onClose();
                  }}
                  className={`flex-1 h-12 rounded-none text-[10px] font-black uppercase tracking-widest text-white border-none shadow-xl transition-all active:scale-[0.98] ${
                    modal.tone === 'error' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 
                    modal.tone === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 
                    'bg-[#5750F1] hover:bg-[#4A44D1] shadow-indigo-500/20'
                  }`}
                >
                  {modal.confirmLabel || t('ok')}
                </Button>
              </div>
            </div>

            {/* Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
