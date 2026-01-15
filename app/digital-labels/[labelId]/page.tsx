'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
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

function DigitalLabelContent() {
  const params = useParams<{ labelId: string }>();
  const searchParams = useSearchParams();
  const { user } = useUserStore();
  const [label, setLabel] = useState<Label | null>(null);
  const [loading, setLoading] = useState(true);

  const companyId = useMemo(() => {
    return searchParams.get('companyId') || user?.companyId || '';
  }, [searchParams, user?.companyId]);

  useEffect(() => {
    const load = async () => {
      if (!params?.labelId) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'labels', params.labelId));
        if (snap.exists()) {
          const data = snap.data() as any;
          const productId = data?.productId as string | undefined;
          if (productId && (!data.productSku || !data.productName)) {
            const productSnap = await getDoc(doc(db, 'products', productId));
            if (productSnap.exists()) {
              const product = productSnap.data() as any;
              data.productSku = data.productSku ?? product?.sku ?? null;
              data.productName = data.productName ?? product?.name ?? null;
            }
          }
          setLabel({ id: snap.id, ...data } as Label);
        } else {
          setLabel(null);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params?.labelId]);

  const displayId = label?.labelId || label?.labelCode || label?.id;
  const basePrice =
    label?.basePrice != null ? Number(label.basePrice) : null;
  const price =
    label?.currentPrice != null ? Number(label.currentPrice) : basePrice;
  const discountPrice =
    label?.discountPrice != null ? Number(label.discountPrice) : null;
  const discountPercent = label?.discountPercent ?? null;
  const computedDiscount =
    basePrice != null && discountPercent != null
      ? Number((basePrice * (1 - discountPercent / 100)).toFixed(2))
      : null;
  const displayPrice =
    discountPrice != null ? discountPrice : computedDiscount != null ? computedDiscount : price;
  const unitPrice = basePrice != null ? basePrice.toFixed(2) : '--';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#f1f5f9_40%,_#e2e8f0)] p-6 text-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <div className="text-sm text-gray-600">
              Company: <span className="font-medium">{companyId || '--'}</span>
            </div>
            <div className="text-sm text-gray-600">
              Branch: <span className="font-medium">{label?.branchId || '--'}</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Label ID: <span className="font-medium">{displayId || '--'}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-600">Loading label...</div>
        ) : !label ? (
          <div className="bg-white border rounded-xl p-6 text-sm text-gray-600">
            Label not found.
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className="relative w-full max-w-[680px] rounded-[28px] border-4 border-slate-300 bg-gradient-to-br from-white via-slate-50 to-amber-50 shadow-[0_12px_30px_rgba(15,23,42,0.2)]"
              style={{ fontFamily: 'Trebuchet MS, Verdana, sans-serif' }}
            >
              <div className="absolute -top-5 left-6 h-10 w-32 rounded-full border border-slate-300 bg-white shadow-sm"></div>

              <div className="flex gap-4 border-b border-slate-200 px-6 py-5">
                {discountPercent != null ? (
                  <div className="w-16 shrink-0 rounded-xl bg-rose-600 text-white text-center text-xs font-bold tracking-[0.2em]">
                    <div className="py-2">SALE</div>
                    <div className="border-t border-rose-300 py-2 text-[10px]">
                      {discountPercent}%
                    </div>
                  </div>
                ) : (
                  <div className="w-16 shrink-0 rounded-xl bg-emerald-700 text-white text-center text-xs font-bold tracking-[0.2em]">
                    <div className="py-2">PRICE</div>
                    <div className="border-t border-emerald-300 py-2 text-[10px]">
                      READY
                    </div>
                  </div>
                )}

                <div className="flex-1">
                  <div className="text-xs text-slate-500 uppercase tracking-[0.3em]">
                    Digital Shelf Label
                  </div>
                  <div className="mt-2 flex items-end gap-3">
                    <div className="flex flex-col">
                      <div
                        className="text-6xl font-bold text-slate-900"
                        style={{ fontFamily: 'Courier New, Courier, monospace' }}
                      >
                        {displayPrice != null ? `$${displayPrice.toFixed(2)}` : '--'}
                      </div>
                      {discountPercent != null && basePrice != null && displayPrice != null && displayPrice < basePrice && (
                        <div className="text-sm text-slate-500 line-through">
                          ${basePrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mb-2">USD</div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 rounded-lg bg-amber-200/70 px-4 py-2 text-sm">
                    <span className="font-semibold text-slate-700">UNIT PRICE</span>
                    <span
                      className="font-bold text-slate-900"
                      style={{ fontFamily: 'Courier New, Courier, monospace' }}
                    >
                      ${unitPrice}
                    </span>
                    {discountPercent != null && (
                      <span className="ml-auto text-xs font-semibold text-rose-700">
                        SAVE {discountPercent}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="text-base font-semibold text-slate-900">
                  {label.productName || 'Unassigned Product'}
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
                  <div>SKU: {label.productSku || '--'}</div>
                  <div className="text-xs uppercase tracking-[0.4em] text-slate-400">
                    {label.branchId || 'Branch'}
                  </div>
                </div>
                <div className="mt-4 h-10 rounded-md bg-slate-200">
                  <div className="h-full w-full bg-[repeating-linear-gradient(90deg,_#111_0_2px,_transparent_2px_4px)] opacity-70"></div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 text-xs text-slate-500">
                <span>Powered by LabelSync</span>
                <span>{displayId}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DigitalLabelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
          <div className="max-w-3xl mx-auto bg-white border rounded-xl p-6 text-sm text-gray-600">
            Loading label...
          </div>
        </div>
      }
    >
      <DigitalLabelContent />
    </Suspense>
  );
}
