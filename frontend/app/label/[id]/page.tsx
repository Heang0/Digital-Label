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
  const [design, setDesign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (!id) return;
    
    // Listen to label data
    const unsubLabel = onSnapshot(doc(db, 'labels', id as string), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const labelData = { id: snap.id, ...data } as DigitalLabel;
        
        if (!labelData.branchName && labelData.branchId) {
          try {
            const branchSnap = await getDoc(doc(db, 'branches', labelData.branchId));
            if (branchSnap.exists()) {
              labelData.branchName = branchSnap.data().name;
            }
          } catch (e) {}
        }
        setLabel(labelData);
      }
      setLoading(false);
    });

    // Listen to global design config
    const unsubDesign = onSnapshot(doc(db, 'system_config', 'label_design'), (snap) => {
      if (snap.exists()) {
        setDesign(snap.data());
      } else {
        // Fallback default design
        setDesign({
          template: 'standard',
          showBattery: true,
          showQrCode: true,
          showStock: true,
          highContrast: true,
          fontFamily: 'Inter'
        });
      }
    });

    return () => {
      unsubLabel();
      unsubDesign();
    };
  }, [id]);

  // Build QR URL client-side only
  useEffect(() => {
    if (label) {
      try {
        const shortUrl = `${window.location.origin}/l/${label.id}`;
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortUrl)}`);
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
          <div className="mx-5 mb-5 bg-white border-[2.5px] border-[#1a1a1a] rounded-[4px] overflow-hidden relative"
            style={{
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
              fontFamily: design?.fontFamily || 'Inter',
              filter: design?.highContrast ? 'contrast(1.2)' : 'none'
            }}
          >
            {/* Status Bar */}
            <div className="px-6 py-3 flex justify-between items-center border-b-[2.5px] border-[#1a1a1a]">
               <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 bg-black flex items-center justify-center text-white rounded-sm">
                     <span className="text-[8px] font-black italic">S</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter">SmartSync E-Ink</span>
               </div>
               {design?.showBattery && (
                  <div className="flex items-center gap-1 border-[1.5px] border-black px-1 rounded-sm scale-90">
                     <span className="text-[8px] font-black">{label.battery || 100}%</span>
                     <div className="h-1.5 w-3 border-[1px] border-black relative">
                        <div className="h-full bg-black" style={{ width: `${label.battery || 100}%` }} />
                     </div>
                  </div>
               )}
            </div>

            {/* Template Rendering */}
            {(design?.template === 'promo' || (label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice)) ? (
               <>
                 {/* Standard & Promo shared layout structure */}
                 <div className="flex items-start justify-between border-b-[2.5px] border-[#1a1a1a] px-7 py-5">
                    <div className="flex-1">
                       <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Limited Time Offer</p>
                       <h1 className="text-[46px] font-black text-[#1a1a1a] tracking-tighter uppercase leading-[0.9]">
                        {label.productName || 'PRODUCT'}
                       </h1>
                    </div>
                    <div className="bg-rose-600 text-white p-3 rotate-3 shadow-lg border-[2px] border-black">
                       <span className="text-[10px] font-black block leading-none">SAVE</span>
                       <span className="text-2xl font-black">
                         {label.discountPercent || Math.round((1 - (label.finalPrice || 0) / (label.currentPrice || 1)) * 100)}%
                       </span>
                    </div>
                 </div>

                 <div className="flex border-b-[2.5px] border-[#1a1a1a]">
                    <div className="w-[38%] border-r-[2.5px] border-[#1a1a1a] p-6 flex flex-col justify-center bg-slate-50/50">
                       <span className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-1">Was</span>
                       <span className="font-black text-[#1a1a1a] tracking-tight leading-none text-[24px] line-through opacity-40">
                         ${originalPrice.toFixed(2)}
                       </span>
                       <span className="text-[11px] font-bold text-[#888] uppercase tracking-widest mt-3 mb-1">Now Only</span>
                       <span className="text-[36px] font-black text-rose-600 leading-none">${finalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-6">
                       <div className="flex items-start">
                          <span className="text-[36px] font-black text-black mt-8 mr-1">$</span>
                          <span className="text-[140px] font-black text-black leading-[0.75] tracking-tighter">
                            {wholePart}
                          </span>
                          <span className="text-[70px] font-black text-black leading-[0.9] tracking-tight mt-1">
                            .{centsPart}
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-stretch">
                    <div className="flex-1 px-7 py-5 flex flex-col justify-center border-r-[2.5px] border-black">
                       <div className="flex items-end gap-[1.5px] h-[36px] w-full mb-2 opacity-80">
                          {[...Array(60)].map((_, i) => (
                            <div key={i} className="bg-rose-600 flex-1" style={{ height: `${20 + Math.random() * 80}%` }} />
                          ))}
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[12px] font-black tracking-[0.3em] uppercase">{label.labelCode || label.labelId}</span>
                          {design?.showStock && (
                             <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase">In Stock: {label.stock || 0}</span>
                          )}
                       </div>
                    </div>
                    {design?.showQrCode && qrUrl && (
                       <div className="w-[110px] p-4 flex items-center justify-center bg-white">
                          <img src={qrUrl} className="w-[78px] h-[78px] object-contain" alt="QR" />
                       </div>
                    )}
                 </div>
               </>
            ) : design?.template === 'minimal' ? (
               <div className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                  <h1 className="text-4xl font-black text-black leading-tight mb-4 uppercase tracking-tighter">
                    {label.productName || 'PRODUCT'}
                  </h1>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black">$</span>
                    <span className="text-8xl font-black tracking-tighter">{wholePart}.{centsPart}</span>
                  </div>
                  {design?.showQrCode && qrUrl && (
                    <div className="mt-8 p-1 border-[2px] border-black">
                       <img src={qrUrl} className="w-16 h-16" alt="QR" />
                    </div>
                  )}
               </div>
            ) : design?.template === 'inventory' ? (
               <div className="p-0 flex flex-col min-h-[300px]">
                  <div className="bg-black text-white p-4 flex justify-between items-center">
                     <span className="text-[10px] font-black uppercase tracking-widest">Stock Control Log</span>
                     <span className="text-lg font-black">{label.productSku}</span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-center">
                     <h2 className="text-2xl font-black text-black uppercase mb-2">{label.productName}</h2>
                     <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="border-[2px] border-black p-3">
                           <span className="text-[8px] font-black uppercase block text-slate-500">Current Stock</span>
                           <span className="text-3xl font-black">{label.stock || 0}</span>
                        </div>
                        <div className="border-[2px] border-black p-3">
                           <span className="text-[8px] font-black uppercase block text-slate-500">Price Point</span>
                           <span className="text-3xl font-black">${finalPrice}</span>
                        </div>
                     </div>
                  </div>
                  <div className="p-4 border-t-[2px] border-black flex justify-between items-center">
                     {design?.showQrCode && qrUrl && <img src={qrUrl} className="w-12 h-12" alt="QR" />}
                     <div className="text-right">
                        <span className="text-[8px] font-black uppercase block">Last Count</span>
                        <span className="text-[10px] font-bold">{new Date().toLocaleDateString()}</span>
                     </div>
                  </div>
               </div>
            ) : (
               <>
                 {/* Standard layout structure */}
                 <div className="flex items-start justify-between border-b-[2.5px] border-[#1a1a1a] px-7 py-5">
                    <div className="flex-1">
                       <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Premium Retail</p>
                       <h1 className="text-[46px] font-black text-[#1a1a1a] tracking-tighter uppercase leading-[0.9]">
                        {label.productName || 'PRODUCT'}
                       </h1>
                    </div>
                 </div>

                 <div className="flex border-b-[2.5px] border-[#1a1a1a]">
                    <div className="w-[38%] border-r-[2.5px] border-[#1a1a1a] p-6 flex flex-col justify-center">
                       <span className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-1">Unit Price</span>
                       <span className="font-black text-[#1a1a1a] tracking-tight leading-none text-[32px]">
                         ${originalPrice.toFixed(2)}
                       </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50">
                       <div className="flex items-start">
                          <span className="text-[36px] font-black text-black mt-8 mr-1">$</span>
                          <span className="text-[140px] font-black text-black leading-[0.75] tracking-tighter">
                            {wholePart}
                          </span>
                          <span className="text-[70px] font-black text-black leading-[0.9] tracking-tight mt-1">
                            .{centsPart}
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-stretch">
                    <div className="flex-1 px-7 py-5 flex flex-col justify-center border-r-[2.5px] border-black">
                       <div className="flex items-end gap-[1.5px] h-[36px] w-full mb-2 opacity-80">
                          {[...Array(60)].map((_, i) => (
                            <div key={i} className="bg-black flex-1" style={{ height: `${20 + Math.random() * 80}%` }} />
                          ))}
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[12px] font-black tracking-[0.3em] uppercase">{label.labelCode || label.labelId}</span>
                          {design?.showStock && (
                             <span className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase">Stock: {label.stock || 0}</span>
                          )}
                       </div>
                    </div>
                    {design?.showQrCode && qrUrl && (
                       <div className="w-[110px] p-4 flex items-center justify-center bg-white">
                          <img src={qrUrl} className="w-[78px] h-[78px] object-contain" alt="QR" />
                       </div>
                    )}
                 </div>
               </>
            )}
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
