'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { DigitalLabel } from '@/types/vendor';
import { Loader2, Save, ArrowLeft, Package, DollarSign, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

export default function LabelEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [label, setLabel] = useState<DigitalLabel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    productName: '',
    productSku: '',
    currentPrice: 0,
    discountPercent: 0,
    location: ''
  });

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'labels', id as string), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as DigitalLabel;
        setLabel({ id: snap.id, ...data });
        setFormData({
          productName: data.productName || '',
          productSku: data.productSku || '',
          currentPrice: data.currentPrice || 0,
          discountPercent: data.discountPercent || 0,
          location: data.location || ''
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    if (!id || !label) return;
    setSaving(true);
    try {
      const finalPrice = formData.discountPercent 
        ? Math.round(formData.currentPrice * (1 - formData.discountPercent / 100) * 100) / 100
        : formData.currentPrice;

      await updateDoc(doc(db, 'labels', id as string), {
        ...formData,
        finalPrice,
        updatedAt: new Date()
      });
      
      setShowSuccess(true);
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-[#5750F1] animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Opening Management Interface...</p>
      </div>
    );
  }

  if (!label) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-black text-slate-800 uppercase">Hardware Not Found</h1>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#111928] pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-[#1C2434] border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">Manage Node</h1>
            <p className="text-[10px] font-bold text-[#5750F1] uppercase tracking-widest">{label.labelId}</p>
          </div>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Product Identity Section */}
        <div className="bg-white dark:bg-[#1C2434] p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-4">
            <Package className="h-4 w-4 text-[#5750F1]" />
            <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Product Identity</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
              <Input 
                value={formData.productName}
                onChange={(e) => setFormData({...formData, productName: e.target.value})}
                className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold"
                placeholder="Enter product name..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global SKU</label>
                <Input 
                  value={formData.productSku}
                  onChange={(e) => setFormData({...formData, productSku: e.target.value})}
                  className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold"
                  placeholder="SKU-000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shelf Location</label>
                <Input 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold"
                  placeholder="Aisle 1 / A"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-white dark:bg-[#1C2434] p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 pb-4">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Commercial Settings</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Price ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input 
                  type="number"
                  value={formData.currentPrice}
                  onChange={(e) => setFormData({...formData, currentPrice: parseFloat(e.target.value) || 0})}
                  className="h-12 pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount (%)</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input 
                  type="number"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({...formData, discountPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))})}
                  className="h-12 pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-l-4 border-[#5750F1]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Calculated Shelf Price</p>
            <p className="text-2xl font-black text-[#111928] dark:text-white">
              ${(formData.discountPercent 
                ? formData.currentPrice * (1 - formData.discountPercent / 100)
                : formData.currentPrice).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 bg-[#5750F1] hover:bg-[#4A44D1] text-white rounded-none shadow-xl shadow-indigo-500/20 font-black uppercase tracking-[0.2em] transition-all active:scale-95"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
          Push To Hardware
        </Button>

        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Changes will synchronize with the physical tag in ~1.5s
        </p>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-[#1C2434] p-8 rounded-none border border-slate-100 dark:border-slate-800 shadow-2xl max-w-sm w-full text-center"
            >
              <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 mx-auto mb-6 flex items-center justify-center rounded-none border-2 border-emerald-500/20">
                <Save className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-black text-[#111928] dark:text-white uppercase tracking-tight mb-2">Update Successfully!</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">
                Your label has been updated.
              </p>
              <Button 
                onClick={() => router.push(`/label/${id}`)}
                className="w-full h-14 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-none border-none text-[10px] font-black uppercase tracking-widest"
              >
                Acknowledge & View
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
