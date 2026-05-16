'use client';

import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Hash, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  ScanLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product, Branch, Category } from '@/types/vendor';
import { User } from '@/lib/user-store';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { BarcodeScannerModal } from '@/components/ui/BarcodeScannerModal';
import { useState } from 'react';

interface ProductsTabProps {
  currentUser: User | null;
  products: Product[];
  branches: Branch[];
  categories: Category[];
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  selectedFilterCategory: string;
  setSelectedFilterCategory: (category: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  paginatedProducts: any[];
  totalProductPages: number;
  productPage: number;
  setProductPage: (page: number) => void;
  setShowProductModal: (show: boolean) => void;
  setShowCategoryModal: (show: boolean) => void;
  setShowEditProduct: (product: Product | null) => void;
  handleDeleteProduct: (id: string) => void;
  getDisplayStockForProduct: (id: string) => { stock: number; minStock?: number };
  handleBulkImport: (file: File) => void;
  handleBulkExport: () => void;
  downloadImportTemplate: () => void;
}

export const ProductsTab = ({
  currentUser,
  products,
  branches,
  categories,
  selectedBranchId,
  setSelectedBranchId,
  selectedFilterCategory,
  setSelectedFilterCategory,
  searchTerm,
  setSearchTerm,
  paginatedProducts,
  totalProductPages,
  productPage,
  setProductPage,
  setShowProductModal,
  setShowCategoryModal,
  setShowEditProduct,
  handleDeleteProduct,
  getDisplayStockForProduct,
  handleBulkImport,
  handleBulkExport,
  downloadImportTemplate
}: ProductsTabProps) => {
  const { t } = useLanguage();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">{t('product_repo')}</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">{t('product_repo_desc')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(currentUser?.role === 'vendor' || currentUser?.permissions?.canCreateProducts) && (
            <>
              <Button onClick={() => (document.getElementById('bulk-import') as HTMLInputElement)?.click()} variant="outline" className="h-11 rounded-lg border-slate-200 dark:border-slate-800 text-sm font-bold gap-2">
                <ArrowUpRight className="h-4 w-4" />
                {t('bulk_import') || 'Bulk Import'}
                <input 
                  id="bulk-import" 
                  type="file" 
                  className="hidden" 
                  accept=".csv" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBulkImport(file);
                  }}
                />
              </Button>
              <Button 
                onClick={handleBulkExport}
                variant="outline" 
                className="h-11 rounded-lg border-slate-200 dark:border-slate-800 text-sm font-bold gap-2"
              >
                <ArrowDownRight className="h-4 w-4" />
                {t('bulk_export') || 'Bulk Export'}
              </Button>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 hidden md:block mx-1" />
              <Button onClick={() => setShowProductModal(true)} className="h-11 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2 shadow-lg shadow-indigo-500/20">
                <Plus className="h-4 w-4" />
                {t('new_product') || 'New Product'}
              </Button>
              <Button onClick={() => setShowCategoryModal(true)} variant="outline" className="h-11 rounded-lg border-slate-200 dark:border-slate-800 text-sm font-bold">
                {t('categories')}
              </Button>
            </>
          )}
        </div>
      </div>



      <div className="premium-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center gap-4">
           {branches.length > 1 && currentUser?.role === 'vendor' && (
             <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-[#637381] uppercase tracking-widest">{t('branch')}</span>
                <select 
                   className="bg-transparent border-none text-sm font-bold text-[#111928] dark:text-white outline-none cursor-pointer [&>option]:bg-white [&>option]:text-[#111928] dark:[&>option]:bg-[#1C2434] dark:[&>option]:text-white"
                   value={selectedBranchId}
                   onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  <option value="all">{t('global_inventory')}</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
             </div>
           )}
           <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-2" />
           <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-[#637381] uppercase tracking-widest">{t('category')}</span>
              <select 
                className="bg-transparent border-none text-sm font-bold text-[#111928] dark:text-white outline-none cursor-pointer [&>option]:bg-white [&>option]:text-[#111928] dark:[&>option]:bg-[#1C2434] dark:[&>option]:text-white"
                value={selectedFilterCategory}
                onChange={(e) => setSelectedFilterCategory(e.target.value)}
              >
                <option value="all">{t('all_categories')}</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
           </div>
           
           <div className="flex-1 flex justify-end">
             <div className="flex items-center gap-2">
               <div className="relative group w-full sm:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#5750F1] transition-colors" />
                 <Input 
                   placeholder="Search..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10 h-10 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                 />
               </div>
               <Button 
                 onClick={() => setIsScannerOpen(true)}
                 variant="outline"
                 className="h-10 w-10 p-0 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#5750F1] hover:bg-[#5750F1] hover:text-white transition-colors"
                 title="Scan Barcode"
               >
                 <ScanLine className="h-4 w-4" />
               </Button>
             </div>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#313D4A] border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-widest text-[#637381] dark:text-slate-400">
                <th className="px-6 py-4">{t('product_info')}</th>
                <th className="px-6 py-4">{t('price')}</th>
                <th className="px-6 py-4">{t('stock_status')}</th>
                {(currentUser?.role === 'vendor' || currentUser?.permissions?.canCreateProducts) && (
                  <th className="px-6 py-4 text-right">{t('actions')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedProducts.map((product) => {
                 const { stock, minStock } = getDisplayStockForProduct(product.id);
                 const threshold = minStock ?? 10;
                 const isLow = stock > 0 && stock <= threshold;
                 const isOut = stock <= 0;

                 return (
                   <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                             {product.imageUrl ? (
                               <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                             ) : (
                               <Package className="h-6 w-6 text-slate-400" />
                             )}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-[#111928] dark:text-white leading-tight">{product.name}</p>
                             <p className="text-[10px] font-medium text-[#637381] uppercase tracking-wider mt-0.5">{product.sku}</p>
                             <div className="mt-1 flex items-center gap-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
                                   {product.category || 'Uncategorized'}
                                </span>
                             </div>
                          </div>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-black text-[#111928] dark:text-white">
                           <span className="text-slate-400 font-bold">$</span>
                           {product.basePrice.toFixed(2)}
                        </div>
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{t('sale_enabled')}</p>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-2 mb-1.5">
                          <div className={`h-2 w-2 rounded-full ${isOut ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : isLow ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                          <span className={`text-xs font-bold ${isOut ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400 uppercase tracking-widest'}`}>
                             {isOut ? t('out_of_stock') : isLow ? t('low_stock') : t('active')}
                          </span>
                       </div>
                       <p className="text-lg font-black text-[#111928] dark:text-white">{stock} <span className="text-xs font-bold text-slate-400 ml-1">{t('units')}</span></p>
                     </td>
                     {(currentUser?.role === 'vendor' || currentUser?.permissions?.canCreateProducts) && (
                       <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                           <Button variant="ghost" size="icon" onClick={() => setShowEditProduct(product)} className="h-9 w-9 text-slate-400 hover:text-[#5750F1] hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                             <Edit className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </td>
                     )}
                   </tr>
                 );
              })}
              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                    <p className="text-sm font-bold text-[#111928] dark:text-white">{t('inventory_empty')}</p>
                    <p className="text-xs text-[#637381] mt-1">{t('start_adding_product')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Console */}
        <div className="px-6 py-4 bg-[#F9FAFB] dark:bg-[#1C2434] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
           <p className="text-xs font-bold text-[#637381] dark:text-slate-400">
             {t('showing_products').replace('{count}', paginatedProducts.length.toString()).replace('{total}', products.length.toString())}
           </p>
           <div className="flex items-center gap-2">
              <Button 
                 disabled={productPage === 1} 
                 onClick={() => setProductPage(productPage - 1)}
                 variant="outline" 
                 className="h-9 px-4 rounded-lg border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
               {t('prev')}
             </Button>
             <div className="flex items-center gap-1 px-4">
                {Array.from({ length: totalProductPages }).map((_, i) => (
                   <button 
                      key={i} 
                      onClick={() => setProductPage(i + 1)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${productPage === i + 1 ? 'bg-[#5750F1] text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-[#111928] dark:hover:text-white'}`}
                   >
                      {i + 1}
                   </button>
                ))}
             </div>
              <Button 
                 disabled={productPage === totalProductPages} 
                 onClick={() => setProductPage(productPage + 1)}
                 variant="outline" 
                 className="h-9 px-4 rounded-lg border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
               {t('next')}
             </Button>
           </div>
        </div>
      </div>
      
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(decodedText) => {
          setSearchTerm(decodedText);
        }}
      />
    </div>
  );
};
