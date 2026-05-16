'use client';

import { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarcodeScannerModal } from '@/components/ui/BarcodeScannerModal';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// Modular Components
import { CartItem, POSTabProps } from '../../pos/types';
import { POSProductBrowser } from '../../pos/POSProductBrowser';
import { POSCartTable } from '../../pos/POSCartTable';
import { POSCheckoutModal } from '../../pos/POSCheckoutModal';
import { POSReceiptModal } from '../../pos/POSReceiptModal';

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
      const productId = product.productId;
      const existing = prev.find(item => item.productId === productId);
      
      const pName = product.productDetails?.name || product.name || 'Unknown';
      const pSku = product.productDetails?.sku || product.sku || '';
      const pCode = product.productDetails?.productCode || product.productCode || pSku;
      const pPrice = Number(product.currentPrice || product.price || 0);
      const pImage = product.productDetails?.imageUrl || product.imageUrl;

      if (existing) {
        return prev.map(item => 
          item.productId === productId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        productId,
        name: pName,
        sku: pSku,
        productCode: pCode,
        price: pPrice,
        quantity: 1,
        image: pImage
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const filteredProducts = useMemo(() => {
    return branchProducts.filter(p => {
      const pNameRaw = (p.productDetails?.name || p.name || '');
      if (!pNameRaw || pNameRaw.toLowerCase() === 'unknown') return false;

      const search = searchTerm.toLowerCase();
      const pName = pNameRaw.toLowerCase();
      const pSku = (p.productDetails?.sku || p.sku || '').toLowerCase();
      const pCode = (p.productDetails?.productCode || p.productCode || '').toLowerCase();
      return pName.includes(search) || pSku.includes(search) || pCode.includes(search);
    });
  }, [branchProducts, searchTerm]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    try {
      // 1. Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 2. In real app, we would update Firestore here
      for (const item of cart) {
        await updateStock(item.productId, -item.quantity, 'adjust', true);
      }

      const orderData = {
        id: `POS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        items: [...cart],
        total,
        date: new Date()
      };

      setLastOrder(orderData);
      setCart([]);
      setIsCheckoutModalOpen(false);
      setShowReceipt(true);
      onRefresh();
    } catch (error) {
      console.error('Checkout failed', error);
      openLabelNotice('Error', 'Transaction failed. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] lg:h-[calc(100vh-180px)] overflow-hidden bg-slate-50 dark:bg-[#111928] rounded-2xl border border-slate-200 dark:border-slate-800 p-2 lg:p-4 gap-4">
      <div className="flex-1 min-w-0 h-1/2 lg:h-full overflow-hidden">
        <POSProductBrowser 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setIsScannerOpen={setIsScannerOpen}
          onRefresh={onRefresh}
          filteredProducts={filteredProducts}
          addToCart={addToCart}
        />
      </div>

      <div className="w-full lg:w-96 flex flex-col gap-4 h-1/2 lg:h-full">
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1C2434] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#5750F1]/10 text-[#5750F1] flex items-center justify-center">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tighter">{t('active_cart') || 'Active Cart'}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{cart.length} {t('items')}</p>
              </div>
            </div>
            {lastOrder && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReceipt(true)}
                className="text-[10px] font-black uppercase tracking-widest text-[#5750F1] hover:bg-[#5750F1]/5"
              >
                <Receipt className="h-3 w-3 mr-2" /> {t('reprint') || 'Reprint'}
              </Button>
            )}
          </div>

          <POSCartTable 
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
          />

          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-3 mb-6 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('subtotal')}</span>
                <span className="text-xs font-black text-[#111928] dark:text-white">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('tax')}</span>
                <span className="text-xs font-black text-[#111928] dark:text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-black text-[#111928] dark:text-white uppercase tracking-widest">{t('grand_total')}</span>
                <span className="text-2xl font-black text-[#5750F1]">${total.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              onClick={() => setIsCheckoutModalOpen(true)}
              disabled={cart.length === 0}
              className="w-full h-16 bg-[#5750F1] hover:bg-[#4a44d1] text-white rounded-sm font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-[#5750F1]/20"
            >
              {t('process_checkout')}
            </Button>
          </div>
        </div>
      </div>

      <BarcodeScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          const product = branchProducts.find(p => (p.productDetails?.sku || p.sku) === code || (p.productDetails?.productCode || p.productCode) === code);
          if (product) {
            addToCart(product);
            setIsScannerOpen(false);
            openLabelNotice('Success', `Added ${product.productDetails?.name || product.name} to cart`, 'success');
          } else {
            openLabelNotice('Not Found', `Product with code ${code} not in this branch`, 'error');
          }
        }}
      />

      <POSCheckoutModal 
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cart={cart}
        subtotal={subtotal}
        tax={tax}
        total={total}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        isProcessing={isProcessing}
        handleCheckout={handleCheckout}
      />

      <POSReceiptModal 
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        order={lastOrder}
        branch={branch}
      />
    </div>
  );
};
