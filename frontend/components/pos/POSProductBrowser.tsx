'use client';

import { Search, ScanLine, RefreshCw, Package, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface POSProductBrowserProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setIsScannerOpen: (open: boolean) => void;
  onRefresh: () => void;
  filteredProducts: any[];
  addToCart: (product: any) => void;
}

export const POSProductBrowser = ({
  searchTerm,
  setSearchTerm,
  setIsScannerOpen,
  onRefresh,
  filteredProducts,
  addToCart
}: POSProductBrowserProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1C2434] border-r border-slate-100 dark:border-slate-800">
      <div className="p-6 border-b border-slate-50 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-[#111928] dark:text-white uppercase tracking-tighter">{t('pos_checkout')}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('pos_terminal')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onRefresh} className="h-10 w-10 text-slate-400 hover:text-[#5750F1]">
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#5750F1] transition-colors" />
            <Input 
              placeholder={t('search_product_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-slate-50 dark:bg-slate-900 border-none rounded-sm font-medium focus-visible:ring-2 focus-visible:ring-[#5750F1]/20"
            />
          </div>
          <Button 
            onClick={() => setIsScannerOpen(true)}
            className="h-14 w-14 bg-[#111928] text-white hover:bg-slate-800 rounded-sm"
          >
            <ScanLine className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => {
            const displayPrice = Number(product.currentPrice || product.price || 0);
            const displayCategory = product.productDetails?.category || product.category || t('general_category');
            const displayName = product.productDetails?.name || product.name || 'Unknown';
            const displayImage = product.productDetails?.imageUrl || product.imageUrl;

            return (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                className="flex flex-col text-left group bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none p-3"
              >
                <div className="aspect-square bg-white dark:bg-[#1C2434] mb-3 overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0">
                  {displayImage ? (
                    <img 
                      src={displayImage} 
                      alt={displayName} 
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center opacity-20">
                      <Package className="h-12 w-12 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{displayCategory}</p>
                  <p className="text-xs font-black text-[#111928] dark:text-white uppercase truncate mb-2">{displayName}</p>
                  <div className="flex items-center justify-between">
                     <span className="text-sm font-black text-[#5750F1]">${displayPrice.toFixed(2)}</span>
                     <div className="h-6 w-6 rounded-full bg-[#5750F1] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-3 w-3" />
                     </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center opacity-40">
            <Search className="h-12 w-12 mb-4 text-slate-300" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t('no_products_found')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
