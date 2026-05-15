'use client';

import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Banknote, 
  Activity,
  Calendar,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export const AdminFinancials = () => {
  const { t } = useLanguage();
  const stats = [
    { label: 'Total Revenue', value: '$124,592.00', trend: '+12.5%', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Active Subscriptions', value: '842', trend: '+4.2%', icon: CreditCard, color: 'text-[#5750F1]', bg: 'bg-[#5750F1]/10' },
    { label: 'Pending Payouts', value: '$12,402.50', trend: '-2.1%', icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  const transactions = [
    { id: 'TRX-9402', vendor: 'Global Retailers', amount: '+$1,200.00', date: 'Oct 24, 2023', status: 'completed' },
    { id: 'TRX-9403', vendor: 'Smart Labels Ltd', amount: '+$840.50', date: 'Oct 23, 2023', status: 'completed' },
    { id: 'TRX-9404', vendor: 'Eco Systems', amount: '-$150.00', date: 'Oct 22, 2023', status: 'pending' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">{t('financial_overview')}</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">{t('financial_desc') || 'Monitor revenue streams and platform transactions.'}</p>
        </div>
        <Button variant="outline" className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800 text-sm font-bold gap-2">
           <Download className="h-4 w-4" />
           Download Financial Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="premium-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                 {stat.trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                 {stat.trend}
              </div>
            </div>
            <p className="text-xs font-bold text-[#637381] dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-[#111928] dark:text-white mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="premium-card overflow-hidden">
        <div className="px-7 py-5 border-b border-[#E2E8F0] dark:border-slate-700 flex items-center justify-between">
           <h3 className="text-lg font-bold text-[#111928] dark:text-white">Recent Transactions</h3>
           <Button variant="ghost" className="text-xs font-bold text-[#5750F1] hover:bg-[#5750F1]/5">View All</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#313D4A] border-b border-[#E2E8F0] dark:border-slate-700 text-xs font-bold uppercase tracking-widest text-[#637381] dark:text-slate-400">
                <th className="px-7 py-4">{t('transaction_id') || 'Transaction ID'}</th>
                <th className="px-7 py-4">{t('entity') || 'Entity'}</th>
                <th className="px-7 py-4">{t('amount') || 'Amount'}</th>
                <th className="px-7 py-4">{t('date') || 'Date'}</th>
                <th className="px-7 py-4 text-right">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
              {transactions.map((trx, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-7 py-4 text-sm font-bold text-[#111928] dark:text-white">{trx.id}</td>
                  <td className="px-7 py-4 text-sm font-medium text-[#637381] dark:text-slate-400">{trx.vendor}</td>
                  <td className={`px-7 py-4 text-sm font-black ${trx.amount.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{trx.amount}</td>
                  <td className="px-7 py-4 text-xs font-medium text-[#637381] dark:text-slate-500">{trx.date}</td>
                  <td className="px-7 py-4 text-right">
                     <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${trx.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {trx.status}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
