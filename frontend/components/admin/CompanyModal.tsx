'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, MapPin, Tag, ShieldCheck, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Company } from '@/types';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editingCompany?: Company | null;
}

export const CompanyModal = ({ isOpen, onClose, onSave, editingCompany }: CompanyModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    code: '',
    address: '',
    phone: '',
    subscription: 'basic' as 'basic' | 'pro' | 'enterprise',
    status: 'active' as 'active' | 'pending' | 'suspended'
  });

  useEffect(() => {
    if (editingCompany) {
      setFormData({
        name: editingCompany.name || '',
        email: editingCompany.email || '',
        code: editingCompany.code || '',
        address: editingCompany.address || '',
        phone: editingCompany.phone || '',
        subscription: editingCompany.subscription || 'basic',
        status: editingCompany.status || 'active'
      });
    } else {
      setFormData({ name: '', email: '', code: '', address: '', phone: '', subscription: 'basic', status: 'active' });
    }
  }, [editingCompany, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      alert('Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-xl bg-white dark:bg-[#1C2434] rounded-[10px] shadow-2xl overflow-hidden border border-[#E2E8F0] dark:border-slate-700"
          >
            <div className="flex items-center justify-between px-7 py-5 border-b border-[#E2E8F0] dark:border-slate-700">
              <h3 className="text-lg font-bold text-[#111928] dark:text-white">
                {editingCompany ? 'Edit Company Profile' : 'Onboard New Company'}
              </h3>
              <button onClick={onClose} className="p-2 text-[#637381] hover:text-[#111928] dark:hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#111928] dark:text-white">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#637381]" />
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none transition-all"
                    placeholder="Retail Corp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111928] dark:text-white">Internal Code</label>
                  <input 
                    required
                    type="text" 
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full h-12 px-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none transition-all uppercase"
                    placeholder="RC01"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111928] dark:text-white">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#637381]" />
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none transition-all"
                      placeholder="corp@example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#111928] dark:text-white">Physical Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#637381]" />
                  <input 
                    required
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none transition-all"
                    placeholder="123 Retail St, NY"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111928] dark:text-white">Subscription Plan</label>
                  <select 
                    value={formData.subscription}
                    onChange={(e) => setFormData({...formData, subscription: e.target.value as any})}
                    className="w-full h-12 px-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none appearance-none cursor-pointer"
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111928] dark:text-white">Account Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full h-12 px-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none appearance-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 px-8 rounded-lg border border-[#E2E8F0] dark:border-slate-700 text-sm font-bold text-[#111928] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <Button 
                  type="submit"
                  disabled={loading}
                  className="h-11 px-10 rounded-lg bg-[#5750F1] hover:bg-[#4a42e0] text-white font-bold text-sm shadow-md shadow-[#5750F1]/10 transition-all gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingCompany ? 'Save Changes' : 'Onboard Company'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
