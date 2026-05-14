'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { DigitalLabel } from '@/types/vendor';
import { Loader2 } from 'lucide-react';

export default function LabelPreviewPage() {
  const { id } = useParams();
  const [label, setLabel] = useState<DigitalLabel | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'labels', id as string), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const labelData = { id: snap.id, ...data } as DigitalLabel;
        
        // If branch name is missing, try to fetch it
        if (!labelData.branchName && labelData.branchId) {
          try {
            const branchSnap = await getDoc(doc(db, 'branches', labelData.branchId));
            if (branchSnap.exists()) {
              labelData.branchName = branchSnap.data().name;
            }
          } catch (e) {
            console.error('Error fetching branch name:', e);
          }
        }
        
        setLabel(labelData);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  // Build QR URL client-side only
  useEffect(() => {
    if (label) {
      try {
        const editUrl = `${window.location.origin}/label/${label.id}/edit`;
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(editUrl)}`);
      } catch (e) {
        console.error('Error creating QR URL:', e);
      }
    }
  }, [label]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#D1D5DB] flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Establishing Node Connection...</p>
      </div>
    );
  }

  if (!label) {
    return (
      <div className="min-h-screen bg-[#D1D5DB] flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white/50 p-10 rounded-3xl backdrop-blur-md shadow-xl border border-white/20">
          <h1 className="text-4xl font-black text-slate-700 uppercase tracking-tighter">Node 404</h1>
          <p className="mt-4 text-slate-500 font-bold text-sm uppercase tracking-widest max-w-xs mx-auto">
            This hardware identifier is not currently registered in our sync network.
          </p>
        </div>
      </div>
    );
  }

  // Safety checks for rendering
  const originalPrice = Number(label.currentPrice || label.basePrice || 0);
  const finalPrice = Number(label.finalPrice || originalPrice || 0);
  const wholePart = Math.floor(finalPrice);
  const centsPart = finalPrice.toFixed(2).split('.')[1];

  return (
    <div className="min-h-screen bg-[#C8CCD2] flex items-center justify-center p-8 overflow-hidden"
      style={{ 
        background: 'radial-gradient(ellipse at center, #D4D8DE 0%, #A8AEB6 100%)'
      }}
    >
      {/* 3D Physical Device */}
      <div 
        className="relative w-full max-w-[780px]"
        style={{
          perspective: '1200px',
        }}
      >
        <div 
          className="relative bg-[#F5F5F0] rounded-[24px] overflow-hidden"
          style={{
            transform: 'rotateX(2deg) rotateY(-1deg)',
            transformStyle: 'preserve-3d',
            boxShadow: `
              0 2px 4px rgba(0,0,0,0.05),
              0 8px 16px rgba(0,0,0,0.08),
              0 30px 60px rgba(0,0,0,0.12),
              0 50px 80px rgba(0,0,0,0.08),
              inset 0 1px 0 rgba(255,255,255,0.6)
            `,
          }}
        >
          {/* Device Top Bezel */}
          <div className="px-8 pt-5 pb-3 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.15em]">LABELSYNC 4.2</span>
            <div className="h-[10px] w-[10px] rounded-full bg-[#4ADE80]" 
              style={{ boxShadow: '0 0 6px rgba(74,222,128,0.7)' }} 
            />
          </div>

          {/* E-Ink Screen Area */}
          <div className="mx-5 mb-5 bg-white border-[2.5px] border-[#1a1a1a] rounded-[4px] overflow-hidden"
            style={{
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {/* Row 1: Product Name + SKU */}
            <div className="flex items-start justify-between border-b-[2.5px] border-[#1a1a1a] px-7 py-5">
              <h1 className="text-[42px] font-black text-[#1a1a1a] tracking-tight uppercase leading-none">
                {label.productName || 'PRODUCT'}
              </h1>
              <div className="text-right shrink-0 ml-6">
                <span className="text-[13px] font-bold text-[#888] uppercase tracking-wider block">SKU</span>
                <span className="text-[22px] font-black text-[#1a1a1a] tracking-tight leading-none">
                  {label.productSku || 'PR-00000'}
                </span>
              </div>
            </div>

            {/* Row 2: Promo + Pricing */}
            <div className="flex border-b-[2.5px] border-[#1a1a1a]">
              {/* Left: Sale Badge + Unit Price */}
              <div className="w-[38%] border-r-[2.5px] border-[#1a1a1a] flex flex-col">
                {/* Sale Badge */}
                <div className="px-6 py-5 border-b-[2.5px] border-[#1a1a1a] flex items-start">
                  {label.discountPercent ? (
                    <div className="bg-[#CC2B2B] text-white px-5 py-3 inline-block">
                      <span className="text-[13px] font-black uppercase block leading-none">SALE</span>
                      <span className="text-[26px] font-black tracking-tight leading-none block mt-1">
                        -{label.discountPercent}%
                      </span>
                    </div>
                  ) : (
                    <div className="opacity-[0.03] text-[#1a1a1a]">
                      <span className="text-[13px] font-black uppercase block leading-none">PROMO</span>
                      <span className="text-[26px] font-black tracking-tight leading-none block mt-1">0%</span>
                    </div>
                  )}
                </div>

                {/* Unit Price */}
                <div className="px-6 py-5 flex-1 flex flex-col justify-end">
                  <span className="text-[11px] font-bold text-[#888] uppercase tracking-widest leading-none">UNIT PRICE</span>
                  <span className="text-[32px] font-black text-[#1a1a1a] tracking-tight leading-none mt-2">
                    ${originalPrice.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-bold text-[#CC2B2B] uppercase tracking-wider leading-none mt-2">PER EACH</span>
                </div>
              </div>

              {/* Right: Main Price Display */}
              <div className="flex-1 relative flex items-center justify-center px-8 py-8">
                {/* Strikethrough original price */}
                {label.discountPercent && (
                  <span 
                    className="absolute top-5 right-8 text-[28px] font-black text-[#999] tracking-tight"
                    style={{ textDecoration: 'line-through', textDecorationThickness: '2px' }}
                  >
                    ${originalPrice.toFixed(2)}
                  </span>
                )}

                {/* Big Price */}
                <div className="flex items-start">
                  <span className="text-[36px] font-black text-[#1a1a1a] mt-8 mr-1">$</span>
                  <span className="text-[140px] font-black text-[#1a1a1a] leading-[0.75] tracking-tighter">
                    {wholePart}
                  </span>
                  <span className="text-[70px] font-black text-[#1a1a1a] leading-[0.9] tracking-tight mt-1">
                    .{centsPart}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3: Barcode + QR */}
            <div className="flex">
              {/* Barcode */}
              <div className="flex-1 border-r-[2.5px] border-[#1a1a1a] px-7 py-4 flex flex-col items-center justify-center">
                <div className="flex items-end gap-[2px] h-[48px] w-full max-w-[340px] mb-2">
                  {[...Array(50)].map((_, i) => (
                    <div 
                      key={i} 
                      className="bg-[#1a1a1a] w-full" 
                      style={{ 
                        height: `${i % 5 === 0 ? 100 : i % 3 === 0 ? 65 : 85}%`,
                        width: i % 7 === 0 ? '3px' : '2px'
                      }} 
                    />
                  ))}
                </div>
                <span className="text-[13px] font-bold text-[#1a1a1a] tracking-[0.4em] uppercase">
                  {label.labelCode || label.labelId || 'DL-005'}
                </span>
              </div>

              {/* QR Code */}
              <div className="w-[120px] p-4 flex flex-col items-center justify-center">
                {qrUrl && (
                  <img 
                    src={qrUrl}
                    alt="Scan to manage"
                    className="w-[72px] h-[72px] object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subtle reflection underneath */}
        <div 
          className="absolute -bottom-4 left-[10%] right-[10%] h-8 rounded-[50%] opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }}
        />
      </div>

      {/* Corner Branding */}
      <div className="fixed top-6 left-8 flex items-center gap-3 opacity-40">
        <span className="text-sm font-black text-slate-600 uppercase tracking-[0.2em]">
          {label.branchName || 'SMART MARKET'}
        </span>
      </div>
      <div className="fixed top-6 right-8 flex items-center gap-2 opacity-40">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">LIVE</span>
      </div>
    </div>
  );
}
