'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Terminal, Flag, Tag, AlertTriangle, Hammer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DigitalLabel } from '@/types/vendor';

import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (labelId: string, issue: string, priority: 'high' | 'medium' | 'low') => Promise<void>;
  labels: DigitalLabel[];
  selectedBranchId: string;
}

export const ReportIssueModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  labels,
  selectedBranchId 
}: ReportIssueModalProps) => {
  const { t } = useLanguage();
  const [labelId, setLabelId] = useState('');
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Filter labels based on branch AND search query
  const filteredLabels = labels.filter(l => {
    const isInBranch = selectedBranchId === 'all' || l.branchId === selectedBranchId;
    if (!isInBranch) return false;
    
    if (!searchQuery) return true;
    
    const s = searchQuery.toLowerCase();
    return (
      l.labelId.toLowerCase().includes(s) ||
      (l.productName || '').toLowerCase().includes(s) ||
      (l.location || '').toLowerCase().includes(s)
    );
  });

  const selectedLabelData = labels.find(l => l.labelId === labelId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelId || !issue) return;
    
    setLoading(true);
    try {
      await onSubmit(labelId, issue, priority);
      setLabelId('');
      setIssue('');
      setSearchQuery('');
      setPriority('medium');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-[#1C2434] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/20">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 border border-rose-100 dark:border-rose-900/30">
                     <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                     <h3 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight leading-none mb-1">{t('report_incident')}</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('hardware_discrepancy')}</p>
                  </div>
               </div>
               <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X className="h-5 w-5" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
               {/* Searchable Label Selection */}
               <div className="space-y-2">
                  <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                     <Tag className="h-3 w-3" />
                     {t('tag_id')}
                  </label>
                  
                  <div className="relative">
                     <Input 
                        value={searchQuery || labelId}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsSearching(true);
                        }}
                        onFocus={() => setIsSearching(true)}
                        placeholder={t('search_tag_placeholder')}
                        className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold pl-4 pr-10"
                     />
                     {labelId && !searchQuery && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                           <span className="text-[8px] font-black bg-rose-500 text-white px-1.5 py-0.5 uppercase">{t('selected') || 'Selected'}</span>
                        </div>
                     )}

                     <AnimatePresence>
                        {isSearching && (
                           <>
                              <motion.div 
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 exit={{ opacity: 0 }}
                                 className="fixed inset-0 z-10"
                                 onClick={() => setIsSearching(false)}
                              />
                              <motion.div 
                                 initial={{ opacity: 0, y: -10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -10 }}
                                 className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 shadow-xl z-20 max-h-[200px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50"
                              >
                                 {filteredLabels.length > 0 ? filteredLabels.map(l => (
                                    <button
                                       key={l.id}
                                       type="button"
                                       onClick={() => {
                                          setLabelId(l.labelId);
                                          setSearchQuery('');
                                          setIsSearching(false);
                                       }}
                                       className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                    >
                                       <div className="flex items-center justify-between gap-4 mb-1">
                                          <span className="text-[10px] font-black text-[#111928] dark:text-white uppercase tracking-widest">{l.labelId}</span>
                                          {l.location && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{l.location}</span>}
                                       </div>
                                       <p className="text-[10px] font-bold text-slate-500 truncate">{l.productName || t('unassigned_node')}</p>
                                    </button>
                                 )) : (
                                    <div className="p-8 text-center">
                                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('no_matching_tags')}</p>
                                    </div>
                                 )}
                              </motion.div>
                           </>
                        )}
                     </AnimatePresence>
                  </div>
                  
                  {selectedLabelData && !isSearching && (
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4"
                     >
                        <div className="h-8 w-8 bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                           <Terminal className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[10px] font-black text-[#111928] dark:text-white uppercase truncate">{selectedLabelData.productName || t('system_hardware')}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedLabelData.labelId} • {selectedLabelData.location || 'Warehouse'}</p>
                        </div>
                     </motion.div>
                  )}
               </div>

               {/* Issue Description */}
               <div className="space-y-2">
                  <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                     <Hammer className="h-3 w-3" />
                     {t('incident_details')}
                  </label>
                  <textarea
                    required
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder={t('describe_issue')}
                    className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-xs font-bold focus:ring-1 focus:ring-rose-500 outline-none resize-none"
                  />
               </div>

               {/* Priority Selector */}
               <div className="space-y-2">
                  <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                     <Flag className="h-3 w-3" />
                     {t('maintenance_priority')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                     {[
                        { id: 'low', label: t('priority_low'), color: 'border-blue-200 text-blue-500 bg-blue-50/50' },
                        { id: 'medium', label: t('priority_medium'), color: 'border-amber-200 text-amber-500 bg-amber-50/50' },
                        { id: 'high', label: t('priority_high'), color: 'border-rose-200 text-rose-500 bg-rose-50/50' }
                     ].map(p => (
                       <button
                         key={p.id}
                         type="button"
                         onClick={() => setPriority(p.id as any)}
                         className={`h-10 border text-[9px] font-black uppercase tracking-widest transition-all ${
                            priority === p.id ? `${p.color} ring-1 ring-current` : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50'
                         }`}
                       >
                         {p.label}
                       </button>
                     ))}
                  </div>
               </div>

               {/* Actions */}
               <div className="flex items-center gap-3 pt-4">
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={onClose}
                    className="flex-1 h-12 rounded-none text-[10px] font-black uppercase tracking-widest"
                  >
                    {t('cancel')}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 rounded-none bg-rose-500 hover:bg-rose-600 text-white border-none text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20"
                  >
                    {loading ? t('submitting') : t('flag_system_issue')}
                  </Button>
               </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
