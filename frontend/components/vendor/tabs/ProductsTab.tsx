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
  ArrowDownRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, Branch, Category } from '@/types/vendor';

interface ProductsTabProps {
  products: Product[];
  branches: Branch[];
  categories: Category[];
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  selectedFilterCategory: string;
  setSelectedFilterCategory: (category: string) => void;
  paginatedProducts: any[];
  totalProductPages: number;
  productPage: number;
  setProductPage: (page: number) => void;
  setShowProductModal: (show: boolean) => void;
  setShowCategoryModal: (show: boolean) => void;
  setShowEditProduct: (product: Product | null) => void;
  handleDeleteProduct: (id: string) => void;
  getDisplayStockForProduct: (id: string) => { stock: number; minStock?: number };
}

export const ProductsTab = ({
  products,
  branches,
  categories,
  selectedBranchId,
  setSelectedBranchId,
  selectedFilterCategory,
  setSelectedFilterCategory,
  paginatedProducts,
  totalProductPages,
  productPage,
  setProductPage,
  setShowProductModal,
  setShowCategoryModal,
  setShowEditProduct,
  handleDeleteProduct,
  getDisplayStockForProduct
}: ProductsTabProps) => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Product Repository</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Manage global inventory and branch stock levels.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowProductModal(true)} className="h-11 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2">
            <Plus className="h-4 w-4" />
            New Product
          </Button>
          <Button onClick={() => setShowCategoryModal(true)} variant="outline" className="h-11 rounded-lg border-[#E2E8F0] text-sm font-bold">
            Categories
          </Button>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center gap-4">
           {branches.length > 1 && (
             <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-[#637381] uppercase tracking-widest">Branch</span>
                <select 
                  className="bg-transparent border-none text-sm font-bold text-[#111928] dark:text-white outline-none cursor-pointer"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  <option value="all">Global Inventory</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
             </div>
           )}
           <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-2" />
           <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-[#637381] uppercase tracking-widest">Category</span>
              <select 
                className="bg-transparent border-none text-sm font-bold text-[#111928] dark:text-white outline-none cursor-pointer"
                value={selectedFilterCategory}
                onChange={(e) => setSelectedFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#313D4A] border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-widest text-[#637381] dark:text-slate-400">
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
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
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Sale Enabled</p>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-2 mb-1.5">
                          <div className={`h-2 w-2 rounded-full ${isOut ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : isLow ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                          <span className={`text-xs font-bold ${isOut ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400 uppercase tracking-widest'}`}>
                             {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Active'}
                          </span>
                       </div>
                       <p className="text-lg font-black text-[#111928] dark:text-white">{stock} <span className="text-xs font-bold text-slate-400 ml-1">Units</span></p>
                     </td>
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
                   </tr>
                 );
              })}
              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                    <p className="text-sm font-bold text-[#111928] dark:text-white">Inventory is empty</p>
                    <p className="text-xs text-[#637381] mt-1">Start by adding your first product to the repository.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Console */}
        <div className="px-6 py-4 bg-[#F9FAFB] dark:bg-[#1C2434] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
           <p className="text-xs font-bold text-[#637381] dark:text-slate-400">
             Showing <span className="text-[#111928] dark:text-white">{paginatedProducts.length}</span> of <span className="text-[#111928] dark:text-white">{products.length}</span> products
           </p>
           <div className="flex items-center gap-2">
              <Button 
                 disabled={productPage === 1} 
                 onClick={() => setProductPage(productPage - 1)}
                 variant="outline" 
                 className="h-9 px-4 rounded-lg border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
               Previous
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
               Next
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
};
