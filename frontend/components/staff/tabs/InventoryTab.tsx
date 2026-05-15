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
  AlertCircle,
  ScanLine,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { useNotify } from '@/components/ui/notification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BranchProduct } from '@/hooks/useStaffDashboard';
import { BarcodeScannerModal } from '@/components/ui/BarcodeScannerModal';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface StaffInventoryTabProps {
  branchProducts: BranchProduct[];
  onUpdateStock: (productId: string, value: number, mode?: 'adjust' | 'set') => Promise<void>;
  onRefresh: () => void;
  onOpenPriceUpdate?: (product: BranchProduct) => void;
  canChangePrices?: boolean;
  canUpdateStock?: boolean;
}

export const StaffInventoryTab = ({
  branchProducts,
  onUpdateStock,
  onRefresh,
  onOpenPriceUpdate,
  canChangePrices,
  canUpdateStock
}: StaffInventoryTabProps) => {
  const { t } = useLanguage();
  const notify = useNotify();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScanSuccess = (code: string) => {
    setSearchTerm(code);
    
    // Check if we found a match
    const term = code.toLowerCase().trim();
    const found = branchProducts.some(bp => 
      bp.productDetails?.sku.toLowerCase() === term ||
      bp.productDetails?.productCode?.toLowerCase() === term
    );

    if (found) {
      notify.success(t('scan_success') || 'Scan Successful', `${t('found_product') || 'Product found'}: ${code}`);
    } else {
      notify.warning(t('scan_no_match') || 'No Match Found', `${t('code_not_in_db') || 'This code is not in your system'}: ${code}`);
    }
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return branchProducts;
    
    return branchProducts.filter(bp => {
      const details = bp.productDetails;
      // Search in all possible fields
      const nameMatch = details?.name?.toLowerCase().includes(term);
      const skuMatch = details?.sku?.toLowerCase().includes(term);
      const codeMatch = details?.productCode?.toLowerCase().includes(term);
      const idMatch = bp.productId?.toLowerCase().includes(term);
      const exactCodeMatch = details?.productCode?.toLowerCase() === term;
      const exactSkuMatch = details?.sku?.toLowerCase() === term;

      return nameMatch || skuMatch || codeMatch || idMatch || exactCodeMatch || exactSkuMatch;
    });
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
              <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.2em]">{t('inventory_control')}</span>
           </div>
           <h2 className="text-2xl font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('stock_directory')}</h2>
           <p className="text-xs font-medium text-[#637381] dark:text-slate-400">{t('stock_directory_desc')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#5750F1] transition-colors" />
            <Input 
              placeholder={t('search_inventory_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full md:w-80 h-12 rounded-none border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
            />
          </div>
          <Button 
            onClick={() => setIsScannerOpen(true)}
            variant="outline"
            className="h-12 w-12 p-0 rounded-none border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#5750F1] hover:bg-[#5750F1] hover:text-white transition-colors"
            title={t('scan_barcode')}
          >
            <ScanLine className="h-4 w-4" />
          </Button>
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
                <div className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider border rounded-full flex items-center gap-1.5 ${
                  bp.status === 'in-stock' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  bp.status === 'low-stock' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    bp.status === 'in-stock' ? 'bg-emerald-500' : 
                    bp.status === 'low-stock' ? 'bg-amber-500' : 
                    'bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]'
                  }`} />
                  {bp.status === 'in-stock' ? t('in_stock') || 'In Stock' : 
                   bp.status === 'low-stock' ? t('low_stock') || 'Low Stock' : 
                   t('out_of_stock') || 'Out of Stock'}
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
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('branch_stock')}</p>
                  <p className="text-2xl font-black text-[#111928] dark:text-white tracking-tighter">{bp.stock}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {canUpdateStock && (
                    <>
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
                    </>
                  )}
                  
                  {canChangePrices && onOpenPriceUpdate && (
                    <button 
                      onClick={() => onOpenPriceUpdate(bp)}
                      className="h-10 w-10 flex items-center justify-center bg-[#5750F1]/5 dark:bg-[#5750F1]/10 text-[#5750F1] hover:bg-[#5750F1] hover:text-white border border-[#5750F1]/20 transition-all"
                      title={t('adjust_pricing')}
                    >
                      <Tag className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Insight */}
            <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-slate-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('min_level')}: {bp.minStock}</span>
              </div>
              {bp.status === 'low-stock' && (
                <div className="flex items-center gap-1.5 text-amber-500">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">{t('needs_refill')}</span>
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
      
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanSuccess}
      />
    </div>
  );
};
