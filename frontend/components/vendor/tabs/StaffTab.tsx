'use client';

import { motion } from 'framer-motion';
import { Users, Plus, User as UserIcon, Mail, Phone, Edit, Trash2, ShieldCheck, Activity, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StaffMember, Branch } from '@/types/vendor';

interface StaffTabProps {
  staffMembers: StaffMember[];
  branches: Branch[];
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  setShowCreateStaff: (show: boolean) => void;
  setShowEditStaff: (staff: StaffMember | null) => void;
  handleDeleteStaff: (id: string) => void;
  setShowResetPassword: (id: string | null) => void;
}

export const StaffTab = ({
  staffMembers,
  branches,
  selectedBranchId,
  setSelectedBranchId,
  setShowCreateStaff,
  setShowEditStaff,
  handleDeleteStaff,
  setShowResetPassword
}: StaffTabProps) => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Staff Directory</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Manage personnel, roles, and branch permissions.</p>
        </div>
        <Button onClick={() => setShowCreateStaff(true)} className="h-11 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2">
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 p-6 glass rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex-1">
          <label className="text-[10px] font-black text-[#637381] dark:text-slate-500 uppercase tracking-widest mb-2 block">Filter by Location</label>
          <select 
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="w-full h-11 bg-white dark:bg-[#1C2434] border border-slate-100 dark:border-slate-800 rounded-xl px-4 text-xs font-bold text-[#111928] dark:text-white outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all"
          >
            <option value="all">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {staffMembers.map((member) => (
          <motion.div key={member.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="premium-card p-6">
            <div className="flex items-center gap-4 mb-6">
               <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <UserIcon className="h-6 w-6" />
               </div>
               <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#111928] dark:text-white truncate">{member.name}</p>
                  <p className="text-[10px] font-medium text-[#637381] truncate">{member.email}</p>
               </div>
            </div>
            
            <div className="space-y-3">
               <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#637381]">Position</span>
                  <span className="text-[#111928] dark:text-white">{member.position}</span>
               </div>
               <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#637381]">Branch</span>
                  <span className="text-[#111928] dark:text-white">{member.branchName || 'Global Access'}</span>
               </div>
               <div className="flex items-center justify-between text-xs font-bold pt-3 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                     <div className={`h-1.5 w-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                     <span className="text-[#637381] capitalize text-[10px] uppercase tracking-widest">{member.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button variant="ghost" size="sm" onClick={() => setShowResetPassword(member.id)} className="h-8 w-8 p-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => setShowEditStaff(member)} className="h-8 w-8 p-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Edit className="h-3.5 w-3.5 text-slate-400" />
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => handleDeleteStaff(member.id)} className="h-8 w-8 p-0 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                     </Button>
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
        {staffMembers.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 py-20 premium-card text-center">
            <Users className="h-12 w-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
            <p className="text-sm font-bold text-[#111928] dark:text-white">No team members onboarded</p>
            <p className="text-xs text-[#637381] mt-1">Add staff to manage specific branch locations.</p>
          </div>
        )}
      </div>
    </div>
  );
};
