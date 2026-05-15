'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ScanLine, 
  Receipt, 
  Search, 
  CreditCard, 
  Banknote,
  CheckCircle2,
  Package,
  X,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarcodeScannerModal } from '@/components/ui/BarcodeScannerModal';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  productCode?: string;
  price: number;
  quantity: number;
  image?: string;
}

interface POSTabProps {
  branchProducts: any[];
  updateStock: (productId: string, value: number, mode: 'set' | 'adjust', silent?: boolean) => Promise<void>;
  onRefresh: () => void;
  currentUser: any;
  branch: any;
  openLabelNotice: (title: string, message: string, tone: any) => void;
}

export const POSTab = ({
  branchProducts,
  updateStock,
  onRefresh,
  currentUser,
  branch,
  openLabelNotice
}: POSTabProps) => {
  const { t } = useLanguage();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<{ id: string; items: CartItem[]; total: number; date: Date } | null>(null);

  // Load last order from storage for reprint persistence
  useEffect(() => {
    const saved = localStorage.getItem('last_pos_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.date = new Date(parsed.date);
        setLastOrder(parsed);
      } catch (e) {
        console.error('Failed to load last order', e);
      }
    }
  }, []);

  // Save last order to storage when it changes
  useEffect(() => {
    if (lastOrder) {
      localStorage.setItem('last_pos_order', JSON.stringify(lastOrder));
    }
  }, [lastOrder]);

  // Financial Calculations
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const tax = subtotal * 0.1; // 10% tax example
  const total = subtotal + tax;

  // Add to cart by scanning/searching
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.productId);
      if (existing) {
        return prev.map(item => 
          item.productId === product.productId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        productId: product.productId,
        name: product.productDetails?.name || 'Unknown Product',
        sku: product.productDetails?.sku || '',
        productCode: product.productDetails?.productCode || '',
        price: product.currentPrice || 0,
        quantity: 1,
        image: product.productDetails?.imageUrl
      }];
    });
    setSearchTerm('');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleBarcodeScanned = (barcode: string) => {
    const product = branchProducts.find(p => 
      p.productDetails?.productCode === barcode || 
      p.productDetails?.sku === barcode
    );
    if (product) {
      addToCart(product);
      setIsScannerOpen(false);
    } else {
      openLabelNotice('Not Found', `No product found with code: ${barcode}`, 'warning');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    try {
      // 1. Deduct stock for each item (silently)
      await Promise.all(cart.map(item => 
        updateStock(item.productId, -item.quantity, 'adjust', true)
      ));

      // 2. Generate Order ID and lock in the order
      const orderId = `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const completedOrder = {
        id: orderId,
        items: [...cart],
        total: total,
        date: new Date()
      };
      
      setLastOrder(completedOrder);
      localStorage.setItem('last_pos_order', JSON.stringify(completedOrder));

      // 3. Clear cart and show receipt
      setCart([]);
      setIsCheckoutModalOpen(false);
      setShowReceipt(true);
      onRefresh();
    } catch (error) {
      openLabelNotice('Error', 'Checkout failed. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const filteredSearchProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return branchProducts.filter(p => 
      p.productDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productDetails?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productDetails?.productCode?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [branchProducts, searchTerm]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full max-h-[calc(100vh-140px)] overflow-hidden">
      {/* Left: Cart & Scanner */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#1C2434] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#5750F1]/10 flex items-center justify-center text-[#5750F1]">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
               <h3 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('active_session') || 'Active Session'}</h3>
               <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{currentUser?.name} @ Reg 01</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsScannerOpen(true)}
              className="h-10 rounded-none border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest gap-2"
            >
              <ScanLine className="h-4 w-4" />
              {t('scan_barcode') || 'Scan Barcode'}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-50 dark:border-slate-800 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search_product_placeholder') || 'Search product by name, SKU or scan...'}
              className="pl-12 h-12 bg-white dark:bg-[#1C2434] border-slate-200 dark:border-slate-700 rounded-none text-xs font-bold"
            />
          </div>

          {/* Quick Search Results */}
          <AnimatePresence>
            {filteredSearchProducts.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-6 right-6 top-full z-50 bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-700 shadow-2xl"
              >
                {filteredSearchProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-b last:border-none border-slate-50 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          {p.productDetails?.imageUrl ? (
                            <img src={p.productDetails.imageUrl} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-4 w-4 m-3 text-slate-400" />
                          )}
                       </div>
                       <div className="text-left">
                          <p className="text-xs font-black text-[#111928] dark:text-white uppercase">{p.productDetails?.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.productDetails?.sku}</p>
                       </div>
                    </div>
                    <p className="text-sm font-black text-[#5750F1]">${p.currentPrice?.toFixed(2)}</p>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cart Items Table */}
        <div className="flex-1 overflow-y-auto p-0 border-t border-slate-50 dark:border-slate-800">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="h-20 w-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Waiting for first item...</p>
              <div className="mt-8 flex gap-2">
                <div className="h-1 w-8 bg-[#5750F1] rounded-full animate-pulse" />
                <div className="h-1 w-2 bg-slate-200 rounded-full" />
                <div className="h-1 w-2 bg-slate-200 rounded-full" />
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Right: Summary & Payment */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        <div className="bg-white dark:bg-[#1C2434] text-[#111928] dark:text-white p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5750F1]">{t('summary')}</span>
              <span className="text-[10px] font-bold text-slate-400">REG #01</span>
            </div>
            
            <div className="space-y-3 mb-8 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('subtotal')}</span>
                <span className="text-xs font-black text-[#111928] dark:text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('tax')}</span>
                <span className="text-xs font-black text-[#111928] dark:text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5750F1]">{t('grand_total')}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-bold text-slate-400 uppercase mb-1">Total Payable</span>
                    <span className="text-4xl font-black text-[#111928] dark:text-white tabular-nums leading-none">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setIsCheckoutModalOpen(true)}
              disabled={cart.length === 0}
              className="w-full h-14 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-none border-none shadow-xl text-[11px] font-black uppercase tracking-[0.2em] gap-3 group"
            >
              <span>{t('process_checkout')}</span>
              <div className="w-6 h-6 bg-white/10 dark:bg-slate-900/10 flex items-center justify-center group-hover:bg-[#5750F1] group-hover:text-white transition-all">
                <CreditCard className="h-3 w-3" />
              </div>
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
           <button 
            onClick={() => setCart([])}
            disabled={cart.length === 0}
            className="h-20 bg-white dark:bg-[#1C2434] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:border-rose-200 transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
           >
              <Trash2 className="h-4 w-4 text-slate-300 group-hover:text-rose-500" />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 group-hover:text-rose-600">{t('void_cart')}</span>
           </button>
           <button 
            onClick={() => setShowReceipt(true)}
            disabled={!lastOrder}
            className={`h-20 flex flex-col items-center justify-center gap-2 transition-all ${
              lastOrder 
                ? 'bg-white dark:bg-[#1C2434] border border-[#5750F1]/20 hover:bg-slate-50 dark:hover:bg-slate-900' 
                : 'bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
            }`}
           >
              <Receipt className={`h-4 w-4 ${lastOrder ? 'text-[#5750F1]' : 'text-slate-300'}`} />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                {lastOrder ? t('reprint') : t('no_history')}
              </span>
           </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isProcessing && setIsCheckoutModalOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
             <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white dark:bg-[#1C2434] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="p-8 text-center bg-slate-900 text-white">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4">{t('select_payment') || 'Select Payment'}</p>
                   <h3 className="text-3xl font-black mb-2">${total.toFixed(2)}</h3>
                   <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{t('order_summary') || 'Order Summary'}: {cart.length} {t('items') || 'items'}</p>
                </div>

                <div className="p-8 space-y-4">
                   <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'cash', icon: Banknote, label: t('cash') || 'Cash' },
                        { id: 'card', icon: CreditCard, label: t('card') || 'Card' },
                        { id: 'qr', icon: ScanLine, label: 'ABA QR' }
                      ].map(method => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={`h-24 flex flex-col items-center justify-center gap-3 border-2 transition-all ${
                            paymentMethod === method.id 
                              ? 'border-[#5750F1] bg-indigo-50 dark:bg-indigo-900/10' 
                              : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                          }`}
                        >
                          <method.icon className={`h-6 w-6 ${paymentMethod === method.id ? 'text-[#5750F1]' : 'text-slate-400'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === method.id ? 'text-[#5750F1]' : 'text-slate-500'}`}>{method.label}</span>
                        </button>
                      ))}
                   </div>

                   <div className="pt-6">
                      <Button 
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className="w-full h-12 bg-slate-900 text-white rounded-none border-none text-[10px] font-black uppercase tracking-widest gap-2"
                      >
                        {isProcessing ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            {t('confirm_payment') || 'Confirm Payment'}
                          </>
                        )}
                      </Button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print-Only Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          /* Hide everything by default */
          body * {
            visibility: hidden;
            background: none !important;
          }
          /* Show the receipt and its contents */
          #receipt-print, #receipt-print * {
            visibility: visible;
          }
          /* Position receipt for thermal printers */
          #receipt-print {
            position: fixed;
            left: 0;
            top: 0;
            width: 72mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            color: black !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 8pt !important;
            line-height: 1.1 !important;
            border: none !important;
          }
          #receipt-print h2 {
            font-size: 12pt !important;
            margin-bottom: 2mm !important;
          }
          #receipt-print table {
            width: 100% !important;
            font-size: 7pt !important;
          }
          #receipt-print .text-xl {
            font-size: 14pt !important;
          }
          /* Force hide UI elements */
          .print-hidden, button, nav, aside, .fixed.inset-0:not(:has(#receipt-print)) {
            display: none !important;
          }
        }
      `}</style>

      {/* Receipt Modal (The Printable Part) */}
      <AnimatePresence>
        {showReceipt && lastOrder && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="relative bg-white w-full max-w-sm shadow-2xl border-t-8 border-[#5750F1] overflow-hidden">
                <button onClick={() => setShowReceipt(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 print-hidden transition-colors">
                  <X className="h-5 w-5" />
                </button>
                
                {/* Receipt Content */}
                <div id="receipt-print" className="p-6 font-mono text-slate-900 bg-white">
                   <div className="text-center mb-4">
                      <h2 className="text-xl font-black uppercase tracking-tight mb-0.5">{branch?.name || currentUser?.branchName || 'REAL MART'}</h2>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">{t('tax_invoice')}</p>
                      
                      <div className="flex flex-col gap-0.5 mt-2 text-[8px] text-slate-400 uppercase font-bold tracking-widest">
                        <p>ID: {lastOrder.id.slice(0, 12).toUpperCase()}</p>
                        <p>{lastOrder.date.toLocaleString()}</p>
                      </div>

                      <div className="h-px w-full border-b border-dashed border-slate-300 my-2" />
                   </div>

                   <table className="w-full text-[10px] mb-6">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 font-black uppercase tracking-tighter">{t('item')}</th>
                          <th className="text-center py-2 font-black uppercase tracking-tighter">{t('qty')}</th>
                          <th className="text-right py-2 font-black uppercase tracking-tighter">{t('total')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {lastOrder.items.map(item => (
                          <tr key={item.id}>
                            <td className="py-3 pr-4">
                               <p className="font-black uppercase tracking-tight text-[#111928]">{item.name}</p>
                               <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">SKU: {item.sku || item.productId.slice(0,8).toUpperCase()}</p>
                            </td>
                            <td className="py-3 text-center font-bold text-slate-600">x{item.quantity}</td>
                            <td className="py-3 text-right font-black text-[#111928]">${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>

                   <div className="space-y-2 pt-4 border-t border-slate-100">
                      <div className="flex justify-between text-[10px]">
                         <span className="font-bold text-slate-500 uppercase tracking-widest">{t('subtotal')}</span>
                         <span className="font-bold text-[#111928]">${(lastOrder.total / 1.1).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                         <span className="font-bold text-slate-500 uppercase tracking-widest">{t('vat')}</span>
                         <span className="font-bold text-[#111928]">${(lastOrder.total - (lastOrder.total / 1.1)).toFixed(2)}</span>
                      </div>
                      <div className="h-px w-full border-b border-dashed border-slate-300 my-2" />
                      <div className="flex justify-between items-baseline py-2">
                         <span className="text-sm font-black uppercase tracking-tighter text-[#111928]">{t('grand_total')}</span>
                         <span className="text-xl font-black text-[#111928]">${lastOrder.total.toFixed(2)}</span>
                      </div>
                   </div>

                   <div className="h-px w-full border-b border-dashed border-slate-300 my-2" />
                   
                   <div className="text-center space-y-1">
                      <div>
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#111928] mb-1">{t('thank_you')}</p>

                      </div>
                      
                      <div className="flex justify-center py-2 grayscale opacity-80">
                        {/* Realistic barcode pattern */}
                        <div className="h-10 w-full bg-slate-900" style={{ 
                          backgroundImage: 'repeating-linear-gradient(90deg, #111928, #111928 1px, transparent 1px, transparent 3px, #111928 3px, #111928 4px, transparent 4px, transparent 6px)',
                          backgroundSize: '100% 100%'
                        }} />
                      </div>
                      

                   </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 print-hidden">
                   <Button onClick={printReceipt} className="flex-1 bg-slate-900 text-white rounded-none uppercase text-[10px] font-black tracking-widest gap-2">
                      <Receipt className="h-4 w-4" />
                      {t('print_receipt') || 'Print Receipt'}
                   </Button>
                   <Button onClick={() => setShowReceipt(false)} variant="outline" className="flex-1 rounded-none uppercase text-[10px] font-black tracking-widest">
                      {t('close') || 'Close'}
                   </Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BarcodeScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
      />
    </div>
  );
};
