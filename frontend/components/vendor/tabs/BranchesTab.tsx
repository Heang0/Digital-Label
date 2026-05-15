'use client';

import { motion } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Navigation, 
  Plus, 
  ArrowRight,
  Shield,
  Activity,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Branch } from '@/types/vendor';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface BranchesTabProps {
  branches: Branch[];
  onCreateBranch: () => void;
  onEditBranch: (branch: Branch) => void;
  onDeleteBranch: (id: string) => void;
  setSelectedTab: (tab: string) => void;
  setSelectedBranchId: (id: string) => void;
}

export const BranchesTab = ({
  branches,
  onCreateBranch,
  onEditBranch,
  onDeleteBranch,
  setSelectedTab,
  setSelectedBranchId
}: BranchesTabProps) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-[#5750F1]" />
              <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.2em]">{t('retail_infrastructure')}</span>
           </div>
           <h2 className="text-2xl font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('branch_network')}</h2>
           <p className="text-xs font-medium text-[#637381] dark:text-slate-400">{t('branch_network_desc').replace('{count}', branches.length.toString())}</p>
        </div>

        <Button 
          onClick={onCreateBranch}
          className="bg-[#5750F1] hover:bg-[#4A44D1] text-white rounded-none h-12 px-8 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#5750F1]/20 gap-2 border-none"
        >
          <Plus className="h-4 w-4" />
          {t('add_new_store')}
        </Button>
      </div>

      {/* Branch Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <motion.div 
            key={branch.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white dark:bg-[#1C2434] border border-slate-100 dark:border-slate-800 rounded-none overflow-hidden shadow-sm hover:shadow-xl transition-all"
          >
            {/* Branch Header */}
            <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center rounded-none shadow-sm group-hover:scale-110 transition-transform">
                  <Navigation className="h-6 w-6 text-[#5750F1]" />
                </div>
                <div className="flex items-center gap-1.5">
                   <button 
                     onClick={() => onEditBranch(branch)}
                     className="h-7 w-7 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-[#5750F1] transition-all"
                     title="Edit Branch"
                   >
                     <Edit className="h-3 w-3" />
                   </button>
                   <button 
                     onClick={() => onDeleteBranch(branch.id)}
                     className="h-7 w-7 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-rose-500 transition-all"
                     title="Remove Branch"
                   >
                     <Trash2 className="h-3 w-3" />
                   </button>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-black text-[#111928] dark:text-white uppercase tracking-tight">{branch.name}</h3>
              <p className="text-[10px] font-black text-[#5750F1] uppercase tracking-widest">{branch.location}</p>
            </div>

            {/* Branch Details */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">{branch.address || t('address_not_registered')}</p>
              </div>
              {branch.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{branch.phone}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button 
                onClick={() => {
                  setSelectedBranchId(branch.id);
                  setSelectedTab('labels');
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[#5750F1] hover:text-[#5750F1] transition-all"
              >
                 <Activity className="h-3 w-3" />
                 {t('view_labels')}
              </button>
              <button 
                onClick={() => {
                  setSelectedBranchId(branch.id);
                  setSelectedTab('staff');
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[#5750F1] hover:text-[#5750F1] transition-all"
              >
                 <ArrowRight className="h-3 w-3" />
                 {t('manage_staff')}
              </button>
            </div>
          </motion.div>
        ))}

        {/* Empty State / Add Card */}
        <motion.div 
          onClick={onCreateBranch}
          className="group border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-none flex flex-col items-center justify-center p-12 hover:border-[#5750F1]/30 hover:bg-[#5750F1]/5 transition-all cursor-pointer"
        >
          <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900 rounded-none flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="h-8 w-8 text-slate-300 group-hover:text-[#5750F1]" />
          </div>
          <h4 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('expand_network')}</h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('register_new_location')}</p>
        </motion.div>
      </div>
    </div>
  );
};
