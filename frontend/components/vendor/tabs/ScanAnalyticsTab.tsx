'use client';

import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  Calendar,
  MousePointer2,
  Scan,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layout
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ScanAnalyticsTabProps {
  currentUser: any;
  branches: any[];
  selectedBranchId: string;
}

export const ScanAnalyticsTab = ({
  currentUser,
  branches,
  selectedBranchId
}: ScanAnalyticsTabProps) => {
  const { t } = useLanguage();

  const stats = [
    { label: 'Total Scans', value: '12,842', change: '+14.2%', trending: 'up', icon: Scan, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Unique Visitors', value: '3,105', change: '+5.8%', trending: 'up', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Conversion Rate', value: '8.4%', change: '-2.1%', trending: 'down', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Peak Scan Time', value: '18:42', change: 'Stable', trending: 'neutral', icon: Clock, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
         <div className="flex items-center gap-2 mb-1.5">
            <BarChart3 className="h-4 w-4 text-[#5750F1]" />
            <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.2em]">{t('behavioral_insights')}</span>
         </div>
        <h2 className="text-2xl font-black text-[#111928] dark:text-white tracking-tight uppercase">{t('scan_analytics')}</h2>
        <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">{t('scan_analytics_desc')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-[#1C2434] p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-16 h-16 ${stat.bg} rounded-bl-full flex items-center justify-center`}>
               <stat.icon className={`h-6 w-6 ${stat.color} opacity-40`} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-[#111928] dark:text-white tracking-tighter">{stat.value}</h3>
            <div className="mt-4 flex items-center gap-1.5">
               {stat.trending === 'up' ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : stat.trending === 'down' ? <ArrowDownRight className="h-3 w-3 text-rose-500" /> : <div className="h-0.5 w-3 bg-slate-300" />}
               <span className={`text-[10px] font-black uppercase tracking-widest ${stat.trending === 'up' ? 'text-emerald-500' : stat.trending === 'down' ? 'text-rose-500' : 'text-slate-400'}`}>
                  {stat.change}
               </span>
               <span className="text-[10px] font-bold text-slate-400 ml-auto">vs last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <h4 className="text-xs font-black text-[#111928] dark:text-white uppercase tracking-[0.2em]">{t('scan_volume_trend')}</h4>
               <div className="flex gap-1 sm:gap-2">
                  {['24h', '7d', '30d', 'ALL'].map(t => (
                     <button key={t} className={`flex-1 sm:flex-none px-3 py-1.5 text-[9px] font-black uppercase tracking-tighter border ${t === '7d' ? 'bg-[#5750F1] text-white border-[#5750F1]' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}>
                        {t}
                     </button>
                  ))}
               </div>
            </div>
            <div className="p-4 sm:p-8 h-[250px] sm:h-[350px] flex items-end justify-between gap-1 sm:gap-2">
               {[40, 65, 45, 90, 55, 75, 85, 30, 45, 60, 50, 70].map((h, i) => (
                  <div key={i} className="flex-1 group relative">
                     <div 
                        className="bg-indigo-500/10 dark:bg-indigo-500/5 group-hover:bg-[#5750F1] transition-all duration-500 w-full rounded-t-sm" 
                        style={{ height: `${h}%` }} 
                     />
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
               <h4 className="text-xs font-black text-[#111928] dark:text-white uppercase tracking-[0.2em]">{t('scans_by_location')}</h4>
            </div>
            <div className="p-6 space-y-6">
               {branches.filter(b => currentUser?.role === 'vendor' ? true : b.id === currentUser?.branchId).slice(0, 5).map((b, i) => (
                  <div key={b.id} className="space-y-2">
                     <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-500">{b.name}</span>
                        <span className="text-[#111928] dark:text-white">{85 - (i * 12)}%</span>
                     </div>
                     <div className="h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-[#5750F1]" style={{ width: `${85 - (i * 12)}%` }} />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
