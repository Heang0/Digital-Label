'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Tag, 
  Info, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicProductPage() {
  const { labelId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!labelId) return;
      try {
        const labelSnap = await getDoc(doc(db, 'labels', labelId as string));
        if (labelSnap.exists()) {
          const labelData = labelSnap.data();
          if (labelData.productId) {
            const productSnap = await getDoc(doc(db, 'products', labelData.productId));
            const companySnap = await getDoc(doc(db, 'companies', labelData.companyId));
            const branchSnap = await getDoc(doc(db, 'branches', labelData.branchId));
            
            setData({
              label: labelData,
              product: productSnap.exists() ? productSnap.data() : null,
              company: companySnap.exists() ? companySnap.data() : null,
              branch: branchSnap.exists() ? branchSnap.data() : null
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [labelId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Retrieving Verified Data...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <Tag className="h-16 w-16 text-slate-200 mb-6" />
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Product Not Found</h1>
        <p className="mt-2 text-slate-500 text-sm max-w-xs">This identifier is not associated with an active product record.</p>
        <Button onClick={() => window.history.back()} className="mt-8 rounded-full px-8 bg-slate-900">Go Back</Button>
      </div>
    );
  }

  const { product, label, company, branch } = data;
  const originalPrice = Number(label.currentPrice || label.basePrice || 0);
  const finalPrice = Number(label.finalPrice || originalPrice || 0);
  const discount = finalPrice < originalPrice;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-12">
      {/* Dynamic Header */}
      <div className="relative h-[40vh] w-full bg-slate-900 overflow-hidden">
        {product.imageUrl ? (
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            src={product.imageUrl} 
            className="h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
             <ShoppingBag className="h-20 w-20 text-slate-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-transparent to-transparent" />
        
        {/* Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
          <button onClick={() => window.history.back()} className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-white/30 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="h-10 px-4 rounded-full bg-white/20 backdrop-blur-md flex items-center gap-2 text-white border border-white/20">
             <ShieldCheck className="h-4 w-4 text-emerald-400" />
             <span className="text-[10px] font-black uppercase tracking-widest">Verified Listing</span>
          </div>
        </div>

        {/* Company Floating Badge */}
        {company?.logoUrl && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-6 left-6 flex items-center gap-3"
          >
            <div className="h-12 w-12 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-100 overflow-hidden">
               <img src={company.logoUrl} className="h-full w-full object-contain" alt={company.name} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distributed by</p>
               <h3 className="text-sm font-black text-white drop-shadow-md">{company.name}</h3>
            </div>
          </motion.div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-12 relative z-10">
        {/* Product Card */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 border border-white"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                 <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#5750F1] text-[9px] font-black uppercase tracking-widest">
                    {product.category || 'General'}
                 </span>
                 {discount && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                       <Sparkles className="h-3 w-3" />
                       Sale Event
                    </span>
                 )}
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                {product.name}
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">SKU: {product.sku}</p>
            </div>
          </div>

          {/* Pricing Engine */}
          <div className="bg-slate-50 rounded-3xl p-6 mb-8 flex items-center justify-between border border-slate-100">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Price</p>
                <div className="flex items-baseline gap-2">
                   <span className={`text-4xl font-black ${discount ? 'text-rose-600' : 'text-slate-900'} tracking-tighter`}>
                      ${finalPrice.toFixed(2)}
                   </span>
                   {discount && (
                      <span className="text-lg font-bold text-slate-400 line-through tracking-tight">
                         ${originalPrice.toFixed(2)}
                      </span>
                   )}
                </div>
             </div>
             {discount && (
                <div className="bg-rose-600 text-white px-4 py-2 rounded-2xl shadow-lg shadow-rose-500/20 rotate-3">
                   <span className="text-[10px] font-black block uppercase leading-none">Save</span>
                   <span className="text-xl font-black">-{label.discountPercent}%</span>
                </div>
             )}
          </div>

          {/* Product Intel */}
          <div className="space-y-8">
             <div>
                <div className="flex items-center gap-2 mb-4">
                   <Info className="h-4 w-4 text-indigo-600" />
                   <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Product Specifications</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                   {product.description || 'No detailed description available for this item.'}
                </p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                   <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Store Location</span>
                   </div>
                   <p className="text-xs font-bold text-slate-900 uppercase">{branch?.name || 'Main Branch'}</p>
                   <p className="text-[10px] font-bold text-slate-400 mt-0.5">{branch?.address || 'Verified Merchant Location'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                   <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In Stock</span>
                   </div>
                   <p className="text-xs font-bold text-emerald-600 uppercase">Available Now</p>
                   <p className="text-[10px] font-bold text-slate-400 mt-0.5">Real-time Inventory Sync</p>
                </div>
             </div>
          </div>
        </motion.div>

        {/* Action Bar */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex flex-col gap-4"
        >
           <Button className="w-full h-14 rounded-2xl bg-[#5750F1] hover:bg-[#4A44D1] text-white font-black uppercase tracking-[0.1em] shadow-xl shadow-indigo-500/30 gap-3 group">
              Find in Store
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
           </Button>
           
           <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] py-4">
              SmartLabel Cloud Ecosystem
           </p>
        </motion.div>
      </div>

      {/* Staff Entrance (Subtle) */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center">
         <button 
           onClick={() => router.push(`/label-product/${labelId}`)}
           className="px-4 py-2 rounded-full bg-slate-200/50 backdrop-blur-sm text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
         >
            Merchant Administrative Access
         </button>
      </div>
    </div>
  );
}
