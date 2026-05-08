'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Promotion, Product } from '@/types/vendor';

interface PromotionManagementModalProps {
  showCreatePromotion: boolean;
  setShowCreatePromotion: (show: boolean) => void;
  editingPromotion: Promotion | null;
  setEditingPromotion: (promo: Promotion | null) => void;
  promotionForm: any;
  setPromotionForm: (form: any) => void;
  createPromotion: (e: React.FormEvent) => void;
  updatePromotion: (e: React.FormEvent) => void;
  products: Product[];
}

export const PromotionManagementModal = ({
  showCreatePromotion,
  setShowCreatePromotion,
  editingPromotion,
  setEditingPromotion,
  promotionForm,
  setPromotionForm,
  createPromotion,
  updatePromotion,
  products
}: PromotionManagementModalProps) => {
  const handleClose = () => {
    setShowCreatePromotion(false);
    setEditingPromotion(null);
  };

  const isOpen = showCreatePromotion || !!editingPromotion;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
           <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-[#1C2434] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                 <div>
                    <h3 className="text-lg md:text-xl font-bold text-[#111928] dark:text-white">
                       {editingPromotion ? 'Edit Promotion' : 'Create New Campaign'}
                    </h3>
                    <p className="text-[10px] md:text-xs font-medium text-[#637381] mt-1">Configure discount rules and targeting.</p>
                 </div>
                 <Button variant="ghost" size="sm" onClick={handleClose} className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X className="h-5 w-5" />
                 </Button>
              </div>

              <form onSubmit={editingPromotion ? updatePromotion : createPromotion} className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Promotion Name</label>
                       <Input required placeholder="e.g. Summer Clearance" value={promotionForm.name} onChange={(e) => setPromotionForm({...promotionForm, name: e.target.value})} className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Description</label>
                       <Input placeholder="Describe the campaign details..." value={promotionForm.description} onChange={(e) => setPromotionForm({...promotionForm, description: e.target.value})} className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">Discount Type</label>
                       <select className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all text-[#111928] dark:text-white" value={promotionForm.type} onChange={(e) => setPromotionForm({...promotionForm, type: e.target.value as any})}>
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount ($)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">Discount Value</label>
                       <Input required type="number" value={promotionForm.value} onChange={(e) => setPromotionForm({...promotionForm, value: Number(e.target.value)})} className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all" />
                    </div>

                    {/* Targeting Section */}
                    <div className="space-y-4 md:col-span-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                       <h4 className="text-sm font-bold text-[#111928] dark:text-white uppercase tracking-wider">Campaign Target</h4>
                       <div className="flex flex-col sm:flex-row gap-4">
                          <button 
                             type="button"
                             onClick={() => setPromotionForm({...promotionForm, applyTo: 'all'})}
                             className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${promotionForm.applyTo === 'all' ? 'border-[#5750F1] bg-[#5750F1]/5' : 'border-slate-100 dark:border-slate-800'}`}
                          >
                             <div className={`h-4 w-4 rounded-full border-2 mb-2 flex items-center justify-center ${promotionForm.applyTo === 'all' ? 'border-[#5750F1]' : 'border-slate-300'}`}>
                                {promotionForm.applyTo === 'all' && <div className="h-2 w-2 rounded-full bg-[#5750F1]" />}
                             </div>
                             <p className="text-xs font-bold text-[#111928] dark:text-white uppercase">Entire Inventory</p>
                             <p className="text-[10px] text-[#637381] mt-1">Apply discount to every label in selected branches.</p>
                          </button>
                          <button 
                             type="button"
                             onClick={() => setPromotionForm({...promotionForm, applyTo: 'selected'})}
                             className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${promotionForm.applyTo === 'selected' ? 'border-[#5750F1] bg-[#5750F1]/5' : 'border-slate-100 dark:border-slate-800'}`}
                          >
                             <div className={`h-4 w-4 rounded-full border-2 mb-2 flex items-center justify-center ${promotionForm.applyTo === 'selected' ? 'border-[#5750F1]' : 'border-slate-300'}`}>
                                {promotionForm.applyTo === 'selected' && <div className="h-2 w-2 rounded-full bg-[#5750F1]" />}
                             </div>
                             <p className="text-xs font-bold text-[#111928] dark:text-white uppercase">Selected Products</p>
                             <p className="text-[10px] text-[#637381] mt-1">Choose specific inventory items for this campaign.</p>
                          </button>
                       </div>

                       {promotionForm.applyTo === 'selected' && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                             <label className="text-[10px] font-black text-[#637381] uppercase tracking-widest">Select Products ({promotionForm.selectedProducts.length} selected)</label>
                             <div className="max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-50 dark:divide-slate-800 custom-scrollbar">
                                {products.map(p => (
                                   <label key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                                      <input 
                                         type="checkbox" 
                                         className="h-4 w-4 rounded border-slate-300 text-[#5750F1] focus:ring-[#5750F1]"
                                         checked={promotionForm.selectedProducts.includes(p.id)}
                                         onChange={(e) => {
                                            const checked = e.target.checked;
                                            const current = promotionForm.selectedProducts;
                                            setPromotionForm({
                                               ...promotionForm,
                                               selectedProducts: checked ? [...current, p.id] : current.filter(id => id !== p.id)
                                            });
                                         }}
                                      />
                                      <div className="min-w-0">
                                         <p className="text-xs font-bold text-[#111928] dark:text-white truncate">{p.name}</p>
                                         <p className="text-[9px] text-[#637381] font-mono uppercase tracking-widest">{p.sku}</p>
                                      </div>
                                   </label>
                                ))}
                             </div>
                          </motion.div>
                       )}
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">Start Date</label>
                       <Input required type="datetime-local" value={promotionForm.startDate} onChange={(e) => setPromotionForm({...promotionForm, startDate: e.target.value})} className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all text-sm" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">End Date</label>
                       <Input required type="datetime-local" value={promotionForm.endDate} onChange={(e) => setPromotionForm({...promotionForm, endDate: e.target.value})} className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all text-sm" />
                    </div>
                 </div>

                 <div className="flex justify-end gap-3 mt-10">
                    <Button type="button" variant="ghost" onClick={handleClose} className="h-11 px-6 font-bold">Cancel</Button>
                    <Button type="submit" className="h-11 px-8 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] font-bold shadow-lg shadow-[#5750F1]/20">
                       {editingPromotion ? 'Update Promotion' : 'Start Campaign'}
                    </Button>
                 </div>
              </form>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
