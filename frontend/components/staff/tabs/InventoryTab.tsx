'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Search, 
  Plus, 
  Minus, 
  RefreshCw, 
  Filter,
  ArrowUpRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BranchProduct } from '@/hooks/useStaffDashboard';

interface StaffInventoryTabProps {
  branchProducts: BranchProduct[];
  onUpdateStock: (productId: string, value: number, mode?: 'adjust' | 'set') => Promise<void>;
  onRefresh: () => void;
}

export const StaffInventoryTab = ({
  branchProducts,
  onUpdateStock,
  onRefresh
}: StaffInventoryTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return branchProducts;
    return branchProducts.filter(bp => 
      bp.productDetails?.name.toLowerCase().includes(term) ||
      bp.productDetails?.sku.toLowerCase().includes(term) ||
      bp.productDetails?.productCode?.toLowerCase().includes(term)
    );
  }, [branchProducts, searchTerm]);

  const handleStockAction = async (productId: string, value: number) => {
    setIsUpdating(productId);
    await onUpdateStock(productId, value);
    setIsUpdating(null);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-[#5750F1]" />
              <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.2em]">Inventory Control</span>
           </div>
           <h2 className="text-2xl font-black text-[#111928] dark:text-white uppercase tracking-tight">Stock Directory</h2>
           <p className="text-xs font-medium text-[#637381] dark:text-slate-400">Monitor and adjust on-floor availability.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#5750F1] transition-colors" />
            <Input 
              placeholder="Search by SKU, Name or Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full md:w-80 h-12 rounded-none border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
            />
          </div>
          <Button 
            onClick={onRefresh}
            variant="outline"
            className="h-12 w-12 p-0 rounded-none border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((bp) => (
          <motion.div 
            key={bp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#1C2434] border border-slate-100 dark:border-slate-800 overflow-hidden group hover:shadow-xl transition-all"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                   <Package className="h-6 w-6 text-slate-300 group-hover:text-[#5750F1] transition-colors" />
                </div>
                <div className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest border ${
                  bp.status === 'in-stock' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  bp.status === 'low-stock' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                  {bp.status.replace('-', ' ')}
                </div>
              </div>

              <h3 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight truncate mb-1">
                {bp.productDetails?.name}
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">
                <span>SKU: {bp.productDetails?.sku}</span>
                <span className="h-1 w-1 rounded-full bg-slate-200" />
                <span>${bp.currentPrice.toFixed(2)}</span>
              </div>

              {/* Stock Controls */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Stock</p>
                  <p className="text-2xl font-black text-[#111928] dark:text-white tracking-tighter">{bp.stock}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    disabled={bp.stock <= 0 || isUpdating === bp.productId}
                    onClick={() => handleStockAction(bp.productId, -1)}
                    className="h-10 w-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-500 disabled:opacity-50 transition-all"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button 
                    disabled={isUpdating === bp.productId}
                    onClick={() => handleStockAction(bp.productId, 1)}
                    className="h-10 w-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500 hover:border-emerald-500 disabled:opacity-50 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Insight */}
            <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-slate-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min Level: {bp.minStock}</span>
              </div>
              {bp.status === 'low-stock' && (
                <div className="flex items-center gap-1.5 text-amber-500">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Needs Refill</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 py-20 bg-white dark:bg-[#1C2434] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
            <Search className="h-12 w-12 text-slate-100 dark:text-slate-800 mb-4" />
            <p className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">No products found</p>
            <p className="text-xs font-medium text-slate-400 mt-1">Try adjusting your search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
