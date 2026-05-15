'use client';

import { motion } from 'framer-motion';
import { LayoutGrid as LayoutGridIcon, Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category, Product } from '@/types/vendor';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface CategoriesTabProps {
  categories: Category[];
  products: Product[];
  setShowCategoryModal: (show: boolean) => void;
  setSelectedCategory: (category: Category | null) => void;
  handleDeleteCategory: (id: string) => void;
}

export const CategoriesTab = ({
  categories,
  products,
  setShowCategoryModal,
  setSelectedCategory,
  handleDeleteCategory
}: CategoriesTabProps) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">{t('inventory_categories')}</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">{t('inventory_categories_desc')}</p>
        </div>
        <Button onClick={() => setShowCategoryModal(true)} className="h-11 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2">
          <Plus className="h-4 w-4" />
          {t('add_category')}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {categories.map((cat) => (
          <motion.div 
            key={cat.id} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="premium-card px-6 py-4 flex items-center justify-between group hover:border-[#5750F1]/30 transition-all"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
               <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-[#5750F1]/10 group-hover:text-[#5750F1] transition-colors shrink-0">
                  <LayoutGridIcon className="h-5 w-5" />
               </div>
               <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#111928] dark:text-white truncate">{cat.name}</h3>
                  <p className="text-[10px] text-[#637381] dark:text-slate-500 truncate mt-0.5">{cat.description || t('no_description')}</p>
               </div>
            </div>

            <div className="flex items-center gap-8">
               <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.15em]">
                     {t('products_count').replace('{count}', products.filter(p => p.category === cat.name).length.toString())}
                  </span>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Active Items</p>
               </div>

               <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat); setShowCategoryModal(true); }} 
                    className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#5750F1]"
                  >
                     <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} 
                    className="h-9 w-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400"
                  >
                     <Trash2 className="h-4 w-4" />
                  </Button>
               </div>
            </div>
          </motion.div>
        ))}
        {categories.length === 0 && (
          <div className="py-20 premium-card text-center border-dashed">
            <LayoutGridIcon className="h-12 w-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
            <p className="text-sm font-bold text-[#111928] dark:text-white">{t('no_categories_defined')}</p>
            <p className="text-xs text-[#637381] mt-1">{t('classify_inventory_desc')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
