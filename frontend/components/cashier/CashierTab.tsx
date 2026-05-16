'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Minus, Package, Plus, Search, ShoppingCart, Trash2, User as UserIcon } from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc as fsDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { nextBranchSequence } from '@/lib/id-generator';

import { ProductGrid } from './ProductGrid';
import { CartItemList } from './CartItemList';
import { SalesHistoryTable } from './SalesHistoryTable';
import { CheckoutFlowModal } from './CheckoutFlowModal';
import { 
  StaffUser, 
  Branch, 
  Category, 
  BranchProduct, 
  DigitalLabel, 
  CartItem, 
  money 
} from './types';

export default function CashierTab(props: {
  currentUser: StaffUser;
  branch: Branch | null;
  categories: Category[];
  branchProducts: BranchProduct[];
  labels: DigitalLabel[];
  companyId: string;
  canViewSales: boolean;
  canManageSales: boolean;
}) {
  const { currentUser, branch, categories, branchProducts, labels, companyId, canViewSales, canManageSales } = props;

  const [productIdInput, setProductIdInput] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutNote, setCheckoutNote] = useState<string | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [savedReceiptNo, setSavedReceiptNo] = useState<string | null>(null);
  const [savedSaleId, setSavedSaleId] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<{
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    cash: number;
    createdAt: Date;
  } | null>(null);

  const [historyMode, setHistoryMode] = useState<'today' | 'all' | 'date'>('today');
  const [historyDate, setHistoryDate] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  });
  const [sales, setSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);

  const branchProductByProductId = useMemo(() => {
    const map = new Map<string, BranchProduct>();
    for (const bp of branchProducts) map.set(bp.productId, bp);
    return map;
  }, [branchProducts]);

  const labelByProductId = useMemo(() => {
    const map = new Map<string, DigitalLabel>();
    // If multiple labels for same product in a branch, pick one with discount/finalPrice first.
    for (const l of labels) {
      if (!l.productId) continue;
      if (branch?.id && l.branchId !== branch.id) continue;
      const prev = map.get(l.productId);
      if (!prev) {
        map.set(l.productId, l);
        continue;
      }
      const prevHasDiscount = (prev.finalPrice ?? null) != null && (prev.basePrice ?? null) != null && (prev.finalPrice as number) < (prev.basePrice as number);
      const curHasDiscount = (l.finalPrice ?? null) != null && (l.basePrice ?? null) != null && (l.finalPrice as number) < (l.basePrice as number);
      if (!prevHasDiscount && curHasDiscount) map.set(l.productId, l);
    }
    return map;
  }, [labels, branch?.id]);

  const effectivePriceForProduct = (productId: string, fallback: number) => {
    const label = labelByProductId.get(productId);
    const base = label?.basePrice ?? fallback;
    const final = label?.finalPrice ?? base;
    return {
      base: Number(base ?? fallback),
      final: Number(final ?? base ?? fallback),
      discountPercent: label?.discountPercent ?? null,
    };
  };

  const resolveBranchProduct = (raw: string): BranchProduct | null => {
    const input = raw.trim();
    if (!input) return null;

    // 1) direct match by productId
    const direct = branchProductByProductId.get(input);
    if (direct) return direct;

    // 2) match by sku / productCode
    const lower = input.toLowerCase();
    for (const bp of branchProducts) {
      const pd = bp.productDetails;
      if (!pd) continue;
      if (pd.sku?.toLowerCase() === lower) return bp;
      if (pd.productCode?.toLowerCase() === lower) return bp;
    }

    return null;
  };

  const addToCart = (bp: BranchProduct) => {
    const productId = bp.productId;
    const name = bp.productDetails?.name ?? 'Unnamed Product';
    const category = bp.productDetails?.category;

    const { base, final, discountPercent } = effectivePriceForProduct(productId, bp.currentPrice);

    setCart((prev) => {
      const key = productId;
      const existing = prev.find((x) => x.key === key);
      const nextQty = (existing?.qty ?? 0) + 1;
      if (bp.stock <= 0) {
        setCheckoutNote(`"${name}" is out of stock.`);
        return prev;
      }
      if (nextQty > bp.stock) {
        setCheckoutNote(`Not enough stock for "${name}". Available: ${bp.stock}`);
        return prev;
      }
      if (existing) {
        return prev.map((x) => (x.key === key ? { ...x, qty: x.qty + 1 } : x));
      }
      return [
        ...prev,
        {
          key,
          productId,
          name,
          category,
          qty: 1,
          baseUnitPrice: base,
          finalUnitPrice: final,
          discountPercent,
          imageUrl: bp.productDetails?.imageUrl || null,
        },
      ];
    });

    setCheckoutNote(null);
  };

  const addFromInput = () => {
    const bp = resolveBranchProduct(productIdInput);
    if (!bp) {
      setCheckoutNote('Product not found. Try Product ID, SKU, or Product Code.');
      return;
    }
    addToCart(bp);
    setProductIdInput('');
  };

  const setQty = (key: string, qty: number) => {
    setCart((prev) => {
      const next = prev
        .map((x) => (x.key === key ? { ...x, qty } : x))
        .filter((x) => x.qty > 0);
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    setCheckoutNote(null);
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.baseUnitPrice * item.qty, 0);
    const total = cart.reduce((sum, item) => sum + item.finalUnitPrice * item.qty, 0);
    return {
      subtotal,
      total,
      discount: Math.max(0, subtotal - total),
      items: cart.reduce((sum, item) => sum + item.qty, 0),
    };
  }, [cart]);

  const receiptPreviewText = useMemo(() => {
    const snap = savedSnapshot;
    return buildReceiptText({
      receiptNo: savedReceiptNo,
      createdAt: snap?.createdAt,
      cash: typeof snap?.cash === 'number' ? snap.cash : Number(cashReceived || 0),
      items: snap?.items ?? cart,
      subtotal: snap?.subtotal ?? totals.subtotal,
      discount: snap?.discount ?? totals.discount,
      total: snap?.total ?? totals.total,
    });
  }, [savedSnapshot, savedReceiptNo, cashReceived, cart, totals.subtotal, totals.discount, totals.total, branch?.name]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return branchProducts
      .filter((bp) => {
        const pd = bp.productDetails;
        if (!pd) return false;
        if (activeCategory !== 'all' && pd.category !== activeCategory) return false;
        if (!q) return true;
        return (
          pd.name?.toLowerCase().includes(q) ||
          pd.sku?.toLowerCase().includes(q) ||
          pd.productCode?.toLowerCase().includes(q) ||
          bp.productId.toLowerCase().includes(q)
        );
      })
      .slice(0, 60);
  }, [branchProducts, activeCategory, productSearch]);

  // ---------------------- Sales persistence + history ----------------------
  const buildSaleTimeRange = () => {
    if (historyMode === 'all') return null;
    const dateStr = historyMode === 'today' ? (() => {
      const d = new Date();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${mm}-${dd}`;
    })() : historyDate;

    const [y, m, d] = dateStr.split('-').map((x) => Number(x));
    const start = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
    const end = new Date(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0, 0);
    return { start: Timestamp.fromDate(start), end: Timestamp.fromDate(end) };
  };

  const fetchSales = async () => {
    if (!canViewSales) return;
    if (!branch?.id) return;
    try {
      setSalesLoading(true);
      // IMPORTANT:
      // Firestore requires a composite index for (where companyId == X) + (orderBy createdAt).
      // To avoid forcing manual index creation, store sales under companies/{companyId}/sales
      // and query that subcollection with a simple orderBy.
      const qy = query(collection(db, 'companies', companyId, 'sales'), orderBy('createdAt', 'desc'), limit(250));
      const snap = await getDocs(qy);
      const raw = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      const range = buildSaleTimeRange();
      const filtered = raw
        .filter((s) => s.branchId === branch.id)
        .filter((s) => {
          if (!range) return true;
          const ts: Timestamp | undefined = s.createdAt;
          if (!ts) return false;
          return ts.toMillis() >= range.start.toMillis() && ts.toMillis() < range.end.toMillis();
        })
        .slice(0, 60);

      setSales(filtered);
    } catch (e) {
      console.error('Error fetching sales:', e);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewSales, companyId, branch?.id, historyMode, historyDate]);

  const clearSalesHistory = async () => {
    if (!canManageSales) return;
    if (!branch?.id) return;
    const range = buildSaleTimeRange();
    if (!range && !confirm('Clear ALL sales history for this branch? This cannot be undone.')) return;
    if (range && !confirm('Clear sales in this date range? This cannot be undone.')) return;

    try {
      setSalesLoading(true);
      const qy = query(collection(db, 'companies', companyId, 'sales'), orderBy('createdAt', 'desc'), limit(500));
      const snap = await getDocs(qy);
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((s) => s.branchId === branch.id)
        .filter((s) => {
          if (!range) return true;
          const ts: Timestamp | undefined = s.createdAt;
          if (!ts) return false;
          return ts.toMillis() >= range.start.toMillis() && ts.toMillis() < range.end.toMillis();
        })
        .slice(0, 200);

      for (const d of docs) {
        await deleteDoc(fsDoc(db, 'companies', companyId, 'sales', d.id));
      }
      await fetchSales();
    } catch (e) {
      console.error('Error clearing sales:', e);
      alert('Failed to clear sales history.');
    } finally {
      setSalesLoading(false);
    }
  };

  const simulateScan = () => {
    if (!branchProducts.length) return;
    const idx = Math.floor(Math.random() * branchProducts.length);
    const bp = branchProducts[idx];
    // Demo-only: pretend barcode scan returned the Product ID
    setProductIdInput(bp.productId);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = 880;
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 90);
    } catch {}
  };

  const openCheckout = () => {
    setSaleError(null);
    setSavedReceiptNo(null);
    setSavedSaleId(null);
    setSavedSnapshot(null);
    setCashReceived(totals.total ? String(totals.total.toFixed(2)) : '0');
    setIsCheckoutOpen(true);
  };

  function buildReceiptText(opts: {
    receiptNo?: string | null;
    createdAt?: Date;
    cash?: number;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
  }) {
    const created = opts.createdAt ?? new Date();
    const lines: string[] = [];
    const center = (s: string) => {
      const w = 32;
      if (s.length >= w) return s;
      const pad = Math.floor((w - s.length) / 2);
      return ' '.repeat(Math.max(0, pad)) + s;
    };
    const wrap32 = (s: string) => {
      const w = 32;
      const out: string[] = [];
      const words = String(s || '').split(/\s+/).filter(Boolean);
      let line = '';
      for (const w0 of words) {
        if (!line) {
          line = w0;
          continue;
        }
        if ((line + ' ' + w0).length <= w) {
          line = line + ' ' + w0;
        } else {
          out.push(line);
          line = w0;
        }
      }
      if (line) out.push(line);
      if (!out.length) out.push('');
      return out;
    };
    lines.push(center((branch?.name || 'SHOP').toUpperCase()));
    if (branch?.address) {
      for (const l of wrap32(`Address: ${branch.address}`)) lines.push(center(l));
    }
    if (branch?.phone) lines.push(center(`Tel: ${branch.phone}`));
    if (opts.receiptNo) lines.push(center(`RECEIPT: ${opts.receiptNo}`));
    lines.push(center(created.toLocaleString()));
    lines.push('--------------------------------');
    lines.push('Item                 Qty  Total');
    lines.push('--------------------------------');
    for (const it of opts.items) {
      const name = (it.name || it.productId).slice(0, 18);
      const qty = String(it.qty).padStart(3, ' ');
      const total = (it.finalUnitPrice * it.qty).toFixed(2).padStart(7, ' ');
      lines.push(`${name.padEnd(18, ' ')}  ${qty}  ${total}`);
    }
    lines.push('--------------------------------');
    lines.push(`SUBTOTAL:${opts.subtotal.toFixed(2).padStart(21, ' ')}`);
    lines.push(`DISCOUNT:${opts.discount.toFixed(2).padStart(21, ' ')}`);
    lines.push(`TOTAL:${opts.total.toFixed(2).padStart(24, ' ')}`);
    if (typeof opts.cash === 'number') {
      const change = Math.max(0, opts.cash - opts.total);
      lines.push('');
      lines.push(`CASH:${opts.cash.toFixed(2).padStart(25, ' ')}`);
      lines.push(`CHANGE:${change.toFixed(2).padStart(23, ' ')}`);
    }
    lines.push('');
    lines.push(center('THANK YOU!'));
    return lines.join('\n');
  }

  const downloadReceipt = (text: string, receiptNo?: string | null) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receiptNo || 'receipt'}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const printReceipt = (text: string) => {
    const w = window.open('', '_blank', 'width=420,height=600');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Receipt</title>
      <style>
        body{margin:0;padding:18px;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;color:#111;}
        pre{white-space:pre-wrap;font-size:12px;line-height:1.35;}
        @media print{body{padding:0} }
      </style>
      </head><body><pre>${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
      <script>window.onload=()=>{window.print();}</script>
      </body></html>`);
    w.document.close();
  };

  const confirmCheckout = async () => {
    if (!branch?.id) return;
    if (!cart.length) return;
    if (savedSaleId) return;

    const cash = Number(cashReceived);
    if (!Number.isFinite(cash) || cash < totals.total) {
      setSaleError('Cash received must be a number and cannot be less than Total.');
      return;
    }

    setIsSavingSale(true);
    setSaleError(null);
    try {
      const snapshot = {
        items: cart.map((c) => ({ ...c })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
        cash,
        createdAt: new Date(),
      };

      // Clean, human-friendly receipt number per-branch
      const seq = await nextBranchSequence(branch.id, 'nextSaleNumber');
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const receiptNo = `RCPT-${y}${m}${day}-${String(seq).padStart(6, '0')}`;
      const saleId = receiptNo; // also use as doc id (clean)

      // Atomically: reduce stock + write sale
      const saleRef = fsDoc(db, 'companies', companyId, 'sales', saleId);
      await runTransaction(db, async (tx) => {
        // 1) Stock checks + updates
        for (const item of cart) {
          const bp = branchProductByProductId.get(item.productId);
          if (!bp) {
            throw new Error(`Missing branch product for: ${item.name}`);
          }
          const bpRef = fsDoc(db, 'branch_products', bp.id);
          const bpSnap = await tx.get(bpRef);
          const currentStock = Number((bpSnap.data() as any)?.stock ?? 0);
          const nextStock = currentStock - item.qty;
          if (nextStock < 0) {
            throw new Error(`Not enough stock for "${item.name}". Available: ${currentStock}`);
          }
          tx.update(bpRef, {
            stock: nextStock,
            lastUpdated: serverTimestamp(),
          });
        }

        // 2) Sale
        tx.set(saleRef, {
          receiptNo,
          companyId,
          branchId: branch.id,
          branchName: branch.name,
          staffId: currentUser.id,
          staffName: currentUser.name,
          staffEmail: currentUser.email,
          subtotal: totals.subtotal,
          discountTotal: totals.discount,
          total: totals.total,
          cashReceived: cash,
          change: Math.max(0, cash - totals.total),
          items: cart.map((i) => ({
            productId: i.productId,
            name: i.name,
            category: i.category || null,
            qty: i.qty,
            baseUnitPrice: i.baseUnitPrice,
            finalUnitPrice: i.finalUnitPrice,
            discountPercent: i.discountPercent ?? null,
            lineTotal: i.finalUnitPrice * i.qty,
          })),
          createdAt: serverTimestamp(),
        });
      });

      setSavedReceiptNo(receiptNo);
      setSavedSaleId(saleId);
      setSavedSnapshot(snapshot);
      await fetchSales();

      // Reset for next customer
      setIsCheckoutOpen(false);
      setCashReceived('');
      setCart([]);
    } catch (e) {
      console.error('Error saving sale:', e);
      setSaleError(e instanceof Error ? e.message : 'Failed to save sale. Please try again.');
    } finally {
      setIsSavingSale(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Profile / context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">បេឡាករ (Cashier)</h2>
              <p className="text-gray-600 mt-1">
                ស្វែងរកតាម <span className="font-medium text-blue-600">លេខសម្គាល់ផលិតផល (Product ID)</span>, SKU ឬស្កេនបាកូដ។
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-gray-50">
              <ShoppingCart className="h-4 w-4 text-gray-700" />
              <span className="text-sm font-semibold text-gray-900">{totals.items} items</span>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-700">ស្កេនបាកូដ ឬបញ្ចូលលេខកូដផលិតផល</label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={productIdInput}
                  onChange={(e) => setProductIdInput(e.target.value)}
                  placeholder="បញ្ចូលលេខសម្គាល់ / SKU / បាកូដ"
                  className="h-11 rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addFromInput();
                  }}
                />
                <Button onClick={addFromInput} className="h-11 px-6 rounded-xl">បន្ថែម</Button>
                <Button variant="outline" onClick={simulateScan} type="button" className="h-11 px-4 rounded-xl shrink-0">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">ស្កេនសាកល្បង</span>
                </Button>
              </div>
              {checkoutNote && <p className="text-sm text-red-600 mt-2">{checkoutNote}</p>}
              <p className="text-xs text-gray-500 mt-2">
                Tip: this is a demo for barcode scanning. Later you can connect a real scanner (most act like a keyboard and type into this box).
              </p>
            </div>

            <div className="sm:w-72 bg-gray-50 rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-gray-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-600 truncate">{currentUser.email}</p>
                  <p className="text-xs text-gray-500">{currentUser.position || 'Staff'} · {branch?.name || 'Branch'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Totals card */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">សរុបការទូទាត់ (Summary)</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">សរុប (Subtotal)</span>
              <span className="font-medium text-gray-900">{money(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">បញ្ចុះតម្លៃ (Discount)</span>
              <span className={cn('font-medium', totals.discount > 0 ? 'text-emerald-700' : 'text-gray-900')}>
                -{money(totals.discount)}
              </span>
            </div>
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-gray-900 font-bold">សរុបត្រូវបង់ (Total)</span>
              <span className="text-2xl font-black text-gray-900">{money(totals.total)}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={clearCart}
              disabled={cart.length === 0}
              className="w-full h-11 rounded-xl"
            >
              សម្អាត
            </Button>
            <Button onClick={openCheckout} disabled={cart.length === 0} className="w-full h-11 rounded-xl font-bold">
              បង់ប្រាក់
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Auto-discount is based on the product’s assigned digital label (finalPrice/discountPercent) if present.
          </p>
        </div>
      </div>

      <ProductGrid 
        categories={categories}
        filteredProducts={filteredProducts}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        addToCart={addToCart}
        effectivePriceForProduct={effectivePriceForProduct}
      />

      <CartItemList 
        cart={cart}
        setQty={setQty}
        clearCart={clearCart}
      />

      {/* Sales history */}
      {canViewSales && (
        <SalesHistoryTable 
          sales={sales}
          salesLoading={salesLoading}
          historyMode={historyMode}
          setHistoryMode={setHistoryMode}
          historyDate={historyDate}
          setHistoryDate={setHistoryDate}
          fetchSales={fetchSales}
          canManageSales={canManageSales}
          clearSalesHistory={clearSalesHistory}
        />
      )}

      <CheckoutFlowModal 
        isCheckoutOpen={isCheckoutOpen}
        setIsCheckoutOpen={setIsCheckoutOpen}
        isSavingSale={isSavingSale}
        cart={cart}
        totals={totals}
        cashReceived={cashReceived}
        setCashReceived={setCashReceived}
        saleError={saleError}
        confirmCheckout={confirmCheckout}
        savedSaleId={savedSaleId}
        savedReceiptNo={savedReceiptNo}
        receiptPreviewText={receiptPreviewText}
        printReceipt={printReceipt}
        downloadReceipt={downloadReceipt}
        clearCart={clearCart}
        setProductIdInput={setProductIdInput}
      />

      {/* Mobile bottom bar (app-like) */}
      {!isCheckoutOpen && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden animate-in slide-in-from-bottom duration-300">
          <div className="mx-auto max-w-7xl px-4 pb-6">
            <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-2xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">សរុបត្រូវបង់</div>
                <div className="text-xl font-black text-gray-900 truncate leading-tight">{money(totals.total)}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={clearCart} className="h-11 px-4 rounded-xl border-gray-200 font-medium">សម្អាត</Button>
                <Button onClick={openCheckout} className="h-11 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-md">បង់ប្រាក់</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
