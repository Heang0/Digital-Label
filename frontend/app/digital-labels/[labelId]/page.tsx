'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserStore } from '@/lib/user-store';
import { Hash, Wifi, Signal, Battery, Cpu } from 'lucide-react';

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
    if (!params?.labelId) return;
    setLoading(true);
    const labelRef = doc(db, 'labels', params.labelId);
    const unsubscribe = onSnapshot(
      labelRef,
      async (snap) => {
        if (!snap.exists()) {
          setLabel(null);
          setLoading(false);
          return;
        }
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
        setLabel({ id: snap.id, ...data } as Label);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsubscribe();
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
  const editPath = isValidId ? `/l/${routeLabelId}?force=1` : '';
  const editUrl = isValidId && origin ? `${origin}${editPath}` : editPath;
  const qrSrc = isValidId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(editUrl)}`
    : '';

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-900 flex items-center justify-center p-6 text-black">
      {loading ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 border-4 border-[#5750F1] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Connecting to Label...</p>
        </div>
      ) : !label ? (
        <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center max-w-sm w-full">
          <Cpu className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Label Offline</h3>
          <p className="text-sm font-medium text-slate-500">This digital label is not registered or cannot be reached.</p>
        </div>
      ) : (
        <div className="w-full max-w-[800px] flex flex-col items-center gap-6">
          {/* Metadata Display */}
          <div className="flex w-full items-center justify-between px-2 opacity-50 dark:opacity-100">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{companyName || companyDisplayCode}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{branchName || branchDisplayCode}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-[#5750F1] uppercase tracking-widest">LIVE VIEW</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{displayId}</span>
            </div>
          </div>

          {/* PHOTOREALISTIC HARDWARE ESL SIMULATION */}
          <div className="relative w-[440px] h-[300px] flex items-center justify-center">
            {/* Soft ambient drop shadow for the physical device */}
            <div className="absolute inset-2 bg-black/30 blur-xl translate-y-6 rounded-[24px]"></div>
            
            {/* The physical plastic casing */}
            <div className="w-[440px] h-[300px] bg-[#F5F5F7] rounded-[24px] p-6 relative overflow-hidden shadow-[inset_0_2px_4px_rgba(255,255,255,1),inset_0_-4px_8px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.1)] ring-1 ring-slate-200">
              
              {/* Plastic texture overlay */}
              <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
              
              {/* Physical branding & LED */}
              <div className="absolute top-2 left-6 text-[8px] font-bold text-slate-400/80 uppercase tracking-widest pointer-events-none">LabelSync 4.2</div>
              <div className="absolute top-2.5 right-6 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8),inset_0_1px_2px_rgba(255,255,255,0.8)] animate-pulse" />
              <div className="absolute top-2 right-9 w-1.5 h-1.5 rounded-full bg-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" /> {/* Sensor hole */}
              
              {/* The deeply recessed E-ink Screen */}
              <div className="w-full h-full bg-[#EAECEE] relative overflow-hidden shadow-[inset_0_4px_8px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(255,255,255,0.7),0_0_0_1px_rgba(0,0,0,0.2)]">
                {/* E-ink paper grain */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%221.5%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

                {label.productId ? (
                  <div className="w-full h-full flex flex-col text-[#1A1A1A]">
                    
                    {/* Top Bar: Name & SKU */}
                    <div className="flex justify-between items-start px-3 py-2 border-b-[3px] border-[#1A1A1A]">
                      <div className="flex-1 pr-4">
                        <h1 className="text-[18px] font-black uppercase leading-[1.1] tracking-tighter line-clamp-2" style={{ fontFamily: 'Arial Black, Impact, sans-serif', WebkitFontSmoothing: 'none' }}>
                          {label.productName}
                        </h1>
                        {label.productDescription && (
                          <p className="text-[10px] font-bold text-[#444] leading-none mt-1 line-clamp-1" style={{ WebkitFontSmoothing: 'none' }}>
                            {label.productDescription}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end text-right shrink-0">
                        <span className="text-[9px] font-bold uppercase tracking-widest">SKU</span>
                        <span className="font-mono text-[12px] font-black tracking-tighter leading-none mt-0.5">{label.productSku || label.productId.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Middle: Unit Price & Main Price */}
                    <div className="flex flex-1 relative">
                      {discountPercent != null && (
                        <div className="absolute top-0 left-0 bg-[#C92A2A] text-white px-2 py-1 flex flex-col items-center justify-center border-r-[3px] border-b-[3px] border-[#1A1A1A] mix-blend-multiply" style={{ WebkitFontSmoothing: 'none' }}>
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-90">SALE</span>
                          <span className="text-[14px] font-black leading-none mt-0.5">-{discountPercent}%</span>
                        </div>
                      )}

                      <div className="w-1/3 border-r-[3px] border-[#1A1A1A] flex flex-col justify-end p-2 pb-3 bg-[#EAECEE]">
                        <span className="text-[9px] font-bold uppercase tracking-widest">UNIT PRICE</span>
                        <span className="text-[16px] font-black leading-none mt-1" style={{ fontFamily: 'Arial Black, sans-serif', WebkitFontSmoothing: 'none' }}>${unitPrice}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest mt-1">PER EACH</span>
                      </div>
                      
                      <div className="w-2/3 flex flex-col items-center justify-center bg-[#EAECEE] relative">
                        {discountPercent != null && basePrice != null && displayPrice != null && displayPrice < basePrice && (
                          <div className="text-[16px] font-black text-[#666] line-through absolute top-2 right-4" style={{ WebkitFontSmoothing: 'none' }}>
                            ${basePrice.toFixed(2)}
                          </div>
                        )}
                        <div className="flex items-start text-[#1A1A1A]" style={{ WebkitFontSmoothing: 'none' }}>
                          <span className="text-xl font-black mt-2.5 mr-1">$</span>
                          <span className="text-[72px] font-black tracking-tighter leading-none" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                            {displayPrice != null ? displayPrice.toFixed(2).split('.')[0] : '--'}
                          </span>
                          <div className="flex flex-col ml-1 mt-2">
                            <span className="text-[28px] font-black leading-none" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                              .{displayPrice != null ? displayPrice.toFixed(2).split('.')[1] : '00'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Bar: Barcode */}
                    <div className="h-[46px] border-t-[3px] border-[#1A1A1A] flex items-center justify-between px-3 bg-[#EAECEE]">
                      <div className="flex flex-col justify-center w-full">
                         {/* Simulated barcode bars spanning full width */}
                         <div className="flex gap-[1px] h-6 opacity-90 mix-blend-multiply w-full overflow-hidden">
                           {[...Array(40)].map((_, i) => (
                             <div key={i} className={`bg-[#1A1A1A] h-full shrink-0 ${i%3===0?'w-[4px]':i%5===0?'w-[1px]':i%7===0?'w-[5px]':'w-[2px]'} ${i%4===0?'mr-[2px]':'mr-0'}`} />
                           ))}
                         </div>
                         <span className="font-mono text-[9px] font-black tracking-widest text-center mt-0.5">{displayId}</span>
                      </div>
                      {qrSrc && (
                        <div className="pl-3 ml-3 border-l-[3px] border-[#1A1A1A] h-full flex items-center justify-center shrink-0">
                          <img src={qrSrc} alt="QR Code" className="h-[34px] w-[34px] mix-blend-multiply opacity-90" style={{ imageRendering: 'pixelated' }} />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-40 mix-blend-multiply">
                    <Cpu className="h-16 w-16 text-[#1A1A1A] mb-3" />
                    <div className="border-[4px] border-[#1A1A1A] px-4 py-1.5">
                      <span className="text-sm font-black text-[#1A1A1A] uppercase tracking-widest" style={{ WebkitFontSmoothing: 'none' }}>AWAITING PAYLOAD</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
