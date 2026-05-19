import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AuditLog } from '@/types';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  User, 
  ShieldCheck, 
  AlertTriangle,
  Clock,
  Info,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export const AdminAudit = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Establish dynamic real-time Firestore synchronization
  useEffect(() => {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
      
      setLogs(liveLogs);
      setLoading(false);
    }, (error) => {
      console.error('Failed to stream audit logs:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Classify log aesthetics dynamically based on database action content
  const getLogClassification = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add') || act.includes('provision') || act.includes('save') || act.includes('register')) {
      return { type: 'success', color: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400', icon: CheckCircle };
    }
    if (act.includes('delete') || act.includes('remove') || act.includes('suspend') || act.includes('fail') || act.includes('unauthorized')) {
      return { type: 'error', color: 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400', icon: AlertTriangle };
    }
    if (act.includes('update') || act.includes('edit') || act.includes('modify') || act.includes('change')) {
      return { type: 'info', color: 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400', icon: Info };
    }
    return { type: 'warning', color: 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400', icon: ShieldCheck };
  };

  // 3. Smart date formatting helper
  const formatLogDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'Recent';
    }
  };

  // 4. Client-side instant query filtering
  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.userName?.toLowerCase().includes(term) ||
      log.details?.toLowerCase().includes(term) ||
      log.targetType?.toLowerCase().includes(term)
    );
  });

  // 5. Dynamic CSV log exporter
  const handleExport = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Action', 'User', 'Details', 'Target Type', 'Target ID', 'Timestamp'];
    const data = filteredLogs.map(l => [
      l.action,
      l.userName,
      l.details?.replace(/,/g, ';') || '',
      l.targetType || 'system',
      l.targetId || 'N/A',
      l.timestamp ? ((l.timestamp as any).toDate ? (l.timestamp as any).toDate().toISOString() : new Date(l.timestamp as any).toISOString()) : ''
    ].join(','));
    
    const csvContent = [headers.join(','), ...data].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">
            {t('audit') || 'កំណត់ហេតុត្រួតពិនិត្យ'}
          </h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">
            Monitor real-time system synchronization, user actions, and hardware events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className="h-11 px-6 rounded-lg border border-[#E2E8F0] dark:border-slate-800 text-sm font-bold text-[#637381] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all gap-2 flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export Logs
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#24303F] rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search events, users, or targets..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full h-11 pl-12 pr-4 rounded-lg bg-slate-50 dark:bg-slate-900 border-none text-sm outline-none focus:ring-2 ring-[#5750F1]/20 font-medium" 
             />
           </div>
           <button className="h-11 px-4 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-[#5750F1] transition-all">
             <Filter className="h-4 w-4" />
           </button>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800 min-h-[300px] flex flex-col justify-start">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#5750F1]" />
              <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Establishing log stream...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <div className="h-14 w-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                <History className="h-7 w-7" />
              </div>
              <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                No system log records match your search criteria.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              <AnimatePresence>
                {filteredLogs.map((log, i) => {
                  const classification = getLogClassification(log.action);
                  const IconComponent = classification.icon;
                  return (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.4) }}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all border-l-4 border-transparent hover:border-l-[#5750F1]"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${classification.color}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111928] dark:text-white leading-tight">
                            {log.action}
                          </p>
                          <p className="text-xs text-[#637381] dark:text-slate-400 mt-1 font-medium">
                            Performed by <span className="font-bold text-slate-700 dark:text-slate-300">{log.userName}</span> 
                            {log.targetType && (
                              <>
                                <span> on </span>
                                <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{log.targetType}</span>
                              </>
                            )}
                          </p>
                          {log.details && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1.5 rounded border border-slate-100 dark:border-slate-800/60 inline-block font-mono max-w-xl break-words">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 self-end sm:self-center">
                        <Clock className="h-3.5 w-3.5" />
                        {formatLogDate(log.timestamp)}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

