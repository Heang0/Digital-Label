'use client';

import { motion } from 'framer-motion';
import { LayoutGrid as LayoutGridIcon, Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category, Product } from '@/types/vendor';

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
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Inventory Categories</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Organize your products into logical groups for easier management.</p>
        </div>
        <Button onClick={() => setShowCategoryModal(true)} className="h-11 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="premium-card p-6 group cursor-pointer hover:border-[#5750F1]/30 transition-all">
            <div className="flex items-center justify-between mb-6">
               <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-[#5750F1]/10 group-hover:text-[#5750F1] transition-colors">
                  <LayoutGridIcon className="h-6 w-6" />
               </div>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat); setShowCategoryModal(true); }} className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                     <Edit className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="h-8 w-8 p-0 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400">
                     <Trash2 className="h-3.5 w-3.5" />
                  </Button>
               </div>
            </div>
            <h3 className="text-base font-bold text-[#111928] dark:text-white truncate">{cat.name}</h3>
            <p className="text-xs text-[#637381] line-clamp-1 mt-1">{cat.description || 'No description provided'}</p>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50 dark:border-slate-800">
               <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-widest">
                  {products.filter(p => p.category === cat.name).length} Products
               </span>
            </div>
          </motion.div>
        ))}
        {categories.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 py-20 premium-card text-center">
            <LayoutGridIcon className="h-12 w-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
            <p className="text-sm font-bold text-[#111928] dark:text-white">No categories defined</p>
            <p className="text-xs text-[#637381] mt-1">Classify your inventory to improve search and filtering performance.</p>
          </div>
        )}
      </div>
    </div>
  );
};
