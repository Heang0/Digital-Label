'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Minus, Plus, Search, ShoppingCart, Trash2, User as UserIcon } from 'lucide-react';
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

type StaffUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'vendor' | 'staff';
  branchId?: string;
  position?: string;
};

type Branch = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
};

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  productCode?: string;
  category: string;
};

type BranchProduct = {
  id: string;
  productId: string;
  currentPrice: number;
  stock: number;
  productDetails?: Product;
};

type DigitalLabel = {
  id: string;
  productId: string | null;
  branchId: string;
  basePrice?: number | null;
  finalPrice?: number | null;
  discountPercent?: number | null;
};

type CartItem = {
  key: string;
  productId: string;
  name: string;
  category?: string;
  qty: number;
  baseUnitPrice: number;
  finalUnitPrice: number;
  discountPercent?: number | null;
};

function money(n: number) {
  if (!Number.isFinite(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
}

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
              <h2 className="text-2xl font-bold text-gray-900">Cashier (Demo)</h2>
              <p className="text-gray-600 mt-1">
                Add items by <span className="font-medium">Product ID</span> (or SKU/Product Code) or pick from category.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-gray-50">
              <ShoppingCart className="h-4 w-4 text-gray-700" />
              <span className="text-sm font-semibold text-gray-900">{totals.items} items</span>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Product ID (demo barcode)</label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={productIdInput}
                  onChange={(e) => setProductIdInput(e.target.value)}
                  placeholder="Enter Product ID / SKU / Product Code"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addFromInput();
                  }}
                />
                <Button onClick={addFromInput}>Add</Button>
                <Button variant="outline" onClick={simulateScan} type="button">Simulate Scan</Button>
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
          <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">{money(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Discount</span>
              <span className={cn('font-medium', totals.discount > 0 ? 'text-emerald-700' : 'text-gray-900')}>
                -{money(totals.discount)}
              </span>
            </div>
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-gray-900 font-semibold">Total</span>
              <span className="text-xl font-bold text-gray-900">{money(totals.total)}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={clearCart}
              disabled={cart.length === 0}
              className="w-full"
            >
              Clear
            </Button>
            <Button onClick={openCheckout} disabled={cart.length === 0} className="w-full">
              Checkout
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Auto-discount is based on the product’s assigned digital label (finalPrice/discountPercent) if present.
          </p>
        </div>
      </div>

      {/* Categories + products */}
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
              placeholder="Search name / SKU / code / ID"
              className="pl-10"
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

      {/* Cart */}
      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Cart</h3>
          <Button variant="outline" size="sm" onClick={clearCart} disabled={cart.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b">
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => {
                const hasDiscount = item.finalUnitPrice < item.baseUnitPrice;
                return (
                  <tr key={item.key} className="border-b last:border-b-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.productId}{item.category ? ` · ${item.category}` : ''}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-gray-900">{money(item.finalUnitPrice)}</p>
                      {hasDiscount && <p className="text-xs text-gray-500 line-through">{money(item.baseUnitPrice)}</p>}
                    </td>
                   <td className="py-3 pr-4">
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
                    </td>

                    <td className="py-3 pr-4 font-semibold text-gray-900">{money(item.finalUnitPrice * item.qty)}</td>
                    <td className="py-3">
                      <Button variant="outline" size="sm" onClick={() => setQty(item.key, 0)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {cart.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    No items yet. Add by Product ID or pick from the product grid.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales history */}
      {canViewSales && (
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sales history</h3>
              <p className="text-sm text-gray-600">View sales for today or previous days. Vendors and manager-level staff can clear history.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                className="h-9 rounded-xl border bg-white px-3 text-sm"
                value={historyMode}
                onChange={(e) => setHistoryMode(e.target.value as any)}
              >
                <option value="today">Today</option>
                <option value="date">Pick date</option>
                <option value="all">All</option>
              </select>

              {historyMode === 'date' && (
                <Input
                  type="date"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  className="h-9"
                />
              )}

              <Button variant="outline" onClick={fetchSales} disabled={salesLoading}>
                Refresh
              </Button>

              {canManageSales && (
                <Button variant="outline" onClick={clearSalesHistory} disabled={salesLoading}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Items</th>
                  <th className="py-2 pr-4">Subtotal</th>
                  <th className="py-2 pr-4">Discount</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2">Staff</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => {
                  const ts: any = s.createdAt;
                  const d = ts?.toDate ? ts.toDate() : null;
                  const time = d ? d.toLocaleString() : '—';
                  const items = Array.isArray(s.items) ? s.items.reduce((n: number, it: any) => n + Number(it.qty || 0), 0) : 0;
                  return (
                    <tr key={s.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 text-sm text-gray-700 whitespace-nowrap">{time}</td>
                      <td className="py-3 pr-4 text-sm text-gray-700">{items}</td>
                      <td className="py-3 pr-4 text-sm font-semibold text-gray-900">{money(Number(s.subtotal || 0))}</td>
                      <td className="py-3 pr-4 text-sm text-emerald-700">-{money(Number(s.discountTotal || 0))}</td>
                      <td className="py-3 pr-4 text-sm font-bold text-gray-900">{money(Number(s.total || 0))}</td>
                      <td className="py-3 text-sm text-gray-700">{s.staffName || '—'}</td>
                    </tr>
                  );
                })}

                {salesLoading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">Loading…</td>
                  </tr>
                )}
                {!salesLoading && sales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">No sales found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checkout modal + receipt */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">Confirm checkout</div>
                <div className="text-sm text-gray-600">This will create a real sale record for vendor/staff history.</div>
              </div>
              <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} disabled={isSavingSale}>
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-6">
                <label className="text-sm font-semibold text-gray-700">Cash received</label>
                <Input
                  className="mt-2"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="e.g. 20.00"
                />
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{money(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-emerald-700">-{money(totals.discount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">{money(totals.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Change</span>
                    <span className="font-medium">{money(Math.max(0, Number(cashReceived || 0) - totals.total))}</span>
                  </div>
                </div>

                {saleError && <div className="mt-3 text-sm text-red-600">{saleError}</div>}

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    onClick={confirmCheckout}
                    disabled={isSavingSale || cart.length === 0 || Boolean(savedSaleId)}
                    className="w-full"
                  >
                    {savedSaleId ? 'Saved' : isSavingSale ? 'Saving…' : 'Confirm & Save'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsCheckoutOpen(false)}
                    disabled={isSavingSale}
                    className="w-full"
                  >
                    Close
                  </Button>

                  {savedSaleId && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => printReceipt(receiptPreviewText)}
                        className="w-full"
                      >
                        Print Receipt
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => downloadReceipt(receiptPreviewText, savedReceiptNo)}
                        className="w-full"
                      >
                        Download Receipt
                      </Button>
                    </>
                  )}

                  {savedSaleId && (
                    <Button
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        clearCart();
                        setProductIdInput('');
                      }}
                      className="w-full sm:col-span-2"
                    >
                      Finish (New Sale)
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50">
                <div className="rounded-xl border bg-white p-4 font-mono text-xs leading-5 whitespace-pre-wrap overflow-auto text-gray-900">
                  {receiptPreviewText}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {savedSaleId
                    ? `Saved as ${savedReceiptNo}. You can print or download the receipt.`
                    : 'Receipt preview (paper style).'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom bar (app-like) */}
      {!isCheckoutOpen && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
          <div className="mx-auto max-w-7xl px-4 pb-4">
            <div className="rounded-2xl border bg-white shadow-lg p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-lg font-bold text-gray-900 truncate">{money(totals.total)}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={clearCart} className="h-10">Clear</Button>
                <Button onClick={openCheckout} className="h-10">Checkout</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
