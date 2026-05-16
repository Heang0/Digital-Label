'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Category, BranchProduct, money } from './types';

interface ProductGridProps {
  categories: Category[];
  filteredProducts: BranchProduct[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  productSearch: string;
  setProductSearch: (s: string) => void;
  addToCart: (bp: BranchProduct) => void;
  effectivePriceForProduct: (productId: string, fallback: number) => { base: number; final: number; discountPercent: number | null };
}

export function ProductGrid({
  categories,
  filteredProducts,
  activeCategory,
  setActiveCategory,
  productSearch,
  setProductSearch,
  addToCart,
  effectivePriceForProduct,
}: ProductGridProps) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Browse products</h3>
          <p className="text-gray-600 text-sm">Choose a category then tap a product to add it.</p>
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះ / SKU / បាកូដ"
            className="pl-10 h-11 rounded-xl border-gray-200"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm border transition-colors',
            activeCategory === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          )}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCategory(c.name)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm border transition-colors',
              activeCategory === c.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredProducts.map((bp) => {
          const pd = bp.productDetails;
          if (!pd) return null;
          const p = effectivePriceForProduct(bp.productId, bp.currentPrice);
          const hasDiscount = p.final < p.base;

          return (
            <button
              key={bp.id}
              type="button"
              onClick={() => addToCart(bp)}
              className="text-left rounded-xl border p-4 hover:shadow-sm hover:border-gray-300 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{pd.name}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">ID: {bp.productId}</p>
                  <p className="text-xs text-gray-500 truncate">SKU: {pd.sku}{pd.productCode ? ` · Code: ${pd.productCode}` : ''}</p>
                </div>
                {hasDiscount && (
                  <span className="shrink-0 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 text-xs font-semibold">
                    SALE{p.discountPercent ? ` ${p.discountPercent}%` : ''}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{money(p.final)}</p>
                  {hasDiscount && (
                    <p className="text-xs text-gray-500 line-through">{money(p.base)}</p>
                  )}
                </div>
                <span className={cn('text-xs font-medium', bp.stock <= 0 ? 'text-red-600' : bp.stock < 5 ? 'text-yellow-700' : 'text-gray-600')}>
                  Stock: {bp.stock}
                </span>
              </div>
            </button>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            No products found for this category/search.
          </div>
        )}
      </div>
    </div>
  );
}
