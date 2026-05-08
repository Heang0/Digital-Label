'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, User as UserIcon, Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Branch, StaffMember, StaffPermissions } from '@/types';

interface StaffManagementModalProps {
  showCreateStaff: boolean;
  showEditStaff: StaffMember | null;
  setShowCreateStaff: (show: boolean) => void;
  setShowEditStaff: (staff: StaffMember | null) => void;
  staffForm: any;
  setStaffForm: (form: any) => void;
  editStaffForm: any;
  setEditStaffForm: (form: any) => void;
  createStaff: (e: React.FormEvent) => void;
  updateStaff: (e: React.FormEvent) => void;
  branches: Branch[];
}

export const StaffManagementModal = ({
  showCreateStaff,
  showEditStaff,
  setShowCreateStaff,
  setShowEditStaff,
  staffForm,
  setStaffForm,
  editStaffForm,
  setEditStaffForm,
  createStaff,
  updateStaff,
  branches
}: StaffManagementModalProps) => {
  const isOpen = showCreateStaff || showEditStaff;

  const handleClose = () => {
    setShowCreateStaff(false);
    setShowEditStaff(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#1C2434] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-[#111928] dark:text-white">
                  {showCreateStaff ? 'Add New Team Member' : 'Edit Staff Member'}
                </h3>
                <p className="text-[10px] md:text-xs font-medium text-[#637381] mt-1">Configure account details and branch permissions.</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClose}
                className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={showCreateStaff ? createStaff : updateStaff} className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Full Name</label>
                  <Input 
                    required
                    placeholder="e.g. John Doe"
                    value={showCreateStaff ? staffForm.name : editStaffForm.name}
                    onChange={(e) => showCreateStaff 
                      ? setStaffForm({...staffForm, name: e.target.value})
                      : setEditStaffForm({...editStaffForm, name: e.target.value})
                    }
                    className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Email Address</label>
                  <Input 
                    required
                    type="email"
                    placeholder="john@example.com"
                    value={showCreateStaff ? staffForm.email : editStaffForm.email}
                    onChange={(e) => showCreateStaff 
                      ? setStaffForm({...staffForm, email: e.target.value})
                      : setEditStaffForm({...editStaffForm, email: e.target.value})
                    }
                    className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800"
                  />
                </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">Position</label>
                   <select
                     className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all text-[#111928] dark:text-white"
                     value={showCreateStaff ? staffForm.position : editStaffForm.position}
                     onChange={(e) => showCreateStaff 
                       ? setStaffForm({...staffForm, position: e.target.value})
                       : setEditStaffForm({...editStaffForm, position: e.target.value})
                     }
                   >
                     <option value="Manager">Manager</option>
                     <option value="Cashier">Cashier</option>
                     <option value="Inventory Specialist">Inventory Specialist</option>
                     <option value="IT Support">IT Support</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">Assigned Branch</label>
                   <select
                     required
                     className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all text-[#111928] dark:text-white"
                     value={showCreateStaff ? staffForm.branchId : editStaffForm.branchId}
                     onChange={(e) => showCreateStaff 
                       ? setStaffForm({...staffForm, branchId: e.target.value})
                       : setEditStaffForm({...editStaffForm, branchId: e.target.value})
                     }
                   >
                     <option value="">Select a branch...</option>
                     {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                   </select>
                 </div>
                {showCreateStaff && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Initial Password</label>
                    <Input 
                      required
                      type="password"
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({...staffForm, password: e.target.value})}
                      className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800"
                    />
                  </div>
                )}
                {!showCreateStaff && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Status</label>
                    <select
                      className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#1C2434] text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all"
                      value={editStaffForm.status}
                      onChange={(e) => setEditStaffForm({...editStaffForm, status: e.target.value as any})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#111928] dark:text-white pb-2 border-b border-slate-50 dark:border-slate-800">Permissions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'canViewProducts', label: 'View Inventory' },
                    { id: 'canUpdateStock', label: 'Update Stock' },
                    { id: 'canChangePrices', label: 'Adjust Pricing' },
                    { id: 'canCreateLabels', label: 'Generate Labels' },
                    { id: 'canReportIssues', label: 'Report Issues' },
                    { id: 'canViewReports', label: 'Access Reports' },
                  ].map((perm) => (
                    <label key={perm.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox"
                          className="peer h-5 w-5 appearance-none rounded-md border border-[#E2E8F0] dark:border-slate-800 checked:bg-[#5750F1] checked:border-[#5750F1] transition-all"
                          checked={(showCreateStaff ? staffForm.permissions : editStaffForm.permissions)[perm.id as keyof StaffPermissions] as boolean}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (showCreateStaff) {
                              setStaffForm({
                                ...staffForm,
                                permissions: { ...staffForm.permissions, [perm.id]: checked }
                              });
                            } else {
                              setEditStaffForm({
                                ...editStaffForm,
                                permissions: { ...editStaffForm.permissions, [perm.id]: checked }
                              });
                            }
                          }}
                        />
                        <Check className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 transition-opacity" />
                      </div>
                      <span className="text-sm font-medium text-[#637381] group-hover:text-[#111928] dark:group-hover:text-white transition-colors">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-10">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleClose}
                  className="h-11 px-6 font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="h-11 px-8 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] font-bold shadow-lg shadow-[#5750F1]/20"
                >
                  {showCreateStaff ? 'Add Staff Member' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
