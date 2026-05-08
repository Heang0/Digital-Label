'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, ArrowUpRight, Activity } from 'lucide-react';
import SalesHistoryPanel from '@/components/cashier/SalesHistoryPanel';
import { Branch } from '@/types/vendor';

interface SalesTabProps {
  currentUser: any;
  branches: Branch[];
  selectedBranchId: string;
}

export const SalesTab = ({
  currentUser,
  branches,
  selectedBranchId
}: SalesTabProps) => {
  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Sales Intelligence</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Deep-dive into transactional data and revenue performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
            { label: 'Avg Transaction', value: '$42.50', trend: '+5.2%', icon: DollarSign, color: 'text-[#5750F1]' },
            { label: 'Basket Size', value: '3.8 Items', trend: '+1.4%', icon: ShoppingBag, color: 'text-emerald-500' },
            { label: 'Conversion', value: '18.4%', trend: '-0.8%', icon: Activity, color: 'text-amber-500' },
         ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="premium-card p-6">
               <div className="flex items-center justify-between mb-4">
                  <div className={`h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${stat.color}`}>
                     <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                     <ArrowUpRight className="h-3 w-3" />
                     {stat.trend}
                  </div>
               </div>
               <h3 className="text-2xl font-black text-[#111928] dark:text-white">{stat.value}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </motion.div>
         ))}
      </div>

      <div className="premium-card p-6 md:p-10">
         <SalesHistoryPanel 
            companyId={currentUser?.companyId || ''} 
            branches={branches}
            initialBranchId={selectedBranchId === 'all' ? undefined : selectedBranchId}
            canClear={true}
         />
      </div>
    </div>
  );
};
