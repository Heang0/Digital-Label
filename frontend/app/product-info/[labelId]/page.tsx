'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Tag, 
  Info, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/user-store';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const BilingualLabel = ({
  en,
  km,
  className = '',
}: {
  en: string;
  km: string;
  className?: string;
}) => (
  <span className={`inline-flex flex-col leading-tight ${className}`}>
    <span>{en}</span>
    <span className="mt-0.5 font-semibold normal-case tracking-normal">{km}</span>
  </span>
);

export default function PublicProductPage() {
  const { labelId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useUserStore();
  const { t } = useLanguage();

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
          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <BilingualLabel en="Retrieving Verified Data..." km="កំពុងទាញយកទិន្នន័យដែលបានផ្ទៀងផ្ទាត់..." />
          </p>
        </div>
      </div>
    );
  }

  if (!data || !data.product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <Tag className="h-16 w-16 text-slate-200 mb-6" />
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
          <BilingualLabel en="Product Not Found" km="រកមិនឃើញផលិតផល" />
        </h1>
        <p className="mt-2 text-slate-500 text-sm max-w-xs">This identifier is not associated with an active product record.</p>
        <Button onClick={() => window.history.back()} className="mt-8 rounded-none px-8 bg-slate-900 text-white">
          <BilingualLabel en="Go Back" km="ត្រឡប់ក្រោយ" />
        </Button>
      </div>
    );
  }

  const { product, label, company, branch } = data;
  const originalPrice = Number(label.currentPrice || label.basePrice || 0);
  const finalPrice = Number(label.finalPrice || originalPrice || 0);
  const discount = finalPrice < originalPrice;
  const merchantName = company?.name || 'Kitzu-Tech';
  const logoUrl = company?.logoUrl;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-none border border-slate-200 bg-white">
              {logoUrl ? (
                <img src={logoUrl} className="h-full w-full object-contain p-1.5" alt={merchantName} />
              ) : (
                <ShoppingBag className="h-5 w-5 text-[#5750F1]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                <BilingualLabel en="Digital Label" km="ស្លាកឌីជីថល" />
              </p>
              <p className="truncate text-sm font-black uppercase text-slate-950">{merchantName}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="flex h-10 w-10 items-center justify-center rounded-none border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 sm:flex">
            <ShieldCheck className="h-4 w-4" />
              <BilingualLabel
                en="Verified Listing"
                km="បានផ្ទៀងផ្ទាត់"
                className="text-[10px] font-black uppercase tracking-widest"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.7fr)] lg:py-10">
        <motion.section
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="overflow-hidden border border-slate-200 bg-white shadow-sm"
        >
          <div className="relative aspect-[4/3] bg-slate-100 sm:aspect-[16/11] lg:aspect-[4/3]">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-contain p-6 sm:p-8"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100">
                <ShoppingBag className="h-20 w-20 text-slate-300" />
              </div>
            )}
            {discount && (
              <div className="absolute left-4 top-4 flex items-center gap-2 bg-rose-600 px-3 py-2 text-white shadow-lg shadow-rose-500/20">
                <Sparkles className="h-4 w-4" />
                <BilingualLabel en="Sale Event" km="ប្រូម៉ូសិន" className="text-[10px] font-black uppercase tracking-widest" />
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#5750F1]">
                {product.category || 'General'}
              </span>
              <span className="border border-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                SKU: {product.sku || 'N/A'}
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase leading-tight tracking-tight text-slate-950 sm:text-3xl">
              {product.name}
            </h1>
          </div>

          <div className="border-b border-slate-100 p-5 sm:p-6">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <BilingualLabel en="Current Price" km="តម្លៃបច្ចុប្បន្ន" />
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <span className={`text-4xl font-black leading-none tracking-tight sm:text-5xl ${discount ? 'text-rose-600' : 'text-slate-950'}`}>
                ${finalPrice.toFixed(2)}
              </span>
              {discount && (
                <>
                  <span className="text-lg font-bold text-slate-400 line-through">${originalPrice.toFixed(2)}</span>
                  <span className="bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600">
                    <BilingualLabel en={`Save ${label.discountPercent || Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}%`} km={`សន្សំ ${label.discountPercent || Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}%`} />
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-[#5750F1]" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">
                  <BilingualLabel en="Product Details" km="ព័ត៌មានផលិតផល" />
                </h2>
              </div>
              <p className="text-sm font-medium leading-7 text-slate-600">
                {product.description || 'No detailed description available for this item.'}
              </p>
            </div>

            <div id="store-location" className="grid gap-3 sm:grid-cols-2">
              <div className="border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <BilingualLabel en="Store Location" km="ទីតាំងហាង" className="text-[10px] font-black uppercase tracking-widest text-slate-400" />
                </div>
                <p className="text-sm font-black uppercase text-slate-950">{branch?.name || 'Main Branch'}</p>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{branch?.address || 'Verified merchant location'}</p>
              </div>
              <div className="border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <BilingualLabel en="Availability" km="ស្ថានភាពស្តុក" className="text-[10px] font-black uppercase tracking-widest text-emerald-700" />
                </div>
                <p className="text-sm font-black uppercase text-emerald-700">
                  <BilingualLabel en="Available Now" km="មានឥឡូវនេះ" />
                </p>
                <p className="mt-1 text-xs font-medium leading-5 text-emerald-700/70">Synced from the store label system. / ធ្វើសមកាលកម្មពីប្រព័ន្ធស្លាកហាង។</p>
              </div>
            </div>

            {company && (
              <div className="flex items-center gap-3 border border-slate-200 p-4">
                {company.logoUrl && (
                  <div className="h-12 w-12 shrink-0 border border-slate-200 bg-white p-1.5">
                    <img src={company.logoUrl} className="h-full w-full object-contain" alt={company.name} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <BilingualLabel en="Distributed by" km="ចែកចាយដោយ" />
                  </p>
                  <p className="truncate text-sm font-black uppercase text-slate-900">{company.name}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-3 border-t border-slate-100 p-5 sm:p-6">
            <Button
              onClick={() => document.getElementById('store-location')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="h-12 w-full rounded-none border-none bg-[#5750F1] text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-indigo-500/20 hover:bg-[#4A44D1] sm:h-14"
            >
              <BilingualLabel en="Find in Store" km="ស្វែងរកក្នុងហាង" />
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            {/* Merchant Access - Only visible/accessible to staff/vendors */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {currentUser && (currentUser.role === 'vendor' || currentUser.role === 'staff' || currentUser.role === 'admin') ? (
                <button
                  onClick={() => router.push(`/label-product/${labelId}`)}
                  className="h-12 w-full rounded-none border border-indigo-100 bg-indigo-50/50 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#5750F1] transition-all hover:bg-indigo-100 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <BilingualLabel en="Merchant Administrative Access" km="ចូលគ្រប់គ្រងពាណិជ្ជករ" />
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/login?next=${encodeURIComponent(`/label-product/${labelId}`)}`)}
                  className="h-10 w-full rounded-none border border-slate-100 bg-white px-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 flex items-center justify-center gap-2"
                >
                  <Lock className="h-3 w-3" />
                  <BilingualLabel en="Staff / Vendor Login" km="បុគ្គលិក / អាជីវករ ចូលប្រើប្រាស់" />
                </button>
              )}
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="px-4 pb-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
        <BilingualLabel en="SmartLabel Cloud Ecosystem" km="ប្រព័ន្ធស្លាកឌីជីថលឆ្លាតវៃ" />
      </footer>
    </div>
  );
}
