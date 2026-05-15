'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, Info, AlertTriangle, Zap, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { useUserStore } from '@/lib/user-store';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  type: 'info' | 'warning' | 'success' | 'alert';
  read: boolean;
}

interface NotificationDropdownProps {
  onTabChange: (tab: any) => void;
}

export const NotificationDropdown = ({ onTabChange }: NotificationDropdownProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useUserStore();

  useEffect(() => {
    if (!currentUser) return;

    let q;
    if (currentUser.role === 'admin') {
      q = query(
        collection(db, 'notifications'),
        where('companyId', 'in', ['admin', 'all']),
        limit(100)
      );
    } else {
      if (!currentUser.companyId) return;
      q = query(
        collection(db, 'notifications'),
        where('companyId', '==', currentUser.companyId),
        limit(100)
      );
    }

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
        docs = docs.filter(n => (n as any).branchId === currentUser.branchId || (n as any).branchId === 'all');
      }

      setNotifications(docs.slice(0, 20));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.id, currentUser?.companyId, currentUser?.branchId, currentUser?.role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => 
        updateDoc(doc(db, 'notifications', n.id), { read: true })
      ));
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  const removeNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error('Failed to remove notification:', error);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    // 1. Mark as read
    if (!n.read) {
      try {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }

    // 2. Navigate based on content
    const title = n.title.toLowerCase();
    if (title.includes('issue') || title.includes('discrepancy')) {
      onTabChange('issues');
    } else if (title.includes('staff')) {
      onTabChange('staff');
    } else if (title.includes('campaign') || title.includes('promotion')) {
      onTabChange('promotions');
    } else {
      // Default to activity log if generic
      onTabChange('activity');
    }

    // 3. Close dropdown
    setIsOpen(false);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Zap className="h-4 w-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'alert': return <Info className="h-4 w-4 text-rose-500" />;
      default: return <MessageSquare className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 flex items-center justify-center rounded-xl text-[#637381] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-all group"
      >
        <Bell className="h-5 w-5 group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-[#FB5050] border-2 border-white dark:border-[#1C2434] animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed lg:absolute inset-x-4 lg:inset-x-auto lg:right-0 top-20 lg:top-full mt-2 w-auto lg:w-96 bg-white dark:bg-[#1C2434] rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-slate-800 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#111928] dark:text-white">{t('notifications')}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#5750F1] text-[10px] font-black text-white">
                    {t('new_count').replace('{count}', unreadCount.toString())}
                  </span>
                </div>
                <button 
                  onClick={markAllRead}
                  className="text-[10px] font-bold text-[#5750F1] uppercase tracking-widest hover:underline"
                >
                  {t('mark_all_read')}
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-[#5750F1]" />
                    <p className="text-[10px] font-bold text-[#637381] dark:text-slate-500 uppercase tracking-widest">Listening for events...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        className={`p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group ${!n.read ? 'bg-blue-50/5 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          n.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/10' : 
                          n.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10' : 
                          n.type === 'alert' ? 'bg-rose-50 dark:bg-rose-900/10' : 'bg-blue-50 dark:bg-blue-900/10'
                        }`}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-[#111928] dark:text-white truncate">{n.title}</p>
                            <span className="text-[10px] font-bold text-[#637381] dark:text-slate-500 uppercase whitespace-nowrap">{formatTime(n.createdAt)}</span>
                          </div>
                          <p className="text-xs text-[#637381] dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(n.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-[#FB5050] transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
                      <Bell className="h-8 w-8 text-slate-200 dark:text-slate-700" />
                    </div>
                    <p className="text-sm font-bold text-[#637381] dark:text-slate-500">All caught up!</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => {
                  onTabChange('activity');
                  setIsOpen(false);
                }}
                className="w-full py-4 border-t border-[#E2E8F0] dark:border-slate-800 text-[10px] font-black text-[#637381] dark:text-slate-500 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-[#5750F1] transition-all"
              >
                View All Activity
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
