'use client';

import { motion } from 'framer-motion';
import { HelpCircle, Mail, Phone, MessageSquare, ChevronRight, Activity, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const SupportTab = () => {
  return (
    <div className="max-w-5xl space-y-8 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Support Center</h2>
        <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Resolve technical issues and access platform documentation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {[
            { title: 'Technical Helpdesk', sub: '24/7 Priority Support', icon: Phone, action: 'Call Now', color: 'text-[#5750F1]' },
            { title: 'Email Assistance', sub: 'Response within 2 hours', icon: Mail, action: 'Open Ticket', color: 'text-emerald-500' },
            { title: 'Knowledge Base', sub: 'Guides & Tutorials', icon: MessageSquare, action: 'View Docs', color: 'text-amber-500' },
         ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="premium-card p-8">
               <div className={`h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 ${card.color}`}>
                  <card.icon className="h-7 w-7" />
               </div>
               <h3 className="text-lg font-bold text-[#111928] dark:text-white mb-1">{card.title}</h3>
               <p className="text-sm text-[#637381] mb-8">{card.sub}</p>
               <Button variant="outline" className="w-full h-11 rounded-xl border-slate-100 dark:border-slate-800 font-bold group">
                  {card.action}
                  <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
               </Button>
            </motion.div>
         ))}
      </div>

      <div className="premium-card p-8 bg-[#F8FAFC] dark:bg-[#1C2434]">
         <div className="flex items-center gap-4 mb-6">
            <Activity className="h-5 w-5 text-[#5750F1]" />
            <h3 className="text-lg font-bold text-[#111928] dark:text-white">Platform Health</h3>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
               { label: 'IoT Gateway', status: 'Operational', time: '99.9% Uptime' },
               { label: 'API Infrastructure', status: 'Optimal', time: '42ms Latency' },
               { label: 'Cloud Storage', status: 'Online', time: 'Sync Active' },
            ].map((item, i) => (
               <div key={i} className="space-y-2">
                  <p className="text-[10px] font-black text-[#637381] uppercase tracking-widest">{item.label}</p>
                  <div className="flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                     <span className="text-sm font-black text-[#111928] dark:text-white">{item.status}</span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400">{item.time}</p>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};
