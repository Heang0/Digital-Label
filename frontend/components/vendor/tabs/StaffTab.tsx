'use client';

import { motion } from 'framer-motion';
import { Users, Plus, User as UserIcon, Crown, Package, Zap, ShoppingCart, Edit, Trash2, Lock, Shield, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StaffMember, Branch } from '@/types/vendor';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ROLE_PRESETS, StaffPosition } from '@/lib/role-presets';

const ROLE_ICONS: Record<string, any> = {
  'Manager': Crown,
  'Cashier': ShoppingCart,
  'Inventory Manager': Layers,
  'Stock Controller': Package,
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  'Manager': 'bg-indigo-500/10 text-indigo-600 border-indigo-100 dark:border-indigo-800/30',
  'Cashier': 'bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-800/30',
  'Inventory Manager': 'bg-purple-500/10 text-purple-600 border-purple-100 dark:border-purple-800/30',
  'Stock Controller': 'bg-amber-500/10 text-amber-600 border-amber-100 dark:border-amber-800/30',
};

const ROLE_ICON_BG: Record<string, string> = {
  'Manager': 'bg-indigo-500',
  'Cashier': 'bg-emerald-500',
  'Inventory Manager': 'bg-purple-500',
  'Stock Controller': 'bg-amber-500',
};

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
  const { t } = useLanguage();
  const filteredStaff = staffMembers.filter(member => 
    selectedBranchId === 'all' || member.branchId === selectedBranchId
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-[#5750F1]" />
            <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.2em]">{t('personnel_control')}</span>
          </div>
          <h2 className="text-2xl font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('staff_directory')}</h2>
          <p className="text-xs font-medium text-[#637381] dark:text-slate-400 mt-1">{t('staff_directory_desc')}</p>
        </div>
        <Button onClick={() => setShowCreateStaff(true)} className="h-11 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2 shadow-lg shadow-[#5750F1]/20">
          <Plus className="h-4 w-4" />
          {t('add_member')}
        </Button>
      </div>

      {branches.length > 1 && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-200 dark:border-slate-800">
          <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-widest mb-2 block">{t('filter_by_location')}</label>
          <select 
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="w-full md:w-64 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 text-xs font-black text-[#111928] dark:text-white outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all"
          >
            <option value="all">{t('all_branches')}</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStaff.map((member) => {
          const RoleIcon = ROLE_ICONS[member.position] || UserIcon;
          const badgeColor = ROLE_BADGE_COLORS[member.position] || 'bg-slate-100 text-slate-600 border-slate-200';
          const iconBg = ROLE_ICON_BG[member.position] || 'bg-slate-500';

          return (
            <motion.div 
              key={member.id} 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-white dark:bg-[#1C2434] border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all group"
            >
              <div className="p-6">
                {/* Avatar + Info */}
                <div className="flex items-center gap-4 mb-5">
                  <div className={`h-12 w-12 ${iconBg} flex items-center justify-center shrink-0`}>
                    <RoleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-[#111928] dark:text-white truncate uppercase tracking-tight">{member.name}</p>
                    <p className="text-[10px] font-medium text-[#637381] truncate">{member.email}</p>
                  </div>
                </div>

                {/* Role Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 border text-[9px] font-black uppercase tracking-widest mb-5 ${badgeColor}`}>
                  <RoleIcon className="h-3 w-3" />
                  {t(ROLE_PRESETS[member.position as StaffPosition]?.label || member.position)}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#637381]">{t('branch')}</span>
                    <span className="text-[#111928] dark:text-white">{member.branchName || t('global_access')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#637381]">{t('permissions')}</span>
                    <span className="text-[10px] text-[#5750F1] font-black uppercase tracking-widest">
                      {t('active_count').replace('{count}', Object.values(member.permissions || {}).filter(v => v === true).length.toString())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-[9px] font-black text-[#637381] uppercase tracking-widest">{t(member.status) || member.status}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setShowResetPassword(member.id)} className="h-8 w-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-[#5750F1] transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <Lock className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setShowEditStaff(member)} className="h-8 w-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-[#5750F1] transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDeleteStaff(member.id)} className="h-8 w-8 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-800">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
         {filteredStaff.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 py-20 bg-white dark:bg-[#1C2434] border-2 border-dashed border-slate-100 dark:border-slate-800 text-center">
            <Users className="h-12 w-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
            <p className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('no_staff_onboarded')}</p>
            <p className="text-xs text-[#637381] mt-1">{t('no_staff_desc')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
