'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
}

export const MetricCard = ({ title, value, icon: Icon, color, trend }: MetricCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group p-6 sm:p-8 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
          <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend && (
          <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
            trend.isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
          }`}>
            {trend.value}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </motion.div>
  );
};
