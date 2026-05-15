'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MapPin, Check, Wand2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface SmartAutoMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (prefix: string, forceAll: boolean) => Promise<void>;
  count: number;
}

export const SmartAutoMapModal = ({ isOpen, onClose, onConfirm, count }: SmartAutoMapModalProps) => {
  const { t } = useLanguage();
  const [selectedPrefix, setSelectedPrefix] = useState('Aisle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [forceAll, setForceAll] = useState(false);

  const options = [
    { value: 'Aisle', labelKey: 'layout_option_aisle' },
    { value: 'Shelf', labelKey: 'layout_option_shelf' },
    { value: 'Row', labelKey: 'layout_option_row' },
    { value: 'Rack', labelKey: 'layout_option_rack' },
    { value: 'Bin', labelKey: 'layout_option_bin' },
  ];
  const selectedPrefixLabel = t(
    options.find((option) => option.value === selectedPrefix)?.labelKey || 'layout_option_aisle'
  );

  const handleApply = async () => {
    setIsProcessing(true);
    try {
      await (onConfirm as any)(selectedPrefix, forceAll);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-lg bg-white dark:bg-[#1C2434] rounded-none shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-none bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#111928] dark:text-white uppercase tracking-tight">{t('smart_layout_architect')}</h2>
                    <p className="text-[10px] font-bold text-[#637381] uppercase tracking-widest mt-0.5">{t('bulk_hardware_organization')}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none text-slate-400 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar">
               <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                     <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">{t('select_new_convention')}</label>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                     {options.map((option) => (
                        <button
                           key={option.value}
                           onClick={() => setSelectedPrefix(option.value)}
                           className={`h-11 rounded-none text-[10px] font-black transition-all uppercase tracking-widest ${
                              selectedPrefix === option.value
                              ? 'bg-[#5750F1] text-white shadow-lg shadow-indigo-500/20' 
                              : 'bg-slate-50 dark:bg-slate-900/50 text-[#637381] border border-slate-100 dark:border-slate-800 hover:border-indigo-200'
                           }`}
                        >
                           {t(option.labelKey)}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                     <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">{t('select_operation_scope')}</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <button
                        onClick={() => setForceAll(false)}
                        className={`p-4 rounded-none border transition-all text-left group ${
                           !forceAll 
                           ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-[#5750F1] ring-2 ring-[#5750F1]/10' 
                           : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                        }`}
                     >
                        <div className={`h-8 w-8 rounded-none flex items-center justify-center mb-3 ${!forceAll ? 'bg-[#5750F1] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                           <Check className="h-4 w-4" />
                        </div>
                        <p className={`text-xs font-black uppercase tracking-tight ${!forceAll ? 'text-[#111928] dark:text-white' : 'text-slate-400'}`}>{t('fill_gaps')}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 leading-tight">{t('map_only_unassigned_tags')}</p>
                     </button>

                     <button
                        onClick={() => setForceAll(true)}
                        className={`p-4 rounded-none border transition-all text-left group ${
                           forceAll 
                           ? 'bg-rose-50/50 dark:bg-rose-900/20 border-rose-500 ring-2 ring-rose-500/10' 
                           : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                        }`}
                     >
                        <div className={`h-8 w-8 rounded-none flex items-center justify-center mb-3 ${forceAll ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                           <RefreshCw className={`h-4 w-4 ${forceAll ? 'animate-spin-slow' : ''}`} />
                        </div>
                        <p className={`text-xs font-black uppercase tracking-tight ${forceAll ? 'text-rose-600' : 'text-slate-400'}`}>{t('re_map_all')}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 leading-tight">{t('wipe_overwrite_entire_store')}</p>
                     </button>
                  </div>
               </div>

               <div className="p-6 rounded-none bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative group overflow-hidden shadow-inner">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-none bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/50 flex items-center justify-center shadow-sm">
                        <MapPin className="h-6 w-6 text-[#5750F1]" />
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('preview_result')}</p>
                        <p className="text-base font-black text-[#111928] dark:text-white tracking-tight uppercase">
                           DL-007 {'->'} <span className={forceAll ? 'text-rose-500' : 'text-[#5750F1]'}>{selectedPrefixLabel} 007</span>
                        </p>
                     </div>
                  </div>
               </div>

               <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white dark:bg-[#1C2434]">
                  <Button 
                     variant="outline" 
                     onClick={onClose} 
                     className="rounded-none h-10 font-bold px-6"
                  >
                     {t('cancel')}
                  </Button>
                  <Button 
                     onClick={handleApply}
                     disabled={isProcessing}
                     className={`rounded-none h-10 text-white font-bold px-8 shadow-xl gap-2 transition-all active:scale-[0.98] ${
                        forceAll ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[#5750F1] hover:bg-[#4A44D1]'
                     }`}
                  >
                     {isProcessing ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                        <Wand2 className="h-4 w-4" />
                     )}
                     {forceAll ? `${t('re_map_everything_to')} ${selectedPrefixLabel}` : t('auto_map_unassigned_labels')}
                  </Button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
