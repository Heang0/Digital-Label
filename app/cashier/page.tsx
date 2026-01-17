'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/user-store';
import { db, logOut } from '@/lib/firebase';
import {
  collection,
  doc as fsDoc,
  getDoc,
  getDocs,
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

    (async () => {
      try {
        setLoading(true);

        // Branch
        const branchDoc = await getDoc(fsDoc(db, 'branches', effectiveBranchId));
        setBranch(branchDoc.exists() ? ({ id: branchDoc.id, ...(branchDoc.data() as any) } as Branch) : null);

        // Branch products
        const bpq = query(
          collection(db, 'branch_products'),
          where('branchId', '==', effectiveBranchId),
          where('companyId', '==', currentUser.companyId)
        );
        const bps = await getDocs(bpq);
        const bpData = await Promise.all(
          bps.docs.map(async (d) => {
            const bp = d.data() as any;
            const pDoc = await getDoc(fsDoc(db, 'products', bp.productId));
            const productDetails = pDoc.exists() ? ({ id: pDoc.id, ...(pDoc.data() as any) } as Product) : undefined;
            return {
              id: d.id,
              ...(bp as any),
              productDetails,
            } as BranchProduct;
          })
        );
        setBranchProducts(bpData);

        // Labels
        const lq = query(
          collection(db, 'labels'),
          where('branchId', '==', effectiveBranchId),
          where('companyId', '==', currentUser.companyId)
        );
        const ls = await getDocs(lq);
        const lData = ls.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as DigitalLabel[];
        setLabels(lData);

        // Categories
        const cq = query(collection(db, 'categories'), where('companyId', '==', currentUser.companyId));
        const cs = await getDocs(cq);
        const cData = cs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Category[];
        setCategories(cData);
      } catch (e) {
        console.error('Error loading cashier data:', e);
      } finally {
        setLoading(false);
      }
    })();
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
