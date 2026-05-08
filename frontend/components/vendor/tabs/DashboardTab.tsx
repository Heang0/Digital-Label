'use client';

import { motion } from 'framer-motion';
import { 
  Zap, 
  Activity, 
  Package, 
  Tag, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Plus, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Company, Branch, DigitalLabel } from '@/types/vendor';
import SalesHistoryPanel from '@/components/cashier/SalesHistoryPanel';

interface DashboardTabProps {
  currentUser: any;
  company: Company | null;
  branches: Branch[];
  labels: DigitalLabel[];
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  setSelectedTab: (tab: any) => void;
  setShowCreateBranch: (show: boolean) => void;
}

export const DashboardTab = ({
  currentUser,
  company,
  branches,
  labels,
  selectedBranchId,
  setSelectedBranchId,
  setSelectedTab,
  setShowCreateBranch
}: DashboardTabProps) => {
  // Stats calculation
  const totalLabels = labels.length;
  const activeLabels = labels.filter(l => l.status === 'active').length;
  const errorLabels = labels.filter(l => l.status === 'error' || l.status === 'low-battery').length;
  
  return (
    <div className="space-y-8 pb-20">
      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
           { label: 'Total Inventory', value: '1,240', sub: 'Managed Items', icon: Package, color: 'bg-[#5750F1]', trend: '+12.5%', isUp: true },
           { label: 'Low Stock Alert', value: '12', sub: 'Action Required', icon: AlertCircle, color: 'bg-rose-500', trend: 'Critical', isUp: false },
           { label: 'Daily Revenue', value: '$4,290', sub: 'Last 24 Hours', icon: TrendingUp, color: 'bg-emerald-500', trend: '+8.2%', isUp: true },
           { label: 'Active Labels', value: `${activeLabels}`, sub: `of ${totalLabels} tags`, icon: Tag, color: 'bg-indigo-500', trend: 'Live', isUp: true },
        ].map((stat, i) => (
           <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="premium-card p-6 group hover:border-[#5750F1]/30 transition-all cursor-default"
           >
              <div className="flex items-start justify-between mb-4">
                 <div className={`h-12 w-12 rounded-2xl ${stat.color} text-white flex items-center justify-center shadow-lg shadow-current/10`}>
                    <stat.icon className="h-6 w-6" />
                 </div>
                  <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${stat.isUp ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                    {stat.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.trend}
                 </div>
              </div>
              <h3 className="text-3xl font-black text-[#111928] dark:text-white tracking-tight">{stat.value}</h3>
              <p className="text-[10px] font-bold text-[#637381] dark:text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
              <p className="text-xs font-medium text-slate-400 mt-3 flex items-center gap-1">
                 {stat.sub}
              </p>
           </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
           {/* Branch Telemetry Control (Sales History) */}
           <div className="premium-card p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                 <div>
                    <h3 className="text-xl font-bold text-[#111928] dark:text-white">Performance Analytics</h3>
                    <p className="text-sm font-medium text-[#637381] mt-1">Real-time sales tracking across retail locations.</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                       <button 
                          onClick={() => setSelectedBranchId('all')}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedBranchId === 'all' ? 'bg-white dark:bg-[#1C2434] text-[#5750F1] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                       >
                          Global
                       </button>
                       <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                       <select 
                          className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 outline-none px-2 cursor-pointer"
                          value={selectedBranchId}
                          onChange={(e) => setSelectedBranchId(e.target.value)}
                       >
                          <option value="all" disabled>Select Branch</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                       </select>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#1C2434] rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                 <SalesHistoryPanel 
                    companyId={currentUser?.companyId || ''} 
                    branches={branches}
                    initialBranchId={selectedBranchId === 'all' ? undefined : selectedBranchId}
                    canClear={true}
                 />
              </div>
           </div>

           {/* Quick Access Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="premium-card p-6 flex flex-col items-center text-center group cursor-pointer hover:border-[#5750F1]/20 transition-all" onClick={() => setSelectedTab('products')}>
                 <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-[#5750F1] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Package className="h-7 w-7" />
                 </div>
                 <h4 className="text-sm font-bold text-[#111928] dark:text-white">Product Repository</h4>
                 <p className="text-xs text-slate-400 mt-1">Manage global inventory</p>
              </div>
              <div className="premium-card p-6 flex flex-col items-center text-center group cursor-pointer hover:border-emerald-500/20 transition-all" onClick={() => setSelectedTab('labels')}>
                 <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Tag className="h-7 w-7" />
                 </div>
                 <h4 className="text-sm font-bold text-[#111928] dark:text-white">Digital Tags</h4>
                 <p className="text-xs text-slate-400 mt-1">Sync electronic price tags</p>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           {/* Operations Panel */}
           <div className="premium-card p-8">
              <h3 className="text-lg font-bold text-[#111928] dark:text-white mb-6">Operations</h3>
              <div className="space-y-3">
                 {[
                    { label: 'Update Prices', icon: DollarSign, color: 'text-emerald-500', tab: 'products' },
                    { label: 'Manage Staff', icon: Users, color: 'text-[#5750F1]', tab: 'staff' },
                    { label: 'Campaign Center', icon: ShoppingBag, color: 'text-amber-500', tab: 'promotions' },
                    { label: 'IoT Diagnostics', icon: Activity, color: 'text-rose-500', tab: 'labels' },
                 ].map((action) => (
                    <button 
                       key={action.label}
                       onClick={() => setSelectedTab(action.tab as any)}
                       className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-50 dark:border-slate-800 hover:border-[#5750F1]/20 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group"
                    >
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                             <action.icon className={`h-5 w-5 ${action.color}`} />
                          </div>
                          <span className="text-sm font-bold text-[#111928] dark:text-white">{action.label}</span>
                       </div>
                       <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#5750F1] group-hover:translate-x-1 transition-all" />
                    </button>
                 ))}
              </div>
           </div>

           {/* Retail Ecosystem Widget */}
           <div className="premium-card p-8 bg-gradient-to-br from-[#1C2434] to-[#24303F] border-none text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Building2 className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                 <h3 className="text-lg font-bold mb-6">Active Branches</h3>
                 <div className="space-y-4">
                    {branches.slice(0, 3).map(branch => (
                       <div key={branch.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                             <span className="text-sm font-bold text-slate-100">{branch.name}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 bg-white/5 rounded-md border border-white/10">Active</span>
                       </div>
                    ))}
                    {branches.length > 3 && (
                       <button className="text-xs font-bold text-[#5750F1] hover:text-white transition-colors pt-2">
                          +{branches.length - 3} more locations
                       </button>
                    )}
                 </div>
                 <Button 
                    onClick={() => setShowCreateBranch(true)} 
                    className="w-full mt-8 bg-[#5750F1] hover:bg-[#4A44D1] text-xs font-bold rounded-xl h-11"
                 >
                    <Plus className="h-4 w-4 mr-2" />
                    New Branch
                 </Button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
