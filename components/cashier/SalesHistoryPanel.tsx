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
}) {
  const { companyId, branches, initialBranchId, canClear } = props;

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
    if (!confirm('Clear sales history for the selected filter? This cannot be undone.')) return;

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
      alert('Failed to clear sales history.');
    } finally {
      setLoading(false);
    }
  };

  const branchName = branches.find((b) => b.id === branchId)?.name;

  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      <div className="p-5 border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sales history</h3>
            <p className="text-sm text-gray-600">View sales by day and branch. Only vendor/manager can clear.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchSales} disabled={loading}>Refresh</Button>
            {canClear && (
              <Button variant="outline" onClick={clearSales} disabled={loading}>Clear</Button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-1">
            <label className="text-xs font-medium text-gray-600">Branch</label>
            <select
              className="mt-1 w-full border rounded-xl px-3 py-2 text-sm bg-white"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {branchName && <p className="mt-1 text-xs text-gray-500 truncate">{branchName}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-600">Range</label>
            <div className="mt-1 flex flex-wrap gap-2">
              <Button variant={mode === 'today' ? 'default' : 'outline'} onClick={() => setMode('today')} type="button">Today</Button>
              <Button variant={mode === 'all' ? 'default' : 'outline'} onClick={() => setMode('all')} type="button">All</Button>
              <Button variant={mode === 'date' ? 'default' : 'outline'} onClick={() => setMode('date')} type="button">Pick date</Button>
              {mode === 'date' && (
                <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="w-auto" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-3">Receipt</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Staff</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2">Items</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => {
              const dt = s.createdAt?.toDate ? s.createdAt.toDate() : null;
              return (
                <tr key={s.id} className="border-t">
                  <td className="py-2 pr-3 font-medium text-gray-900">{s.receiptNo || s.id}</td>
                  <td className="py-2 pr-3 text-gray-700">{dt ? dt.toLocaleString() : '-'}</td>
                  <td className="py-2 pr-3 text-gray-700">{s.staffName || s.staffEmail || '-'}</td>
                  <td className="py-2 pr-3 font-semibold text-gray-900">{fmtMoney(Number(s.total || 0))}</td>
                  <td className="py-2 text-gray-700">{Array.isArray(s.items) ? s.items.reduce((n: number, i: any) => n + Number(i.qty || 0), 0) : '-'}</td>
                </tr>
              );
            })}
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-500">No sales found.</td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && <div className="py-6 text-sm text-gray-500">Loading…</div>}
      </div>
    </div>
  );
}
