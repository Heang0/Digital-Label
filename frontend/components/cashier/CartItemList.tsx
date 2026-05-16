'use client';

import { Minus, Package, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem, money } from './types';

interface CartItemListProps {
  cart: CartItem[];
  setQty: (key: string, qty: number) => void;
  clearCart: () => void;
}

export function CartItemList({ cart, setQty, clearCart }: CartItemListProps) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Cart</h3>
        <Button variant="outline" size="sm" onClick={clearCart} disabled={cart.length === 0}>
          <Trash2 className="h-4 w-4 mr-2" /> Clear
        </Button>
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block mt-4 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wider text-gray-500 border-b">
              <th className="py-3 pr-4">មុខទំនិញ (Item)</th>
              <th className="py-3 pr-4 hidden md:table-cell">តម្លៃ (Price)</th>
              <th className="py-3 pr-4 text-center">បរិមាណ (Qty)</th>
              <th className="py-3 pr-4 text-right">សរុប (Total)</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => {
              const hasDiscount = item.finalUnitPrice < item.baseUnitPrice;
              return (
                <tr key={item.key} className="border-b last:border-b-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 border overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-4 w-4 m-3 text-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.productId}{item.category ? ` · ${item.category}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 hidden md:table-cell">
                    <p className="font-semibold text-gray-900">{money(item.finalUnitPrice)}</p>
                    {hasDiscount && <p className="text-xs text-gray-500 line-through">{money(item.baseUnitPrice)}</p>}
                  </td>
                 <td className="py-3 pr-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="inline-flex items-center gap-2 rounded-xl border px-2 py-1 bg-white text-gray-900">
                        <button
                          type="button"
                          className="p-1 hover:bg-gray-50 rounded-lg text-gray-900"
                          onClick={() => setQty(item.key, item.qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4 text-gray-900" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">{item.qty}</span>
                        <button
                          type="button"
                          className="p-1 hover:bg-gray-50 rounded-lg text-gray-900"
                          onClick={() => setQty(item.key, item.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4 text-gray-900" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right font-bold text-gray-900">{money(item.finalUnitPrice * item.qty)}</td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => setQty(item.key, 0)} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden mt-4 space-y-4">
        {cart.map((item) => (
          <div key={item.key} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-5 shadow-sm">
            <div className="flex justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-20 w-20 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-8 w-8 m-6 text-gray-200" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-xl text-gray-900 truncate leading-tight">{item.name}</p>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1.5">{item.category || 'General'}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-1">ID: {item.productId}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setQty(item.key, 0)} className="h-12 w-12 text-red-500 bg-red-50 rounded-2xl shrink-0">
                <Trash2 className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
              <div className="inline-flex items-center gap-6 rounded-2xl border-2 border-gray-200 bg-white p-2 shadow-sm">
                <button type="button" className="p-3 hover:bg-gray-50 rounded-xl active:bg-gray-100 transition-colors" onClick={() => setQty(item.key, item.qty - 1)}><Minus className="h-6 w-6" /></button>
                <span className="w-10 text-center font-black text-2xl text-gray-900">{item.qty}</span>
                <button type="button" className="p-3 hover:bg-gray-50 rounded-xl active:bg-gray-100 transition-colors" onClick={() => setQty(item.key, item.qty + 1)}><Plus className="h-6 w-6" /></button>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">សរុប (Total)</div>
                <div className="text-3xl font-black text-blue-600 leading-none">{money(item.finalUnitPrice * item.qty)}</div>
                <div className="text-xs text-gray-500 font-bold mt-2.5">
                  {money(item.finalUnitPrice)} / unit
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cart.length === 0 && (
        <div className="py-12 text-center text-gray-500 bg-gray-50/50 rounded-2xl border border-dashed mt-4">
          មិនទាន់មានទំនិញក្នុងកន្ត្រកនៅឡើយទេ។
        </div>
      )}
    </div>
  );
}
