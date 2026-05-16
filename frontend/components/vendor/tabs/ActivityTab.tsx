'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Search, 
  RefreshCw, 
  Zap, 
  AlertTriangle, 
  Info, 
  MessageSquare,
  Clock,
  Filter,
  Check
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  type: 'info' | 'warning' | 'success' | 'alert';
  read: boolean;
  branchId?: string;
}

interface ActivityTabProps {
  currentUser: any;
  branches: any[];
  onTabChange: (tab: any) => void;
}

export const ActivityTab = ({ currentUser, branches, onTabChange }: ActivityTabProps) => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const handleEntryClick = (n: Notification) => {
    const title = n.title.toLowerCase();
    if (title.includes('issue') || title.includes('discrepancy')) {
      onTabChange('issues');
    } else if (title.includes('staff')) {
      onTabChange('staff');
    } else if (title.includes('campaign') || title.includes('promotion')) {
      onTabChange('promotions');
    } else if (title.includes('branch')) {
      onTabChange('branches');
    } else if (title.includes('product')) {
      onTabChange('products');
    }
  };

  useEffect(() => {
    if (!currentUser?.companyId) return;

    // Minimalist query to avoid ANY composite index requirements
    const q = query(
      collection(db, 'notifications'),
      where('companyId', '==', currentUser.companyId),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];

      // Sort by date on client side
      docs.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      // Manual filtering for staff to avoid index error
      if (currentUser.role === 'staff' && currentUser.branchId) {
        docs = docs.filter(n => n.branchId === currentUser.branchId || n.branchId === 'all');
      }

      setNotifications(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         n.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || n.type === filterType;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Zap className="h-5 w-5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'alert': return <Info className="h-5 w-5 text-rose-500" />;
      default: return <MessageSquare className="h-5 w-5 text-[#5750F1]" />;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#5750F1] animate-pulse" />
            <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.25em]">{t('audit_intelligence')}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('activity_log')}</h2>
        </div>
      </div>

      {/* Industrial Filter Toolbar */}
      <div className="bg-white dark:bg-[#1C2434] p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
           <div className="lg:col-span-5 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#5750F1]" />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('search_activity_placeholder')}
                className="pl-12 h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold"
              />
           </div>

           <div className="lg:col-span-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4">
              <Filter className="h-4 w-4 text-slate-400" />
              <select 
                className="bg-transparent border-none text-xs font-bold text-[#111928] dark:text-white outline-none cursor-pointer [&>option]:bg-white [&>option]:text-[#111928] dark:[&>option]:bg-[#1C2434] dark:[&>option]:text-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                 <option value="all">{t('all_events')}</option>
                 <option value="success">{t('success_event')}</option>
                 <option value="warning">{t('warnings_event')}</option>
                 <option value="alert">{t('alerts_event')}</option>
                 <option value="info">{t('system_info')}</option>
              </select>
           </div>

           <div className="lg:col-span-3">
              <Button className="w-full h-12 rounded-none bg-[#5750F1] hover:bg-[#4A44D1] text-white font-black text-[10px] uppercase tracking-widest gap-2">
                 <RefreshCw className="h-4 w-4" />
                 {t('refresh_logs')}
              </Button>
           </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
         {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-[#5750F1]" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('reconstructing_audit')}</p>
           </div>
         ) : filteredNotifications.length > 0 ? (
           <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNotifications.map((n, i) => (
                <motion.div 
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleEntryClick(n)}
                  className="p-6 flex flex-col sm:flex-row sm:items-center gap-6 group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer"
                >
                   <div className={`h-12 w-12 shrink-0 rounded-none flex items-center justify-center border shadow-sm ${
                      n.type === 'success' ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' :
                      n.type === 'warning' ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30' :
                      n.type === 'alert' ? 'bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30' :
                      'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30'
                   }`}>
                      {getIcon(n.type)}
                   </div>

                   <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                         <h4 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">{n.title}</h4>
                         {n.branchId && (
                           <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                              {n.branchId === 'all' ? t('global') : branches.find(b => b.id === n.branchId)?.name || t('branch')}
                           </span>
                         )}
                         {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-[#5750F1]" />}
                      </div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                   </div>

                   <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest sm:text-right">
                      <div className="flex items-center gap-2">
                         <Clock className="h-3 w-3" />
                         {n.createdAt?.toDate().toLocaleString()}
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>
         ) : (
           <div className="py-40 flex flex-col items-center justify-center text-center px-4">
              <div className="h-20 w-20 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center mb-6">
                 <Bell className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('archive_empty')}</h3>
              <p className="text-xs font-medium text-slate-400 mt-2 max-w-[240px]">{t('archive_empty_desc')}</p>
           </div>
         )}
      </div>
    </div>
  );
};
