'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/user-store';
import { db, logOut } from '@/lib/firebase';
import {
  collection,
  doc as fsDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CashierTab from '@/components/cashier/CashierTab';

type Branch = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  companyId: string;
};

type Category = { id: string; name: string };

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
  branchId: string;
  companyId: string;
  productDetails?: Product;
};

type DigitalLabel = {
  id: string;
  productId: string | null;
  branchId: string;
  companyId: string;
  basePrice?: number | null;
  finalPrice?: number | null;
  discountPercent?: number | null;
};

export default function CashierPage() {
  const router = useRouter();
  const { user: currentUser, clearUser, hasHydrated } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const [branch, setBranch] = useState<Branch | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branchProducts, setBranchProducts] = useState<BranchProduct[]>([]);
  const [labels, setLabels] = useState<DigitalLabel[]>([]);

  const productCacheRef = useRef<Map<string, Product>>(new Map());

  // Simple in-memory cache to avoid re-fetching product docs on every snapshot
  const [productCache, setProductCache] = useState<Record<string, Product>>({});

  const canViewSales = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'vendor' || currentUser.role === 'admin') return true;
    return Boolean(currentUser.permissions?.canViewReports);
  }, [currentUser]);

  const canManageSales = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'vendor' || currentUser.role === 'admin') return true;
    // Manager-level staff (configured by vendor): allow clearing history
    // Prefer explicit flag if present, otherwise infer from stronger permissions.
    const p: any = currentUser.permissions;
    return Boolean(p?.canManageSales || (p?.canViewReports && p?.canUpdateStock && p?.canChangePrices));
  }, [currentUser]);

  const effectiveBranchId = useMemo(() => {
    if (!currentUser) return '';
    if (currentUser.role === 'staff') return currentUser.branchId || '';
    return selectedBranchId;
  }, [currentUser, selectedBranchId]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.role !== 'staff' && currentUser.role !== 'vendor' && currentUser.role !== 'admin') {
      router.push('/login');
      return;
    }

    (async () => {
      try {
        setLoading(true);
        if (!currentUser.companyId) {
          router.push('/login');
          return;
        }

        // If vendor/admin: load branches and let them pick
        if (currentUser.role !== 'staff') {
          const bq = query(collection(db, 'branches'), where('companyId', '==', currentUser.companyId));
          const bs = await getDocs(bq);
          const bData = bs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Branch[];
          setBranches(bData);
          if (!selectedBranchId && bData.length) setSelectedBranchId(bData[0].id);
        } else {
          setSelectedBranchId(currentUser.branchId || '');
        }
      } catch (e) {
        console.error('Error initializing cashier:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser, hasHydrated, router]);

  useEffect(() => {
    if (!currentUser?.companyId) return;
    if (!effectiveBranchId) return;

    let alive = true;
    setLoading(true);

    // Branch (one-time)
    getDoc(fsDoc(db, 'branches', effectiveBranchId))
      .then((branchDoc) => {
        if (!alive) return;
        setBranch(branchDoc.exists() ? ({ id: branchDoc.id, ...(branchDoc.data() as any) } as Branch) : null);
      })
      .catch((e) => console.error('Error loading branch:', e));

    const loadProductDetails = async (productIds: string[]) => {
      const cache = productCacheRef.current;
      const missing = productIds.filter((id) => !cache.has(id));
      await Promise.all(
        missing.map(async (id) => {
          const pDoc = await getDoc(fsDoc(db, 'products', id));
          if (pDoc.exists()) cache.set(id, { id: pDoc.id, ...(pDoc.data() as any) } as Product);
        })
      );
    };

    // Realtime: branch_products
    const bpq = query(
      collection(db, 'branch_products'),
      where('branchId', '==', effectiveBranchId),
      where('companyId', '==', currentUser.companyId)
    );
    const unsubBranchProducts = onSnapshot(
      bpq,
      async (snap) => {
        try {
          const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[];
          const productIds = Array.from(new Set(rows.map((r) => r.productId).filter(Boolean)));
          await loadProductDetails(productIds);
          const cache = productCacheRef.current;
          const bpData = rows.map((bp) => ({
            ...(bp as any),
            productDetails: cache.get(bp.productId),
          })) as BranchProduct[];

          if (alive) setBranchProducts(bpData);
        } catch (e) {
          console.error('Error processing branch products snapshot:', e);
        } finally {
          if (alive) setLoading(false);
        }
      },
      (e) => {
        console.error('Error listening branch products:', e);
        if (alive) setLoading(false);
      }
    );

    // Realtime: labels
    const lq = query(
      collection(db, 'labels'),
      where('branchId', '==', effectiveBranchId),
      where('companyId', '==', currentUser.companyId)
    );
    const unsubLabels = onSnapshot(
      lq,
      (snap) => {
        if (!alive) return;
        setLabels(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as DigitalLabel[]);
      },
      (e) => console.error('Error listening labels:', e)
    );

    // Realtime: categories
    const cq = query(collection(db, 'categories'), where('companyId', '==', currentUser.companyId));
    const unsubCategories = onSnapshot(
      cq,
      (snap) => {
        if (!alive) return;
        setCategories(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Category[]);
      },
      (e) => console.error('Error listening categories:', e)
    );

    return () => {
      alive = false;
      unsubBranchProducts();
      unsubLabels();
      unsubCategories();
    };
  }, [currentUser?.companyId, effectiveBranchId]);

  const handleLogout = async () => {
    await logOut();
    clearUser();
    router.push('/login');
  };

  if (!hasHydrated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">Cashier</h1>
            <p className="text-sm text-gray-600 truncate">
              {branch ? `${branch.name}${branch.address ? ` • ${branch.address}` : ''}` : 'Select a branch'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentUser?.role !== 'staff' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Branch</span>
                <select
                  className="h-9 rounded-xl border bg-white px-3 text-sm"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button variant="outline" onClick={() => router.push('/staff')}>Back</Button>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading && (
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="text-gray-700">Loading cashier data...</div>
          </div>
        )}

        {!loading && (!currentUser?.companyId || !effectiveBranchId) && (
          <div className="bg-white rounded-xl border p-6 shadow-sm space-y-3">
            <div className="text-gray-900 font-semibold">Missing branch</div>
            <div className="text-gray-600 text-sm">
              Please select a branch to start cashier.
            </div>
          </div>
        )}

        {!loading && currentUser?.companyId && effectiveBranchId && (
          <CashierTab
            currentUser={currentUser as any}
            branch={branch as any}
            categories={categories as any}
            branchProducts={branchProducts as any}
            labels={labels as any}
            companyId={currentUser.companyId}
            canViewSales={canViewSales}
            canManageSales={canManageSales}
          />
        )}
      </main>
    </div>
  );
}
