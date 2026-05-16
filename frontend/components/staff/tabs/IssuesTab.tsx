'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Search,
  MessageSquare,
  Tag,
  Hammer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IssueReport } from '@/hooks/useStaffDashboard';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface StaffIssuesTabProps {
  issues: IssueReport[];
  onReportNew: () => void;
  onRefresh: () => void;
  onUpdateStatus?: (issueId: string, status: 'open' | 'in-progress' | 'resolved') => Promise<void>;
  onAddNote?: (issueId: string, note: string) => Promise<void>;
}

export const StaffIssuesTab = ({
  issues,
  onReportNew,
  onRefresh,
  onUpdateStatus,
  onAddNote
}: StaffIssuesTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [noteForm, setNoteForm] = useState<{id: string, text: string} | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { t } = useLanguage();

  const filteredIssues = issues.filter(i => 
    i.labelId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.issue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">{t('maintenance_log')}</span>
           </div>
           <h2 className="text-2xl font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('reported_issues')}</h2>
           <p className="text-xs font-medium text-[#637381] dark:text-slate-400">{t('reported_issues_desc')}</p>
        </div>

        <div className="flex items-center gap-3">
           <Button 
            onClick={onRefresh}
            variant="outline"
            className="h-12 w-12 p-0 rounded-none border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            onClick={onReportNew}
            className="h-12 px-6 rounded-none bg-rose-500 hover:bg-rose-600 text-white border-none text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-rose-500/20"
          >
            <Plus className="h-4 w-4" />
            {t('flag_new_issue')}
          </Button>
        </div>
      </div>

      {/* Issues Table/List */}
      <div className="bg-white dark:bg-[#1C2434] border border-slate-100 dark:border-slate-800">
        <div className="p-4 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
           <div className="relative group flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 group-focus-within:text-[#5750F1]" />
              <Input 
                placeholder={t('search_issues_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-none bg-transparent text-[10px] font-bold uppercase tracking-widest focus-visible:ring-0"
              />
           </div>
           <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>{t('total')}: {issues.length}</span>
              <span className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              <span className="text-rose-500">{t('open')}: {issues.filter(i => i.status === 'open').length}</span>
           </div>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
           {filteredIssues.map((issue) => (
             <motion.div 
               key={issue.id}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
             >
                <div className="flex items-start gap-5">
                   <div className={`h-12 w-12 shrink-0 flex items-center justify-center border ${
                     issue.priority === 'high' ? 'bg-rose-50 border-rose-100 text-rose-500' :
                     issue.priority === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-500' :
                     'bg-indigo-50 border-indigo-100 text-[#5750F1]'
                   }`}>
                      {issue.status === 'resolved' ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Hammer className="h-6 w-6" />}
                   </div>
                   
                   <div>
                      <div className="flex items-center gap-3 mb-1">
                         <span className="text-[10px] font-black text-[#111928] dark:text-white uppercase tracking-[0.2em]">{issue.labelId}</span>
                         <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                           issue.status === 'open' ? 'bg-rose-500 text-white' :
                           issue.status === 'in-progress' ? 'bg-amber-500 text-white' :
                           'bg-emerald-500 text-white'
                         }`}>
                           {t(issue.status as any) || issue.status}
                         </span>
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed mb-2">{issue.issue}</p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {issue.reportedAt.toDate().toLocaleDateString()}
                         </div>
                         <div className="flex items-center gap-1.5">
                            <Tag className="h-3 w-3" />
                            {t(`priority_${issue.priority}` as any) || issue.priority}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col items-end gap-3 md:self-center">
                   <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setNoteForm(noteForm?.id === issue.id ? null : { id: issue.id, text: '' })}
                        className="h-10 px-4 rounded-none border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900"
                      >
                         {t('add_note')}
                      </Button>
                      {issue.status !== 'resolved' && (
                        <Button 
                          disabled={updatingId === issue.id}
                          onClick={async () => {
                            if (!onUpdateStatus) return;
                            setUpdatingId(issue.id);
                            await onUpdateStatus(issue.id, 'resolved');
                            setUpdatingId(null);
                          }}
                          className="h-10 px-4 rounded-none bg-emerald-500 hover:bg-emerald-600 text-white border-none text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                        >
                           {updatingId === issue.id ? t('update') : t('mark_working') || 'Mark Working'}
                        </Button>
                      )}
                   </div>

                   <AnimatePresence>
                      {noteForm?.id === issue.id && (
                         <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="w-full min-w-[280px] mt-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                         >
                            <textarea 
                               autoFocus
                               value={noteForm.text}
                               onChange={(e) => setNoteForm({...noteForm, text: e.target.value})}
                               placeholder="Enter maintenance update..."
                               className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs font-bold outline-none min-h-[80px]"
                            />
                            <div className="flex justify-end gap-2">
                               <Button 
                                  onClick={() => setNoteForm(null)}
                                  variant="ghost" 
                                  className="h-8 px-3 text-[9px] font-black uppercase"
                               >
                                  Cancel
                               </Button>
                               <Button 
                                  disabled={!noteForm.text || updatingId === issue.id}
                                  onClick={async () => {
                                     if (!onAddNote) return;
                                     setUpdatingId(issue.id);
                                     await onAddNote(issue.id, noteForm.text);
                                     setUpdatingId(null);
                                     setNoteForm(null);
                                  }}
                                  className="h-8 px-3 bg-[#5750F1] text-white text-[9px] font-black uppercase"
                               >
                                  {updatingId === issue.id ? 'Saving...' : 'Save Note'}
                               </Button>
                            </div>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>
             </motion.div>
           ))}

           {filteredIssues.length === 0 && (
             <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4">
                   <MessageSquare className="h-8 w-8 text-slate-200" />
                </div>
                <h3 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">System Status: Nominal</h3>
                <p className="text-xs font-medium text-slate-400 mt-1 max-w-[200px]">No active incidents reported for this branch location.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
