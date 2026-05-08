'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product } from '@/types';

interface AssignProductModalProps {
  assignProductModal: {labelId: string, branchId: string, labelCode?: string} | null;
  setAssignProductModal: (modal: any) => void;
  assignSearchQuery: string;
  setAssignSearchQuery: (query: string) => void;
  products: Product[];
  assignProductToLabel: (labelId: string, productId: string, branchId: string, labelCode?: string) => void;
}

export const AssignProductModal = ({
  assignProductModal,
  setAssignProductModal,
  assignSearchQuery,
  setAssignSearchQuery,
  products,
  assignProductToLabel
}: AssignProductModalProps) => {
  return (
    <AnimatePresence>
      {assignProductModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => { setAssignProductModal(null); setAssignSearchQuery(''); }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg rounded-none bg-white dark:bg-[#1C2434] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-none bg-[#5750F1]/10 flex items-center justify-center text-[#5750F1]">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111928] dark:text-white">Assign Product Payload</h3>
                  <p className="text-xs font-medium text-[#637381]">Select inventory for this digital label</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setAssignProductModal(null); setAssignSearchQuery(''); }} className="h-8 w-8 text-slate-400 hover:text-[#111928] dark:hover:text-white rounded-none">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-[#24303F]/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#637381]" />
                <Input 
                  autoFocus
                  placeholder="Search by product name or SKU..."
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  className="pl-9 h-11 bg-white dark:bg-[#1C2434] border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-[#5750F1] focus:border-[#5750F1] rounded-none"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-2 flex-1 custom-scrollbar">
              {products
                .filter(p => p.name.toLowerCase().includes(assignSearchQuery.toLowerCase()) || p.sku.toLowerCase().includes(assignSearchQuery.toLowerCase()))
                .map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      assignProductToLabel(assignProductModal.labelId, p.id, assignProductModal.branchId, assignProductModal.labelCode);
                      setAssignProductModal(null);
                      setAssignSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-none hover:bg-slate-50 dark:hover:bg-[#24303F] transition-colors text-left group border border-transparent hover:border-[#5750F1]/20"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#111928] dark:text-white group-hover:text-[#5750F1] transition-colors">{p.name}</p>
                      <p className="text-xs text-[#637381] font-mono mt-0.5 tracking-wider">{p.sku}</p>
                    </div>
                    <div className="h-8 w-8 rounded-none bg-slate-100 dark:bg-[#1C2434] flex items-center justify-center group-hover:bg-[#5750F1] transition-colors">
                       <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-white -rotate-90 transition-colors" />
                    </div>
                  </button>
                ))}
              {products.filter(p => p.name.toLowerCase().includes(assignSearchQuery.toLowerCase()) || p.sku.toLowerCase().includes(assignSearchQuery.toLowerCase())).length === 0 && (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                  <Package className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-bold text-[#111928] dark:text-white">No products found</p>
                  <p className="text-xs text-[#637381] mt-1 max-w-[200px]">Try adjusting your search query to find inventory.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
