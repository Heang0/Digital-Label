'use client';

import { 
  RefreshCcw, 
  Zap, 
  Globe, 
  Database, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Terminal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Button } from '@/components/ui/button';

export const AdminSync = () => {
  const { t } = useLanguage();
  
  const services = [
    { name: 'Firebase Realtime', status: 'Healthy', latency: '42ms', lastSync: 'Just now', icon: Zap, color: 'text-amber-500' },
    { name: 'Laravel API Base', status: 'Healthy', latency: '128ms', lastSync: '1 min ago', icon: Database, color: 'text-[#5750F1]' },
    { name: 'E-Ink Gateway', status: 'Healthy', latency: '210ms', lastSync: '3 mins ago', icon: Cpu, color: 'text-emerald-500' },
    { name: 'Global CDN', status: 'Healthy', latency: '15ms', lastSync: 'Just now', icon: Globe, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">{t('sync') || 'Global Sync Control'}</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Manage the heartbeat of the Kitzu-Tech retail network.</p>
        </div>
        <Button className="h-11 px-8 rounded-lg bg-[#5750F1] hover:bg-[#4a42e0] text-white font-bold text-sm shadow-lg shadow-[#5750F1]/20 gap-2">
          <RefreshCcw className="h-4 w-4" />
          Force Global Sync
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service, i) => (
          <motion.div 
            key={service.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-[#24303F] p-6 rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm hover:border-[#5750F1]/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${service.color} group-hover:scale-110 transition-transform`}>
                <service.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#111928] dark:text-white">{service.name}</h3>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-[#637381] dark:text-slate-500 uppercase tracking-widest">Latency</span>
                <span className="text-[#111928] dark:text-white">{service.latency}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-[#637381] dark:text-slate-500 uppercase tracking-widest">Updated</span>
                <span className="text-[#111928] dark:text-white">{service.lastSync}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-[#1C2434] rounded-[10px] border border-slate-700 shadow-2xl overflow-hidden p-6 font-mono">
         <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-4 text-slate-400">
            <div className="flex items-center gap-3">
               <Terminal className="h-4 w-4" />
               <span className="text-xs font-bold uppercase tracking-widest">Global Sync Console</span>
            </div>
            <div className="flex gap-1.5">
               <div className="h-2 w-2 rounded-full bg-rose-500" />
               <div className="h-2 w-2 rounded-full bg-amber-500" />
               <div className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
         </div>
         <div className="space-y-2 text-[11px] text-emerald-500/80 leading-relaxed">
            <p className="flex gap-4">
              <span className="text-slate-500">[22:25:01]</span>
              <span>Initalizing global sync sequence...</span>
            </p>
            <p className="flex gap-4">
              <span className="text-slate-500">[22:25:03]</span>
              <span className="text-white font-bold">SUCCESS: Connected to 1,242 retail endpoints.</span>
            </p>
            <p className="flex gap-4">
              <span className="text-slate-500">[22:25:05]</span>
              <span>Pushing UI Update v2.4.1 (Label-Elite-Standard)...</span>
            </p>
            <p className="flex gap-4 animate-pulse">
              <span className="text-slate-500">[22:25:08]</span>
              <span>Broadcasting refresh signal to E-Ink Gateway...</span>
            </p>
         </div>
      </div>
    </div>
  );
};
