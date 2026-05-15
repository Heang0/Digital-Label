'use client';

import { motion } from 'framer-motion';
import { Zap, Server, Shield, CheckCircle2, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Button } from '@/components/ui/button';

export const POSTab = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-[#111928] dark:text-white tracking-tight uppercase">{t('pos_system')}</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">{t('pos_desc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 p-10 relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                 <Zap className="h-64 w-64 text-[#5750F1]" />
              </div>
              
              <div className="relative z-10">
                 <div className="h-14 w-14 bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-8">
                    <Server className="h-7 w-7 text-[#5750F1]" />
                 </div>
                 <h3 className="text-xl font-black text-[#111928] dark:text-white uppercase mb-4 tracking-tight">Active API Tunnel</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-xl">
                    Your local POS system is communicating via our secure encrypted tunnel. Price updates from your cash registers are automatically synchronized with E-Ink labels across all branches.
                 </p>
                 
                 <div className="flex flex-wrap gap-4">
                    <Button className="bg-[#5750F1] hover:bg-[#4A44D1] text-white font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-none">
                       Check Connectivity
                    </Button>
                    <Button variant="outline" className="border-slate-200 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-none">
                       View API Logs
                    </Button>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                 { title: 'Secure Gateway', desc: 'AES-256 Encryption active on all data packets.', icon: Shield },
                 { title: 'Instant Sync', desc: 'Sub-second latency for price transmissions.', icon: RefreshCw },
              ].map((item, i) => (
                 <div key={i} className="bg-white dark:bg-[#1C2434] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <item.icon className="h-6 w-6 text-emerald-500 mb-4" />
                    <h4 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight mb-2">{item.title}</h4>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{item.desc}</p>
                 </div>
              ))}
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 p-8 border border-slate-800 shadow-xl">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8">Integration Status</h3>
              <div className="space-y-6">
                 {[
                    { label: 'Core Server', status: 'Optimal', color: 'text-emerald-500' },
                    { label: 'Database Link', status: 'Connected', color: 'text-emerald-500' },
                    { label: 'Sync Engine', status: 'Standby', color: 'text-amber-500' },
                    { label: 'Hardware Bridge', status: 'Online', color: 'text-[#5750F1]' },
                 ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-slate-800 pb-4">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                       <div className="flex items-center gap-2">
                          <CheckCircle2 className={`h-3 w-3 ${s.color}`} />
                          <span className={`text-[10px] font-black uppercase ${s.color}`}>{s.status}</span>
                       </div>
                    </div>
                 ))}
              </div>
              <div className="mt-8 pt-4">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                    Last successful heartbeat received at 13:19:05.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
