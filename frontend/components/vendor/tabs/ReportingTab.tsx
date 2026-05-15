'use client';

import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter,
  Package,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ReportingTabProps {
  branches: any[];
  selectedBranchId: string;
}

export const ReportingTab = ({
  branches,
  selectedBranchId
}: ReportingTabProps) => {
  const { t } = useLanguage();

  const reportTypes = [
    { id: 'sales', title: 'Inventory Sales Report', desc: 'Detailed breakdown of price changes vs sales volume.', icon: DollarSign, color: 'text-emerald-500' },
    { id: 'stock', title: 'Stock Integrity Audit', desc: 'Compare physical label values with back-office inventory.', icon: Package, color: 'text-[#5750F1]' },
    { id: 'scans', title: 'Customer Interaction Data', desc: 'Raw logs of all digital label scans and QR engagements.', icon: Layers, color: 'text-amber-500' },
    { id: 'system', title: 'Hardware Health Audit', desc: 'Battery levels, connectivity logs, and maintenance history.', icon: Database, color: 'text-indigo-500' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1.5">
              <FileText className="h-4 w-4 text-[#5750F1]" />
              <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.2em]">{t('intelligence_reports')}</span>
           </div>
          <h2 className="text-2xl font-black text-[#111928] dark:text-white tracking-tight uppercase">{t('reporting_suite')}</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">{t('reporting_suite_desc')}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 rounded-none border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest gap-2">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button className="h-12 rounded-none bg-[#5750F1] hover:bg-[#4A44D1] text-[10px] font-black uppercase tracking-widest gap-2">
            <Download className="h-4 w-4" />
            Export ALL
          </Button>
        </div>
      </div>

      {/* Grid of Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <motion.div 
            key={report.id}
            whileHover={{ y: -5 }}
            className="group bg-white dark:bg-[#1C2434] p-8 border border-slate-200 dark:border-slate-800 flex items-start gap-6 cursor-pointer hover:shadow-xl transition-all"
          >
            <div className={`h-16 w-16 shrink-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:bg-[#5750F1] group-hover:text-white transition-all`}>
               <report.icon className="h-8 w-8" />
            </div>
            <div className="flex-1">
               <h3 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight mb-2 group-hover:text-[#5750F1] transition-colors">{report.title}</h3>
               <p className="text-xs font-medium text-[#637381] dark:text-slate-400 leading-relaxed mb-6">{report.desc}</p>
               <div className="flex items-center gap-4">
                  <button className="text-[10px] font-black text-[#5750F1] uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                     Generate Preview
                     <ArrowRight className="h-3 w-3" />
                  </button>
                  <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
                  <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">
                     Download CSV
                  </button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity Table Preview */}
      <div className="bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 overflow-hidden">
         <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-black text-[#111928] dark:text-white uppercase tracking-[0.2em]">Generated Report History</h4>
            <Filter className="h-4 w-4 text-slate-400" />
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Name</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Generated By</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {[
                     { name: 'Monthly Inventory Audit', user: 'Admin (You)', date: 'Oct 24, 2023' },
                     { name: 'Daily Scan Performance', user: 'System Bot', date: 'Oct 23, 2023' },
                     { name: 'Branch 02 Pricing Log', user: 'Staff: John D.', date: 'Oct 21, 2023' },
                  ].map((row, idx) => (
                     <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-black text-[#111928] dark:text-white uppercase">{row.name}</td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{row.user}</td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{row.date}</td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2">
                              <button className="p-2 hover:text-[#5750F1] transition-colors"><Printer className="h-4 w-4" /></button>
                              <button className="p-2 hover:text-[#5750F1] transition-colors"><Download className="h-4 w-4" /></button>
                           </div>
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
