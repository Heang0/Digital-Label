'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Building2, ShieldCheck, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserType } from '@/types';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editingUser?: UserType | null;
}

export const VendorModal = ({ isOpen, onClose, onSave, editingUser }: VendorModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyId: '',
    status: 'active' as 'active' | 'pending' | 'suspended' | 'inactive'
  });

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || '',
        email: editingUser.email || '',
        password: '',
        companyId: editingUser.companyId || '',
        status: editingUser.status || 'active'
      });
    } else {
      setFormData({ name: '', email: '', password: '', companyId: '', status: 'active' });
    }
  }, [editingUser, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      alert('Operation failed. Please check your data.');
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
                {editingUser ? 'Edit Vendor Information' : 'Add New Vendor'}
              </h3>
              <button onClick={onClose} className="p-2 text-[#637381] hover:text-[#111928] dark:hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-7 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111928] dark:text-white">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#637381]" />
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111928] dark:text-white">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#637381]" />
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      disabled={!!editingUser}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-900 text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111928] dark:text-white">Account Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#637381]" />
                    <input 
                      required
                      type="password" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111928] dark:text-white">Company Code</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#637381]" />
                    <input 
                      required
                      type="text" 
                      value={formData.companyId}
                      onChange={(e) => setFormData({...formData, companyId: e.target.value})}
                      className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none transition-all uppercase"
                      placeholder="e.g. CP001"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111928] dark:text-white">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full h-12 px-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none appearance-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
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
                  {editingUser ? 'Save Changes' : 'Create Vendor'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
