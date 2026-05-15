'use client';

import { 
  Building2, 
  MapPin, 
  Mail, 
  Edit, 
  Trash2, 
  Plus,
  Layers,
  Tag,
  Users2,
  ArrowUpRight,
  Filter,
  Download,
  Package,
  LayoutGrid
} from 'lucide-react';
import { Company } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SearchInput } from './SearchInput';

interface CompaniesProps {
  companies: Company[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEdit: (company: Company | null) => void;
  onDelete: (id: string) => void;
  onSuspend: (id: string, status: any) => void;
}

export const AdminCompanies = ({ 
  companies, 
  searchTerm, 
  onSearchChange,
  onEdit, 
  onDelete, 
  onSuspend 
}: CompaniesProps) => {
  const { t } = useLanguage();
  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#10B981]/10 text-[#10B981]';
      case 'suspended': return 'bg-[#FB5050]/10 text-[#FB5050]';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  const getSubscriptionStyle = (sub: string) => {
    switch (sub) {
      case 'enterprise': return 'bg-[#5750F1]/10 text-[#5750F1]';
      case 'pro': return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Status', 'Subscription', 'Branches', 'Labels'];
    const data = filtered.map(c => [
      c.name,
      c.email,
      c.status,
      c.subscription,
      c.branchesCount || 0,
      c.labelsCount || 0,
      c.productsCount || 0,
      c.categoriesCount || 0,
      c.staffCount || 0
    ].join(','));
    
    const csvContent = [headers.join(','), ...data].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Section (Matching Vendors) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">{t('companies')}</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">{t('companies_desc') || 'Manage global retail ecosystems and operational scale.'}</p>
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
            onClick={handleExport}
            className="h-11 px-6 rounded-lg border border-[#E2E8F0] dark:border-slate-800 text-sm font-bold text-[#637381] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden xs:inline">{t('export_data')}</span>
          </Button>
          <Button 
            onClick={() => onEdit(null)}
            className="h-11 px-6 rounded-lg bg-[#5750F1] hover:bg-[#4a42e0] text-white font-bold text-sm shadow-md shadow-[#5750F1]/10 transition-all gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('onboard_company') || 'Onboard Company'}
          </Button>
        </div>
      </div>

      {/* Table Section (Matching Vendors Style) */}
      <div className="bg-white dark:bg-[#24303F] rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#313D4A] border-b border-[#E2E8F0] dark:border-slate-700">
                <th className="px-6 py-4.5 text-sm font-semibold text-[#637381] dark:text-slate-400 capitalize">{t('company_info')}</th>
                <th className="px-6 py-4.5 text-sm font-semibold text-[#637381] dark:text-slate-400 capitalize">{t('status')}</th>
                <th className="px-6 py-4.5 text-sm font-semibold text-[#637381] dark:text-slate-400 capitalize">{t('metrics')}</th>
                <th className="px-6 py-4.5 text-sm font-semibold text-[#637381] dark:text-slate-400 capitalize">{t('subscription')}</th>
                <th className="px-6 py-4.5 text-sm font-semibold text-[#637381] dark:text-slate-400 capitalize text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
              <AnimatePresence>
                {filtered.map((company, i) => (
                  <motion.tr 
                    key={company.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-lg bg-[#5750F1]/5 dark:bg-[#5750F1]/10 flex items-center justify-center text-[#5750F1] border border-[#5750F1]/10 dark:border-[#5750F1]/20 transition-colors group-hover:bg-[#5750F1] group-hover:text-white">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111928] dark:text-white leading-tight mb-1">{company.name}</p>
                          <p className="text-xs font-medium text-[#637381] dark:text-slate-400">{company.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(company.status)}`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5" title="Branches">
                           <Layers className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                           <span className="text-xs font-bold text-[#111928] dark:text-white">{company.branchesCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Labels">
                           <Tag className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                           <span className="text-xs font-bold text-[#111928] dark:text-white">{company.labelsCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Products">
                           <Package className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                           <span className="text-xs font-bold text-[#111928] dark:text-white">{company.productsCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Categories">
                           <LayoutGrid className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                           <span className="text-xs font-bold text-[#111928] dark:text-white">{company.categoriesCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Staff">
                           <Users2 className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                           <span className="text-xs font-bold text-[#111928] dark:text-white">{company.staffCount || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${getSubscriptionStyle(company.subscription)}`}>
                          {company.subscription}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onEdit(company)}
                          className="p-2 rounded-lg text-[#637381] dark:text-slate-400 hover:text-[#5750F1] hover:bg-[#5750F1]/5 transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => onDelete(company.id)}
                          className="p-2 rounded-lg text-[#637381] dark:text-slate-400 hover:text-[#FB5050] hover:bg-[#FB5050]/5 transition-all"
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
                <Building2 className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-[#637381] dark:text-slate-400">{t('no_data') || 'No companies found matching your search'}</p>
            </div>
          )}
        </div>

        {/* Footer Pagination (Standardized) */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
           <p className="text-xs font-medium text-[#637381] dark:text-slate-500">{t('showing_results') || 'Showing'} {filtered.length} {t('of') || 'of'} {companies.length} {t('results') || 'Results'}</p>
           <div className="flex gap-2">
              <button className="h-8 px-3 rounded border border-[#E2E8F0] dark:border-slate-700 text-xs font-bold text-[#637381] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">{t('prev') || 'Previous'}</button>
              <button className="h-8 w-8 rounded bg-[#5750F1] text-xs font-bold text-white shadow-sm shadow-[#5750F1]/20">1</button>
              <button className="h-8 px-3 rounded border border-[#E2E8F0] dark:border-slate-700 text-xs font-bold text-[#637381] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">{t('next') || 'Next'}</button>
           </div>
        </div>
      </div>
    </div>
  );
};
