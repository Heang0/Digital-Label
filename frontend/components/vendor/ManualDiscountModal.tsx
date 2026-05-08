'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ManualDiscountModalProps {
  activeDiscountModal: {labelId: string, productId: string, branchId: string, currentPercent: number} | null;
  setActiveDiscountModal: (modal: any) => void;
  executeManualDiscount: (percent: number) => void;
  openLabelNotice: (title: string, message: string, tone: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ManualDiscountModal = ({
  activeDiscountModal,
  setActiveDiscountModal,
  executeManualDiscount,
  openLabelNotice
}: ManualDiscountModalProps) => {
  return (
    <AnimatePresence>
      {activeDiscountModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveDiscountModal(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-[#1C2434] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-8 text-center border-b border-slate-50 dark:border-slate-800">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/10">
                <Tag className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-[#111928] dark:text-white mb-2">Price Override</h3>
              <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mb-8 px-2">Apply a manual discount percentage to this specific electronic label.</p>
              <div className="relative">
                <Input 
                  autoFocus
                  min="1"
                  max="100"
                  defaultValue={activeDiscountModal.currentPercent || ""}
                  placeholder="e.g. 15"
                  className="w-full h-14 pl-6 pr-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-2xl font-black text-[#111928] dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300 placeholder:font-medium"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      if (!isNaN(val) && val > 0 && val <= 100) executeManualDiscount(val);
                    }
                  }}
                  id="discount-input"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-black text-xl">%</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-5 bg-slate-50/50 dark:bg-slate-900/30">
              <Button variant="ghost" onClick={() => setActiveDiscountModal(null)} className="flex-1 font-bold text-xs h-11 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
              <Button onClick={() => {
                const el = document.getElementById('discount-input') as HTMLInputElement;
                const val = parseFloat(el?.value || '0');
                if (!isNaN(val) && val > 0 && val <= 100) executeManualDiscount(val);
                else openLabelNotice("Invalid discount", "Please enter a valid percentage between 1 and 100.", "error");
              }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-11 shadow-lg shadow-indigo-500/25 border-none">Update Price</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
