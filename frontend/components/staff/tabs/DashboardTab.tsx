'use client';

import { motion } from 'framer-motion';
import { 
  Package, 
  Tag, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  TrendingUp, 
  Activity,
  ArrowRight,
  Clock,
  Battery
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BranchProduct, DigitalLabel, IssueReport } from '@/hooks/useStaffDashboard';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface StaffDashboardTabProps {
  branchProducts: BranchProduct[];
  labels: DigitalLabel[];
  issues: IssueReport[];
  onTabChange: (tab: any) => void;
  onRefresh: () => void;
}

export const StaffDashboardTab = ({
  branchProducts,
  labels,
  issues,
  onTabChange,
  onRefresh
}: StaffDashboardTabProps) => {
  const { t } = useLanguage();

  const lowStock = branchProducts.filter(p => p.status === 'low-stock' || p.status === 'out-of-stock');
  const errorLabels = labels.filter(l => l.status === 'error' || l.status === 'low-battery');
  const openIssues = issues.filter(i => i.status === 'open');

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-[#5750F1]" />
              <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.2em]">{t('operational_pulse')}</span>
           </div>
           <h2 className="text-2xl font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('branch_overview')}</h2>
           <p className="text-xs font-medium text-[#637381] dark:text-slate-400">{t('branch_overview_desc')}</p>
        </div>

        <Button 
          onClick={onRefresh}
          variant="outline"
          className="h-12 px-8 rounded-none border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest gap-2 bg-white dark:bg-slate-900"
        >
          <RefreshCw className="h-4 w-4" />
          {t('sync_data')}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('stock_items'), value: branchProducts.length, icon: Package, color: 'indigo' },
          { label: t('active_labels'), value: labels.length, icon: Tag, color: 'emerald' },
          { label: t('low_stock'), value: lowStock.length, icon: TrendingUp, color: 'amber' },
          { label: t('hardware_alerts'), value: errorLabels.length, icon: AlertCircle, color: 'rose' },
        ].map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative bg-white dark:bg-[#1C2434] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform`} />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`h-12 w-12 rounded-none bg-${stat.color}-500/10 flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-[#111928] dark:text-white tracking-tighter mb-1 relative z-10">{stat.value}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Critical Alerts & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hardware Status */}
        <div className="bg-white dark:bg-[#1C2434] border border-slate-100 dark:border-slate-800 flex flex-col h-full">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-rose-500/10 flex items-center justify-center">
                 <AlertCircle className="h-4 w-4 text-rose-500" />
              </div>
              <h3 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('priority_alerts')}</h3>
            </div>
            <button 
              onClick={() => onTabChange('labels')}
              className="text-[10px] font-black text-[#5750F1] uppercase tracking-widest hover:underline flex items-center gap-2"
            >
              {t('fix_hardware')} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 p-6 space-y-4">
            {errorLabels.length > 0 ? errorLabels.slice(0, 4).map(label => (
              <div key={label.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                    <Battery className={`h-4 w-4 ${label.battery < 20 ? 'text-rose-500' : 'text-amber-500'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#111928] dark:text-white uppercase tracking-tight">{label.labelId}</p>
                    <p className="text-[10px] font-medium text-slate-400 tracking-wide">{label.productName || t('unassigned') || 'Unassigned'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{t(label.status.replace('-', '_') as any) || label.status.replace('-', ' ')}</span>
                  <p className="text-[10px] font-medium text-slate-400 mt-1">{label.battery}% Battery</p>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-emerald-100 mb-4" />
                <p className="text-xs font-bold text-slate-400">{t('all_hardware_nominal')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stock Status */}
        <div className="bg-white dark:bg-[#1C2434] border border-slate-100 dark:border-slate-800 flex flex-col h-full">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-amber-500/10 flex items-center justify-center">
                 <Package className="h-4 w-4 text-amber-500" />
              </div>
              <h3 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('replenishment_required')}</h3>
            </div>
            <button 
              onClick={() => onTabChange('inventory')}
              className="text-[10px] font-black text-[#5750F1] uppercase tracking-widest hover:underline flex items-center gap-2"
            >
              {t('update_stock')} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 p-6 space-y-4">
            {lowStock.length > 0 ? lowStock.slice(0, 4).map(bp => (
              <div key={bp.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white dark:bg-slate-800 border border-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#111928] dark:text-white uppercase tracking-tight">{bp.productDetails?.name}</p>
                    <p className="text-[10px] font-medium text-slate-400 tracking-wide">{t('min_level')}: {bp.minStock}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black ${bp.stock === 0 ? 'text-rose-500' : 'text-amber-500'} uppercase tracking-widest`}>
                    {bp.stock} {t('units_left')}
                  </span>
                  <p className="text-[10px] font-medium text-slate-400 mt-1">{t('refill_recommended')}</p>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-emerald-100 mb-4" />
                <p className="text-xs font-bold text-slate-400">{t('inventory_healthy') || 'Inventory levels are healthy'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
