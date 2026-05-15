'use client';

import { 
  RefreshCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Building2,
  Tag,
  Clock,
  ArrowRight
} from 'lucide-react';
import { LabelSyncRecord } from '@/types';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import { SearchInput } from './SearchInput';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface LabelSyncProps {
  records: LabelSyncRecord[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  refresh: () => void;
}

export const AdminLabelSync = ({ records, searchTerm, onSearchChange, refresh }: LabelSyncProps) => {
  const { t } = useLanguage();
  const [retrying, setRetrying] = useState<string | null>(null);

  const filtered = records.filter(r => 
    r.labelCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.companyId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRetry = async (record: LabelSyncRecord) => {
    setRetrying(record.id);
    try {
      await updateDoc(doc(db, 'label_syncs', record.id), {
        status: 'pending',
        retryCount: (record.retryCount || 0) + 1,
        lastAttempt: Timestamp.now()
      });
      // In a real app, this would trigger a backend process.
      // For now we just simulate success after a delay.
      setTimeout(() => {
        refresh();
        setRetrying(null);
      }, 1000);
    } catch (error) {
      console.error('Failed to retry sync:', error);
      setRetrying(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">{t('label_sync_title')}</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">{t('sync_monitor')}</p>
        </div>
        <SearchInput 
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t('search')}
          className="w-full sm:w-96"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t('successful_syncs'), value: records.filter(r => r.status === 'success').length, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: t('failed_syncs'), value: records.filter(r => r.status === 'failed').length, icon: AlertTriangle, color: 'text-red-500' },
          { label: t('pending_updates'), value: records.filter(r => r.status === 'pending').length, icon: RefreshCcw, color: 'text-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#24303F] p-6 rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#637381] uppercase tracking-wider mb-1">{stat.label}</p>
              <h4 className="text-2xl font-bold text-[#111928] dark:text-white">{stat.value}</h4>
            </div>
            <stat.icon className={`h-8 w-8 ${stat.color} opacity-20`} />
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#24303F] rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#313D4A] border-b border-[#E2E8F0] dark:border-slate-700">
                <th className="px-6 py-4 text-sm font-semibold text-[#637381] dark:text-slate-400">{t('label_info')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#637381] dark:text-slate-400">{t('company')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#637381] dark:text-slate-400">{t('status')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#637381] dark:text-slate-400 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
              {filtered.map((record, i) => (
                <motion.tr 
                  key={record.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <Tag className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111928] dark:text-white">{record.labelCode}</p>
                        <p className="text-[10px] font-medium text-[#637381] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {record.lastAttempt instanceof Date ? record.lastAttempt.toLocaleString() : (record.lastAttempt as any).toDate().toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm text-[#111928] dark:text-white font-medium">{record.companyName || record.companyId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        record.status === 'success' ? 'bg-emerald-500' :
                        record.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        record.status === 'success' ? 'text-emerald-500' :
                        record.status === 'failed' ? 'text-red-500' : 'text-blue-500'
                      }`}>
                        {record.status}
                      </span>
                      {record.error && <p className="text-[10px] text-red-400 mt-0.5 ml-2 italic">{record.error}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {record.status === 'failed' && (
                      <button 
                        onClick={() => handleRetry(record)}
                        disabled={retrying === record.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5750F1] text-white text-[10px] font-bold hover:bg-[#4a42e0] transition-all disabled:opacity-50"
                      >
                        <RefreshCcw className={`h-3 w-3 ${retrying === record.id ? 'animate-spin' : ''}`} />
                        {t('retry_sync')}
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <RefreshCcw className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500">{t('no_data') || 'No sync records available'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
