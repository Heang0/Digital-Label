'use client';

import { 
  History, 
  Search, 
  User, 
  Clock, 
  ExternalLink,
  Shield,
  Activity,
  AlertCircle
} from 'lucide-react';
import { AuditLog } from '@/types';
import { motion } from 'framer-motion';
import { SearchInput } from './SearchInput';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface AuditLogProps {
  logs: AuditLog[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const AdminAuditLog = ({ logs, searchTerm, onSearchChange }: AuditLogProps) => {
  const { t } = useLanguage();
  const filtered = logs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return 'text-red-500 bg-red-50 dark:bg-red-500/10';
    if (action.includes('CREATE') || action.includes('ONBOARD')) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
    return 'text-slate-500 bg-slate-50 dark:bg-slate-500/10';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">{t('audit_logs_title')}</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">{t('audit_desc') || 'Track every action across the platform for security and accountability.'}</p>
        </div>
        <SearchInput 
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t('search')}
          className="w-full sm:w-96"
        />
      </div>

      <div className="bg-white dark:bg-[#24303F] rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#313D4A] border-b border-[#E2E8F0] dark:border-slate-700">
                <th className="px-6 py-4 text-sm font-semibold text-[#637381] dark:text-slate-400">{t('timestamp') || 'Timestamp'}</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#637381] dark:text-slate-400">{t('user') || 'User'}</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#637381] dark:text-slate-400">{t('action') || 'Action'}</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#637381] dark:text-slate-400">{t('details') || 'Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
              {filtered.map((log, i) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {log.timestamp instanceof Date ? log.timestamp.toLocaleString() : (log.timestamp as any).toDate().toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {log.userName.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-[#111928] dark:text-white">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getActionColor(log.action)}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#637381] dark:text-slate-400 line-clamp-1">{log.details}</p>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500">{t('no_data') || 'No logs found'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
