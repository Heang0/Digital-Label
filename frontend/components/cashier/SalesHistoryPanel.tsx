'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  collection,
  deleteDoc,
  doc as fsDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type Branch = { id: string; name: string };

function fmtMoney(n: number) {
  if (!Number.isFinite(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
}

export default function SalesHistoryPanel(props: {
  companyId: string;
  branches: Branch[];
  initialBranchId?: string;
  canClear: boolean;
  isVendor?: boolean;
}) {
  const { companyId, branches, initialBranchId, canClear, isVendor = true } = props;
  const { t } = useLanguage();

  const [branchId, setBranchId] = useState<string>(initialBranchId || (branches[0]?.id ?? ''));
  const [mode, setMode] = useState<'today' | 'all' | 'date'>('today');
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  });
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<any[]>([]);

  const range = useMemo(() => {
    if (mode === 'all') return null;
    const ds = mode === 'today' ? (() => {
      const d = new Date();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${mm}-${dd}`;
    })() : date;
    const [y, m, d] = ds.split('-').map((x) => Number(x));
    const start = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
    const end = new Date(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0, 0);
    return { start: Timestamp.fromDate(start), end: Timestamp.fromDate(end) };
  }, [mode, date]);

  const fetchSales = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const qy = query(
        collection(db, 'companies', companyId, 'sales'),
        orderBy('createdAt', 'desc'),
        limit(600)
      );
      const snap = await getDocs(qy);
      const raw = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const filtered = raw
        .filter((s) => (branchId ? s.branchId === branchId : true))
        .filter((s) => {
          if (!range) return true;
          const ts: Timestamp | undefined = s.createdAt;
          if (!ts) return false;
          return ts.toMillis() >= range.start.toMillis() && ts.toMillis() < range.end.toMillis();
        })
        .slice(0, 120);
      setSales(filtered);
    } catch (e) {
      console.error('Error fetching vendor sales:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, branchId, mode, date]);

  const clearSales = async () => {
    if (!canClear) return;
    if (!confirm(t('clear_sales_confirm') || 'Clear sales history for the selected filter? This cannot be undone.')) return;

    try {
      setLoading(true);
      const qy = query(
        collection(db, 'companies', companyId, 'sales'),
        orderBy('createdAt', 'desc'),
        limit(1200)
      );
      const snap = await getDocs(qy);
      const raw = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const toDelete = raw
        .filter((s) => (branchId ? s.branchId === branchId : true))
        .filter((s) => {
          if (!range) return true;
          const ts: Timestamp | undefined = s.createdAt;
          if (!ts) return false;
          return ts.toMillis() >= range.start.toMillis() && ts.toMillis() < range.end.toMillis();
        })
        .slice(0, 500);

      for (const s of toDelete) {
        await deleteDoc(fsDoc(db, 'companies', companyId, 'sales', s.id));
      }
      await fetchSales();
    } catch (e) {
      console.error('Error clearing vendor sales:', e);
      alert(t('clear_sales_failed') || 'Failed to clear sales history.');
    } finally {
      setLoading(false);
    }
  };

  const branchName = branches.find((b) => b.id === branchId)?.name;

  return (
    <div className="bg-white dark:bg-[#1C2434] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('sales_history')}</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">{t('sales_history_desc')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="dark:border-slate-800 dark:hover:bg-slate-800" onClick={fetchSales} disabled={loading}>{t('refresh')}</Button>
            {canClear && (
              <Button variant="outline" className="dark:border-slate-800 dark:hover:bg-slate-800" onClick={clearSales} disabled={loading}>{t('clear')}</Button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-1">
            <label className="text-xs font-medium text-gray-600 dark:text-slate-400">{t('branch')}</label>
            <select
              className={`mt-1 w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-[#111928] text-gray-900 dark:text-white ${!isVendor ? 'opacity-50 cursor-not-allowed' : ''}`}
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={!isVendor}
            >
              {!isVendor ? (
                <option value={branchId}>{branches.find(b => b.id === branchId)?.name || t('my_branch') || 'My Branch'}</option>
              ) : (
                <>
                  <option value="">{t('all_branches') || 'All Branches'}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </>
              )}
            </select>
            {branchName && <p className="mt-1 text-xs text-gray-500 dark:text-slate-500 truncate">{branchName}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-600 dark:text-slate-400">{t('range')}</label>
            <div className="mt-1 flex flex-wrap gap-2">
              <Button variant={mode === 'today' ? 'default' : 'outline'} className={mode !== 'today' ? 'dark:border-slate-800 dark:hover:bg-slate-800' : ''} onClick={() => setMode('today')} type="button">{t('today')}</Button>
              <Button variant={mode === 'all' ? 'default' : 'outline'} className={mode !== 'all' ? 'dark:border-slate-800 dark:hover:bg-slate-800' : ''} onClick={() => setMode('all')} type="button">{t('all')}</Button>
              <Button variant={mode === 'date' ? 'default' : 'outline'} className={mode !== 'date' ? 'dark:border-slate-800 dark:hover:bg-slate-800' : ''} onClick={() => setMode('date')} type="button">{t('pick_date')}</Button>
              {mode === 'date' && (
                <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="w-auto dark:bg-[#111928] dark:border-slate-800 dark:text-white" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <th className="py-4 pr-3">{t('receipt')}</th>
              <th className="py-4 pr-3">{t('date')}</th>
              <th className="py-4 pr-3">{t('staff')}</th>
              <th className="py-4 pr-3">{t('total')}</th>
              <th className="py-4">{t('items')}</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => {
              const dt = s.createdAt?.toDate ? s.createdAt.toDate() : null;
              return (
                <tr key={s.id} className="border-t border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="py-4 pr-3 font-medium text-gray-900 dark:text-white">{s.receiptNo || s.id}</td>
                  <td className="py-4 pr-3 text-gray-700 dark:text-slate-300">{dt ? dt.toLocaleString() : '-'}</td>
                  <td className="py-4 pr-3 text-gray-700 dark:text-slate-300">{s.staffName || s.staffEmail || '-'}</td>
                  <td className="py-4 pr-3 font-semibold text-gray-900 dark:text-white">{fmtMoney(Number(s.total || 0))}</td>
                  <td className="py-4 text-gray-700 dark:text-slate-300">{Array.isArray(s.items) ? s.items.reduce((n: number, i: any) => n + Number(i.qty || 0), 0) : '-'}</td>
                </tr>
              );
            })}
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-500 dark:text-slate-500">{t('no_sales_found')}</td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && <div className="py-6 text-sm text-gray-500 dark:text-slate-500">{t('loading')}</div>}
      </div>
    </div>
  );
}
