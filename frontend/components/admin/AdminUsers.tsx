'use client';

import {
  Users,
  Mail,
  ShieldCheck,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  ArrowUpRight,
  Filter,
  Search,
  Building2,
  Download,
  Key
} from 'lucide-react';
import { User } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SearchInput } from './SearchInput';

interface UsersProps {
  users: User[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onSuspend: (id: string, status: any) => void;
  onStatusChange: (id: string, newStatus: string) => void;
  onRoleChange: (id: string, newRole: string) => void;
  onCreate: () => void;
}

export const AdminUsers = ({ 
  users, 
  searchTerm, 
  onSearchChange,
  onEdit, 
  onDelete, 
  onSuspend, 
  onStatusChange, 
  onRoleChange, 
  onCreate 
}: UsersProps) => {
  const { t } = useLanguage();
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#10B981]/10 text-[#10B981]';
      case 'suspended': return 'bg-[#FB5050]/10 text-[#FB5050]';
      case 'pending': return 'bg-amber-100 text-amber-600';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  if (users.length === 0 && searchTerm === '') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-8" />
        <div className="bg-white dark:bg-[#24303F] rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-2 w-32 bg-slate-50 dark:bg-slate-900 rounded" />
                </div>
              </div>
              <div className="h-2 w-20 bg-slate-50 dark:bg-slate-900 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Page Header (Digital Label Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">{t('vendors')}</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">{t('manage_vendors')}</p>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput 
            value={searchTerm}
            onChange={onSearchChange}
            placeholder={t('search')}
            className="w-full sm:w-80"
          />
          <Button
            variant="outline"
            onClick={() => {
              const headers = ['Name', 'Email', 'Company', 'Status', 'Role'];
              const data = filtered.map(u => [u.name, u.email, u.companyId || 'N/A', u.status, u.role].join(','));
              const csvContent = [headers.join(','), ...data].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `vendors_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="h-11 px-6 rounded-lg border border-[#E2E8F0] dark:border-slate-800 text-sm font-bold text-[#637381] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden xs:inline">{t('export_data')}</span>
          </Button>
          <Button
            onClick={onCreate}
            className="h-11 px-6 rounded-lg bg-[#5750F1] hover:bg-[#4a42e0] text-white font-bold text-sm shadow-md shadow-[#5750F1]/10 transition-all gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {t('add_vendor')}
          </Button>
        </div>
      </div>

      {/* Data Table (NextAdmin High-End Style) */}
      <div className="bg-white dark:bg-[#24303F] rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#313D4A] border-b border-[#E2E8F0] dark:border-slate-700">
                <th className="px-6 py-4.5 text-sm font-semibold text-[#637381] dark:text-slate-400 capitalize">{t('name')}</th>
                <th className="px-6 py-4.5 text-sm font-semibold text-[#637381] dark:text-slate-400 capitalize">{t('company')}</th>
                <th className="px-6 py-4.5 text-sm font-semibold text-[#637381] dark:text-slate-400 capitalize">{t('status')}</th>
                <th className="px-6 py-4.5 text-sm font-semibold text-[#637381] dark:text-slate-400 capitalize">{t('role')}</th>
                <th className="px-6 py-4.5 text-sm font-semibold text-[#637381] dark:text-slate-400 capitalize text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
              <AnimatePresence>
                {filtered.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold border border-slate-100 dark:border-slate-700">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111928] dark:text-white leading-tight mb-1">{user.name}</p>
                          <p className="text-xs font-medium text-[#637381] dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-[#637381] dark:text-slate-500" />
                        <span className="text-xs font-bold text-[#111928] dark:text-white">{user.companyId || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'text-indigo-500' : 'text-[#637381]'}`}>
                          {user.role}
                        </span>
                        {user.role === 'admin' && (
                          <button 
                            onClick={() => onRoleChange(user.id, user.role === 'admin' ? 'super-admin' : 'admin')}
                            className="text-[8px] font-bold text-slate-400 hover:text-indigo-500 text-left underline"
                          >
                            Toggle Super Admin
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => onStatusChange(user.id, 'active')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onStatusChange(user.id, 'suspended')}
                              className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onEdit(user)}
                          className="p-2 rounded-lg text-[#637381] dark:text-slate-400 hover:text-[#5750F1] hover:bg-[#5750F1]/5 transition-all"
                          title="Edit Vendor"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Send password reset email to ${user.email}?`)) {
                              window.dispatchEvent(new CustomEvent('reset-vendor-password', { detail: user.email }));
                            }
                          }}
                          className="p-2 rounded-lg text-[#637381] dark:text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(user.id)}
                          className="p-2 rounded-lg text-[#637381] dark:text-slate-400 hover:text-[#FB5050] hover:bg-[#FB5050]/5 transition-all"
                          title="Delete Vendor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 dark:text-slate-700">
                <Users className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-[#637381] dark:text-slate-400">No vendors found matching your search.</p>
            </div>
          )}
        </div>

        {/* Footer Results Count */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] dark:border-slate-800">
          <p className="text-xs font-medium text-[#637381] dark:text-slate-500">
            Showing {filtered.length} of {users.length} Results
          </p>
        </div>
      </div>
    </div>
  );
};
