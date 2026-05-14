'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  X, 
  Plus, 
  Store,
  Navigation,
  Check,
  RefreshCw,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BranchManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  editingBranch?: any;
}

export const BranchManagementModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingBranch
}: BranchManagementModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingBranch) {
      setFormData({
        name: editingBranch.name || '',
        location: editingBranch.location || '',
        address: editingBranch.address || '',
        phone: editingBranch.phone || ''
      });
    } else {
      setFormData({ name: '', location: '', address: '', phone: '' });
    }
  }, [editingBranch, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({ name: '', location: '', address: '', phone: '' });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#1C2434] rounded-none shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#5750F1] flex items-center justify-center rounded-none shadow-lg shadow-[#5750F1]/20">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#111928] dark:text-white uppercase tracking-tight">
                    {editingBranch ? 'Modify Branch Data' : 'New Branch Entry'}
                  </h3>
                  <p className="text-[10px] font-black text-[#5750F1] uppercase tracking-widest">
                    {editingBranch ? 'Store Configuration Update' : 'Retail Expansion Protocol'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Name</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Lucky TTP"
                      className="pl-10 h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Area</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input 
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. Phnom Penh"
                      className="pl-10 h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Physical Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Full street address..."
                    className="pl-10 h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. +855 12 345 678"
                    className="pl-10 h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <Button 
                  type="button" 
                  onClick={onClose}
                  variant="ghost" 
                  className="flex-1 h-12 rounded-none text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] h-12 bg-[#5750F1] hover:bg-[#4A44D1] text-white rounded-none border-none text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#5750F1]/20 gap-2"
                >
                  {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : (editingBranch ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
                  {editingBranch ? 'Save Branch Changes' : 'Finalize Branch Creation'}
                </Button>
              </div>
            </form>

            {/* Terminal Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[8px] font-black text-emerald-500/80 uppercase tracking-[0.2em]">Ready for provision</span>
              </div>
              <span className="text-[8px] font-mono text-slate-600 uppercase">System v2.4.0</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
