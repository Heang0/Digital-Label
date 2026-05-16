'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Banknote, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CartItem } from './types';

interface POSCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'qr';
  setPaymentMethod: (method: 'cash' | 'card' | 'qr') => void;
  isProcessing: boolean;
  handleCheckout: () => void;
}

export const POSCheckoutModal = ({
  isOpen,
  onClose,
  cart,
  subtotal,
  tax,
  total,
  paymentMethod,
  setPaymentMethod,
  isProcessing,
  handleCheckout
}: POSCheckoutModalProps) => {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#1C2434] shadow-2xl rounded-sm overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-[#111928] dark:text-white uppercase tracking-tighter">{t('confirm_payment')}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Finalize Transaction</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 mb-8">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>{t('subtotal')}</span>
                    <span className="text-[#111928] dark:text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>{t('tax')}</span>
                    <span className="text-[#111928] dark:text-white">${tax.toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                    <span className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tighter">{t('grand_total')}</span>
                    <span className="text-2xl font-black text-[#5750F1]">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center justify-center p-4 gap-2 border-2 transition-all ${paymentMethod === 'cash' ? 'border-[#5750F1] bg-[#5750F1]/5 text-[#5750F1]' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'}`}
                  >
                    <Banknote className="h-6 w-6" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{t('cash')}</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center justify-center p-4 gap-2 border-2 transition-all ${paymentMethod === 'card' ? 'border-[#5750F1] bg-[#5750F1]/5 text-[#5750F1]' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'}`}
                  >
                    <CreditCard className="h-6 w-6" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{t('card')}</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('qr')}
                    className={`flex flex-col items-center justify-center p-4 gap-2 border-2 transition-all ${paymentMethod === 'qr' ? 'border-[#5750F1] bg-[#5750F1]/5 text-[#5750F1]' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'}`}
                  >
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="text-[9px] font-black uppercase tracking-widest">KHQR</span>
                  </button>
                </div>
              </div>

              <Button 
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full h-16 bg-[#5750F1] hover:bg-[#4a44d1] text-white rounded-sm font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-[#5750F1]/20 group transition-all"
              >
                {isProcessing ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-3">
                    {t('confirm_payment')}
                    <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
