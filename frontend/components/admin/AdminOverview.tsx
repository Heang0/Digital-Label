'use client';

import { 
  Users, 
  Building2, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  Monitor,
  Activity,
  MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';

interface OverviewProps {
  metrics: {
    totalUsers: number;
    totalCompanies: number;
    systemHealth: number;
    databaseLoad: number;
    apiResponseTime: number;
  };
  onTabChange: (tab: 'overview' | 'users' | 'companies' | 'analytics' | 'settings') => void;
}

export const AdminOverview = ({ metrics, onTabChange }: OverviewProps) => {
  const handleExportReport = () => {
    const reportData = [
      ['Metric', 'Value', 'Status'],
      ['Total Vendors', metrics.totalUsers, 'Active'],
      ['Active Companies', metrics.totalCompanies, 'Active'],
      ['System Uptime', `${metrics.systemHealth}%`, 'Optimal'],
      ['Database Load', `${metrics.databaseLoad}%`, 'Stable'],
      ['API Latency', `${metrics.apiResponseTime}ms`, 'Low'],
      ['Report Generated', new Date().toLocaleString(), 'N/A']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([reportData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  const statCards = [
    { 
      label: 'Total Vendors', 
      value: metrics.totalUsers, 
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      trend: '+12.5%',
      isPositive: true 
    },
    { 
      label: 'Active Companies', 
      value: metrics.totalCompanies, 
      icon: Building2, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      trend: '+4.2%',
      isPositive: true 
    },
    { 
      label: 'Platform Activity', 
      value: '2.4k', 
      icon: Zap, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      trend: '-1.8%',
      isPositive: false 
    },
    { 
      label: 'Daily Revenue', 
      value: '$12,480', 
      icon: BarChart3, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      trend: '+24%',
      isPositive: true 
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Pattern */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-1">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#5750F1] uppercase tracking-[0.2em] mb-2">
            Executive Control
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Real-time system-wide performance and operational metrics.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={handleExportReport}
            className="h-10 px-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            Export Report
          </button>
          <button 
            onClick={() => onTabChange('analytics')}
            className="h-10 px-6 rounded-lg bg-[#5750F1] text-white text-xs font-bold hover:bg-[#4a42e0] transition-all shadow-md shadow-[#5750F1]/10"
          >
            View Analytics
          </button>
        </div>
      </div>

      {/* NextAdmin Style Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-[#24303F] p-6 rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm flex items-start justify-between group hover:shadow-md transition-all duration-300"
          >
            <div className="space-y-4">
              <div className={`h-11 w-11 rounded-full ${stat.bg} dark:bg-slate-800/50 flex items-center justify-center ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-[#111928] dark:text-white">{stat.value}</h4>
                <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">{stat.label}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold flex items-center gap-1 ${stat.isPositive ? 'text-[#10B981]' : 'text-[#FB5050]'}`}>
                  {stat.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.trend}
                </span>
                <span className="text-[10px] font-medium text-[#637381] dark:text-slate-500">Since last week</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Health Meters - Refined */}
        <div className="lg:col-span-2 p-8 bg-white dark:bg-[#24303F] rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-[#5750F1] dark:text-white">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#10B981] border-2 border-white dark:border-slate-800 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111928] dark:text-white">Infrastructure Vitality</h3>
                <p className="text-[10px] text-[#637381] font-bold uppercase tracking-[0.1em] mt-0.5">Real-time system health</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { label: 'System Uptime', value: `${metrics.systemHealth}%`, color: 'bg-[#10B981]', desc: 'Optimal' },
              { label: 'Database Load', value: `${metrics.databaseLoad}%`, color: 'bg-[#5750F1]', desc: 'Stable' },
              { label: 'API Latency', value: `${metrics.apiResponseTime}ms`, color: 'bg-[#FB5050]', desc: 'Low' },
            ].map((stat, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#637381] uppercase tracking-widest">{stat.label}</span>
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${
                    stat.desc === 'Optimal' ? 'text-[#10B981]' : 
                    stat.desc === 'Stable' ? 'text-[#5750F1]' : 'text-slate-900 dark:text-white'
                  }`}>{stat.desc}</span>
                </div>
                <div className="text-2xl font-bold text-[#111928] dark:text-white">{stat.value}</div>
                <div className="h-1.5 w-full bg-[#F3F4F6] dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: stat.value.includes('%') ? stat.value : '45%' }}
                    transition={{ duration: 1.5, ease: "circOut", delay: i * 0.1 }}
                    className={`h-full ${stat.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Activity Placeholder */}
        <div className="p-8 bg-white dark:bg-[#24303F] rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
           <h3 className="text-sm font-bold text-[#111928] dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
             <Zap className="h-4 w-4 text-amber-500" />
             Live Activity
           </h3>
           <div className="space-y-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex gap-4 group cursor-pointer">
                   <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                   <div>
                      <p className="text-xs font-bold text-[#111928] dark:text-white">System Backup Successful</p>
                      <p className="text-[10px] text-[#637381] dark:text-slate-400 mt-0.5">Automated maintenance complete.</p>
                      <p className="text-[9px] font-bold text-[#637381] uppercase tracking-widest mt-1">2m ago</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
