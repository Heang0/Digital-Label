'use client';

import { Minus, Package, Plus, Trash2 } from 'lucide-react';
import { CartItem } from './types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface POSCartTableProps {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
}

export const POSCartTable = ({ cart, updateQuantity, removeFromCart }: POSCartTableProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex-1 overflow-auto">
      {cart.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
          <Package className="h-16 w-16 mb-4 text-slate-300" />
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Cart is Empty</p>
        </div>
      ) : (
        <div className="h-full">
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-[#1C2434] z-10">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('item')}</th>
                  <th className="text-center px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('qty')}</th>
                  <th className="text-right px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {cart.map(item => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-4 w-4 m-3 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#111928] dark:text-white uppercase truncate tracking-tight">{item.name}</p>
                          <p className="text-[9px] font-bold text-[#5750F1] tracking-tighter">${item.price.toFixed(2)} / unit</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-1 rounded-sm border border-slate-100 dark:border-slate-800">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-[11px] font-black w-8 text-center text-[#111928] dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-[#5750F1] transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-[#111928] dark:text-white font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-[8px] font-black text-rose-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden p-4 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-5 shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-20 w-20 bg-white dark:bg-[#1C2434] border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-8 w-8 m-6 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-black text-[#111928] dark:text-white uppercase leading-tight truncate">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">{item.sku}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="h-12 w-12 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl shrink-0">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="inline-flex items-center bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-700 p-1.5 rounded-2xl shadow-sm">
                    <button onClick={() => updateQuantity(item.id, -1)} className="h-10 w-10 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"><Minus className="h-4 w-4" /></button>
                    <span className="w-12 text-center font-black text-xl">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="h-10 w-10 flex items-center justify-center text-[#5750F1] hover:bg-slate-50 rounded-xl transition-colors"><Plus className="h-4 w-4" /></button>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-2xl font-black text-[#5750F1] leading-none">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-2">${item.price.toFixed(2)}/unit</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
