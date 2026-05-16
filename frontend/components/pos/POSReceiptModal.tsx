'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CartItem } from './types';

interface POSReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    items: CartItem[];
    total: number;
    date: Date;
  } | null;
  branch: any;
}

export const POSReceiptModal = ({
  isOpen,
  onClose,
  order,
  branch
}: POSReceiptModalProps) => {
  const { t } = useLanguage();

  if (!order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-white shadow-2xl overflow-hidden text-[#111928]"
          >
            <div className="p-8 font-mono">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50 text-emerald-500 mb-4">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest">{t('thank_you')}</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">{branch?.name || 'Kitzu-Tech Retail'}</p>
              </div>

              <div className="border-y border-dashed border-slate-200 py-4 mb-4 text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase">Order ID</span>
                  <span className="font-bold">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase">Date</span>
                  <span className="font-bold">{order.date.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-[11px]">
                    <div className="pr-4">
                      <p className="font-bold uppercase leading-tight">{item.name}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{item.quantity} x ${item.price.toFixed(2)}</p>
                    </div>
                    <span className="font-bold shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-xs font-black uppercase">
                  <span>{t('grand_total')}</span>
                  <span className="text-blue-600">${order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-dashed border-slate-200 text-center">
                <div className="inline-block p-4 bg-slate-50 mb-4">
                   <div className="w-32 h-8 border-x-2 border-slate-200 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black opacity-20">BARCODE</div>
                   </div>
                </div>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em]">www.kitzu-tech.com</p>
              </div>

              <div className="mt-8 flex gap-2 no-print">
                <Button variant="outline" className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest rounded-none border-slate-200" onClick={() => window.print()}>
                   {t('print_receipt')}
                </Button>
                <Button className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest rounded-none bg-[#111928] text-white" onClick={onClose}>
                   {t('close')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
