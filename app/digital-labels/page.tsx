'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, getDoc, getDocs, query, where, doc as fsDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserStore } from '@/lib/user-store';

interface Label {
  id: string;
  labelId?: string;
  labelCode?: string;
  productId?: string | null;
  productName?: string | null;
  productSku?: string | null;
  branchId?: string;
  companyId?: string;
  currentPrice?: number | null;
  basePrice?: number | null;
  discountPercent?: number | null;
  discountPrice?: number | null;
}

function DigitalLabelsContent() {
  const searchParams = useSearchParams();
  const { user } = useUserStore();
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);

  const companyId = useMemo(() => {
    return searchParams.get('companyId') || user?.companyId || '';
  }, [searchParams, user?.companyId]);

  const branchId = useMemo(() => {
    return searchParams.get('branchId') || '';
  }, [searchParams]);

  useEffect(() => {
    if (!companyId) return;

    const load = async () => {
      setLoading(true);
      try {
        const baseQuery = query(
          collection(db, 'labels'),
          where('companyId', '==', companyId)
        );
        const labelsQuery = branchId
          ? query(baseQuery, where('branchId', '==', branchId))
          : baseQuery;

        const snapshot = await getDocs(labelsQuery);
        const rawLabels = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as any)
        })) as Label[];

        const missingSkuIds = Array.from(
          new Set(
            rawLabels
              .filter((label) => !label.productSku && label.productId)
              .map((label) => label.productId as string)
          )
        );

        if (missingSkuIds.length === 0) {
          setLabels(rawLabels);
          return;
        }

        const productEntries = await Promise.all(
          missingSkuIds.map(async (productId) => {
            const productSnap = await getDoc(fsDoc(db, 'products', productId));
            if (!productSnap.exists()) return null;
            const data = productSnap.data() as any;
            return [productId, { name: data?.name, sku: data?.sku }] as const;
          })
        );
        const productMap = new Map(
          productEntries.filter(Boolean) as Array<readonly [string, { name?: string; sku?: string }]>
        );

        setLabels(
          rawLabels.map((label) => {
            const productId = label.productId ?? undefined;
            const product = productId ? productMap.get(productId) : undefined;
            return {
              ...label,
              productName: label.productName ?? product?.name ?? label.productName,
              productSku: label.productSku ?? product?.sku ?? label.productSku,
            };
          })
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [companyId, branchId]);

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-3xl mx-auto bg-white border rounded-xl p-6">
          <h1 className="text-xl font-semibold">Digital Labels</h1>
          <p className="text-gray-600 mt-2">
            Missing company info. Open this page from the Vendor dashboard or
            include `companyId` in the URL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-stone-100 to-amber-50 p-6 text-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Trebuchet MS, Verdana, sans-serif' }}>
            Digital Labels
          </h1>
          <div className="text-sm text-gray-600">
            Company: <span className="font-medium">{companyId}</span>
            {branchId && (
              <>
                {' '}
                • Branch: <span className="font-medium">{branchId}</span>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-600">Loading labels...</div>
        ) : labels.length === 0 ? (
          <div className="bg-white border border-dashed rounded-xl p-6 text-sm text-gray-600">
            No labels found for this selection.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {labels.map((label) => {
              const displayId = label.labelId || label.labelCode || label.id;
              const basePrice =
                label.basePrice != null ? Number(label.basePrice) : null;
              const price =
                label.currentPrice != null
                  ? Number(label.currentPrice)
                  : basePrice;
              const discountPrice =
                label.discountPrice != null ? Number(label.discountPrice) : null;
              const computedDiscount =
                basePrice != null && label.discountPercent != null
                  ? Number((basePrice * (1 - label.discountPercent / 100)).toFixed(2))
                  : null;
              const displayPrice =
                discountPrice != null ? discountPrice : computedDiscount != null ? computedDiscount : price;
              return (
                <Link
                  key={label.id}
                  href={`/digital-labels/${label.id}?companyId=${companyId}${branchId ? `&branchId=${branchId}` : ''}`}
                  className="group"
                >
                  <div className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{displayId}</h2>
                        <p className="text-sm text-gray-600">
                          {label.productName || 'Unassigned'}
                        </p>
                      </div>
                      {label.discountPercent != null ? (
                        <span className="text-[10px] bg-rose-600 text-white px-2 py-1 rounded-full tracking-[0.2em]">
                          SALE
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded-full tracking-[0.2em]">
                          PRICE
                        </span>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-amber-50 p-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-[0.3em]">
                            Price
                          </div>
                          <div
                            className="text-3xl font-bold text-slate-900"
                            style={{ fontFamily: 'Courier New, Courier, monospace' }}
                          >
                            {displayPrice != null ? `$${displayPrice.toFixed(2)}` : '--'}
                          </div>
                          {label.discountPercent != null && basePrice != null && displayPrice != null && displayPrice < basePrice && (
                            <div className="text-xs text-slate-500 line-through">
                              ${basePrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-600">
                          <div>SKU: {label.productSku || '--'}</div>
                          <div>Branch: {label.branchId || '--'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-blue-600 group-hover:underline">
                      Open label view
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DigitalLabelsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
          <div className="max-w-3xl mx-auto bg-white border rounded-xl p-6 text-sm text-gray-600">
            Loading labels...
          </div>
        </div>
      }
    >
      <DigitalLabelsContent />
    </Suspense>
  );
}

