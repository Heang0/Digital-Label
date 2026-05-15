'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, MapPin, Hash, Building2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Branch, DigitalLabel } from '@/types/vendor';

interface ProvisionLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProvision: (data: { labelId: string; location: string; branchId: string }) => Promise<void>;
  branches: Branch[];
  selectedBranchId: string;
  existingLabels: DigitalLabel[];
}

export const ProvisionLabelModal = ({ 
  isOpen, 
  onClose, 
  onProvision, 
  branches,
  selectedBranchId,
  existingLabels
}: ProvisionLabelModalProps) => {
  const getNextAisle = (branchId: string) => {
    const branchLabels = existingLabels.filter(l => l.branchId === branchId);
    let maxAisle = 0;
    branchLabels.forEach(l => {
      const match = l.location?.match(/Aisle\s+(\d+)/i);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxAisle) maxAisle = num;
      }
    });
    return `Aisle ${(maxAisle + 1).toString().padStart(2, '0')}`;
  };

  const getNextLabelId = (branchId: string) => {
    const branchLabels = existingLabels.filter(l => l.branchId === branchId);
    if (branchLabels.length === 0) return 'DL-001';

    let maxNum = 0;
    let prefix = 'DL-';
    
    branchLabels.forEach(l => {
      const match = (l.labelCode || l.labelId || '').match(/([A-Z-]*?)(\d+)/i);
      if (match) {
        prefix = match[1] || 'DL-';
        const num = parseInt(match[2]);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `${prefix}${nextNum}`;
  };

  const [formData, setFormData] = useState({
    labelId: '',
    location: '',
    branchId: selectedBranchId !== 'all' ? selectedBranchId : (branches[0]?.id || '')
  });

  // Initialize data when modal opens or branch changes
  useEffect(() => {
    if (isOpen) {
      const nextId = getNextLabelId(formData.branchId);
      const nextLoc = getNextAisle(formData.branchId);
      setFormData(prev => ({ 
        ...prev, 
        labelId: nextId,
        location: prev.location || nextLoc 
      }));
    }
  }, [isOpen, formData.branchId]);

  const [loading, setLoading] = useState(false);

  const handleLabelIdChange = (id: string) => {
    const upperId = id.toUpperCase();
    let newLocation = formData.location;

    // Auto-aisle suggestion logic: extract numbers and format as "Aisle XX"
    if (!formData.location || formData.location.startsWith('Aisle')) {
      const match = upperId.match(/\d+/);
      if (match) {
        newLocation = `Aisle ${match[0].padStart(2, '0')}`;
      }
    }

    setFormData({ ...formData, labelId: upperId, location: newLocation });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.labelId || !formData.branchId) return;
    
    setLoading(true);
    try {
      await onProvision(formData);
      setFormData({ labelId: '', location: '', branchId: formData.branchId });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
            className="relative w-full max-w-lg bg-white dark:bg-[#1C2434] rounded-none shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-none bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-[#5750F1]">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#111928] dark:text-white uppercase tracking-tight">Hardware Provisioning</h2>
                    <p className="text-[10px] font-bold text-[#637381] uppercase tracking-widest mt-0.5">Register Physical ESL Node</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none text-slate-400 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">Hardware ID (MAC/Serial) <span className="text-rose-500">*</span></label>
                <div className="relative">
                   <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                   <Input 
                      required
                      placeholder="e.g. 0L2KZ-X99" 
                      value={formData.labelId}
                      onChange={(e) => handleLabelIdChange(e.target.value)}
                      className="pl-10 h-11 rounded-none bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 font-mono text-sm uppercase"
                   />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                   <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">Shelf Location / Aisle</label>
                   {formData.labelId.match(/\d+/) && (
                     <span className="text-[8px] font-black text-[#5750F1] uppercase animate-pulse">Auto-Suggest Active</span>
                   )}
                </div>
                <div className="relative">
                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                   <Input 
                      placeholder="e.g. Aisle 4, Shelf B-12" 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="pl-10 h-11 rounded-none bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 font-bold text-sm"
                   />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">Deployment Branch <span className="text-rose-500">*</span></label>
                <div className="relative">
                   <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                   <select 
                      value={formData.branchId}
                      onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                      className="w-full h-11 pl-10 pr-4 rounded-none bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-[#5750F1]/20"
                   >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                   </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white dark:bg-[#1C2434]">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-none h-10 font-bold px-6">Cancel</Button>
                <Button 
                   disabled={loading || !formData.labelId}
                   className="rounded-none h-10 bg-[#5750F1] hover:bg-[#4A44D1] text-white font-bold px-8 shadow-lg shadow-indigo-500/20"
                >
                   {loading ? (
                     <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   ) : (
                     <Save className="h-4 w-4 mr-2" />
                   )}
                   Provision Tag
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
