'use client';

import { motion } from 'framer-motion';
import { Percent, Plus, Edit, Trash2, Calendar, ShoppingBag, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Promotion } from '@/types/vendor';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface PromotionsTabProps {
  promotions: Promotion[];
  setShowCreatePromotion: (show: boolean) => void;
  setEditingPromotion: (promo: Promotion | null) => void;
  setPromotionForm: (form: any) => void;
  handleDeletePromotion: (id: string) => void;
}

export const PromotionsTab = ({
  promotions,
  setShowCreatePromotion,
  setEditingPromotion,
  setPromotionForm,
  handleDeletePromotion
}: PromotionsTabProps) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">{t('campaign_center')}</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">{t('campaign_center_desc')}</p>
        </div>
        <Button onClick={() => setShowCreatePromotion(true)} className="h-11 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2">
          <Plus className="h-4 w-4" />
          {t('new_promotion')}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {promotions.map((promo) => (
          <div key={promo.id} className="premium-card p-6 flex items-start gap-5">
             <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 shrink-0">
                <Percent className="h-7 w-7" />
             </div>
             <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                   <h3 className="text-lg font-bold text-[#111928] dark:text-white truncate">{promo.name}</h3>
                   <div className="flex flex-col justify-between items-end gap-4">
                      <div className="flex gap-2">
                         <Button variant="ghost" size="sm" onClick={() => {
                            setEditingPromotion(promo);
                            setPromotionForm({
                               name: promo.name ?? '',
                               description: promo.description ?? '',
                               type: promo.type,
                               value: promo.value,
                               applyTo: promo.applyTo,
                               selectedProducts: promo.productIds ?? [],
                               selectedBranches: promo.branchIds ?? [],
                               startDate: promo.startDate 
                                 ? (typeof (promo.startDate as any).toDate === 'function' 
                                     ? (promo.startDate as any).toDate() 
                                     : new Date(promo.startDate as any)).toISOString().slice(0, 16) 
                                 : '',
                               endDate: promo.endDate 
                                 ? (typeof (promo.endDate as any).toDate === 'function' 
                                     ? (promo.endDate as any).toDate() 
                                     : new Date(promo.endDate as any)).toISOString().slice(0, 16) 
                                 : '',
                            });
                         }} className="h-9 w-9 p-0 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                            <Edit className="h-4 w-4 text-[#637381]" />
                         </Button>
                         <Button variant="ghost" size="sm" onClick={() => handleDeletePromotion(promo.id)} className="h-9 w-9 p-0 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400">
                            <Trash2 className="h-4 w-4" />
                         </Button>
                      </div>
                      <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        promo.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>{t(promo.status) || promo.status}</div>
                   </div>
                </div>
                <p className="text-xs font-medium text-[#637381] dark:text-slate-400 line-clamp-2 mb-4">{promo.description}</p>
                <div className="flex items-center gap-6">
                   <div>
                      <p className="text-[10px] font-bold text-[#637381] dark:text-slate-500 uppercase tracking-widest">{t('value_label')}</p>
                      <p className="text-sm font-black text-[#111928] dark:text-white">
                        {promo.type === 'percentage' 
                          ? t('percent_off').replace('{value}', promo.value.toString()) 
                          : t('flat_off').replace('{value}', promo.value.toString())}
                      </p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-[#637381] dark:text-slate-500 uppercase tracking-widest">{t('target_label')}</p>
                      <p className="text-sm font-black text-[#111928] dark:text-white capitalize">
                        {promo.applyTo === 'all' 
                          ? t('entire_inventory') 
                          : t('promo_products_count').replace('{count}', (promo.productIds?.length || 0).toString())}
                      </p>
                   </div>
                </div>
             </div>
          </div>
        ))}
        {promotions.length === 0 && (
          <div className="xl:col-span-2 py-20 premium-card text-center">
            <ShoppingBag className="h-12 w-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
            <p className="text-sm font-bold text-[#111928] dark:text-white">{t('no_active_campaigns')}</p>
            <p className="text-xs text-[#637381] mt-1">{t('create_first_discount')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
