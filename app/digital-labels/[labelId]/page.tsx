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
  productDescription?: string | null;
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
  const [origin, setOrigin] = useState('');
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string | null>(null);
  const [branchCode, setBranchCode] = useState<string | null>(null);

  const companyId = useMemo(() => {
    return label?.companyId || searchParams.get('companyId') || user?.companyId || '';
  }, [label?.companyId, searchParams, user?.companyId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!params?.labelId) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'labels', params.labelId));
        if (snap.exists()) {
          const data = snap.data() as any;
          const productId = data?.productId as string | undefined;
          if (productId && (!data.productSku || !data.productName || !data.productDescription)) {
            const productSnap = await getDoc(doc(db, 'products', productId));
            if (productSnap.exists()) {
              const product = productSnap.data() as any;
              data.productSku = data.productSku ?? product?.sku ?? null;
              data.productName = data.productName ?? product?.name ?? null;
              data.productDescription = data.productDescription ?? product?.description ?? null;
            }
          }
          setLabel({ ...data, id: snap.id } as Label);
        } else {
          setLabel(null);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params?.labelId]);

  useEffect(() => {
    if (!companyId) {
      setCompanyName(null);
      setCompanyCode(null);
      return;
    }
    const loadCompany = async () => {
      const snap = await getDoc(doc(db, 'companies', companyId));
      if (snap.exists()) {
        const data = snap.data() as any;
        setCompanyName(data?.name ?? null);
        setCompanyCode(data?.code ?? null);
      } else {
        setCompanyName(null);
        setCompanyCode(null);
      }
    };
    loadCompany();
  }, [companyId]);

  useEffect(() => {
    if (!label?.branchId) {
      setBranchName(null);
      setBranchCode(null);
      return;
    }
    const loadBranch = async () => {
      const snap = await getDoc(doc(db, 'branches', label.branchId as string));
      if (snap.exists()) {
        const data = snap.data() as any;
        setBranchName(data?.name ?? null);
        setBranchCode(data?.code ?? null);
      } else {
        setBranchName(null);
        setBranchCode(null);
      }
    };
    loadBranch();
  }, [label?.branchId]);

  const formatShortId = (value: string, prefix: string) => {
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!clean) return '--';
    const suffix = clean.slice(-4);
    return `${prefix}-${suffix}`;
  };
  const companyDisplayCode = companyId
    ? companyCode || formatShortId(companyId, 'VE')
    : '--';
  const branchDisplayCode = label?.branchId
    ? branchCode || formatShortId(label.branchId, 'BR')
    : '--';

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
  const routeLabelId = Array.isArray(params?.labelId)
    ? params.labelId[0]
    : params?.labelId ?? '';
  const isValidId =
    routeLabelId &&
    routeLabelId !== 'undefined' &&
    routeLabelId !== 'null';
  const editPath = isValidId ? `/l/${routeLabelId}` : '';
  const editUrl = isValidId && origin ? `${origin}${editPath}` : editPath;
  const qrSrc = isValidId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(editUrl)}`
    : '';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#f1f5f9_40%,_#e2e8f0)] p-6 text-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <div className="text-sm text-gray-600">
              Company:{' '}
              <span className="font-medium">
                {companyName ? `${companyName} (${companyDisplayCode})` : companyDisplayCode}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Branch:{' '}
              <span className="font-medium">
                {branchName ? `${branchName} (${branchDisplayCode})` : branchDisplayCode}
              </span>
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

              <div className="px-6 py-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-slate-900">
                      {label.productName || 'Unassigned Product'}
                    </div>
                    {label.productDescription && (
                      <div className="mt-1 text-sm text-slate-600">
                        {label.productDescription}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <div>SKU: {label.productSku || '--'}</div>
                    <div className="text-xs uppercase tracking-[0.4em] text-slate-400">
                      {branchName ? branchName : branchDisplayCode}
                    </div>
                    </div>
                  </div>
                  {qrSrc && (
                    <div className="flex items-center gap-2">
                      <img
                        src={qrSrc}
                        alt="Scan to edit product"
                        className="h-16 w-16 rounded-md border border-slate-200 bg-white"
                      />
                      <div className="text-[11px] text-slate-500 leading-tight">
                        Scan to open
                        <br />
                        product editor
                      </div>
                    </div>
                  )}
                  {editUrl && (
                    <a
                      className="text-xs font-medium text-blue-600 underline"
                      href={editUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open product editor
                    </a>
                  )}
                  {!editUrl && (
                    <div className="text-[11px] text-rose-600">
                      Editor link unavailable for label {String(routeLabelId)}
                    </div>
                  )}
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
