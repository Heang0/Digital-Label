'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { money, SaleRecord } from './types';

interface SalesHistoryTableProps {
  sales: SaleRecord[];
  salesLoading: boolean;
  historyMode: 'today' | 'date' | 'all';
  setHistoryMode: (mode: 'today' | 'date' | 'all') => void;
  historyDate: string;
  setHistoryDate: (date: string) => void;
  fetchSales: () => void;
  canManageSales: boolean;
  clearSalesHistory: () => void;
}

export function SalesHistoryTable({
  sales,
  salesLoading,
  historyMode,
  setHistoryMode,
  historyDate,
  setHistoryDate,
  fetchSales,
  canManageSales,
  clearSalesHistory,
}: SalesHistoryTableProps) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">ប្រវត្តិលក់ (Sales history)</h3>
          <p className="text-sm text-gray-600">ពិនិត្យមើលការលក់សម្រាប់ថ្ងៃនេះ ឬថ្ងៃមុនៗ។</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="h-9 rounded-xl border bg-white px-3 text-sm"
            value={historyMode}
            onChange={(e) => setHistoryMode(e.target.value as any)}
          >
            <option value="today">ថ្ងៃនេះ (Today)</option>
            <option value="date">រើសថ្ងៃ (Pick date)</option>
            <option value="all">ទាំងអស់ (All)</option>
          </select>

          {historyMode === 'date' && (
            <Input
              type="date"
              value={historyDate}
              onChange={(e) => setHistoryDate(e.target.value)}
              className="h-9"
            />
          )}

          <Button variant="outline" onClick={fetchSales} disabled={salesLoading}>
            Refresh
          </Button>

          {canManageSales && (
            <Button variant="outline" onClick={clearSalesHistory} disabled={salesLoading}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block mt-4 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wider text-gray-500 border-b">
              <th className="py-3 pr-4">ម៉ោង (Time)</th>
              <th className="py-3 pr-4 text-center hidden md:table-cell">ចំនួន (Items)</th>
              <th className="py-3 pr-4 hidden md:table-cell">សរុប (Sub)</th>
              <th className="py-3 pr-4 hidden md:table-cell">បញ្ចុះតម្លៃ (Disc)</th>
              <th className="py-3 pr-4">សរុប (Total)</th>
              <th className="py-3 hidden md:table-cell">បុគ្គលិក (Staff)</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => {
              const ts: any = s.createdAt;
              const d = ts?.toDate ? ts.toDate() : null;
              const time = d ? d.toLocaleString() : '—';
              const items = Array.isArray(s.items) ? s.items.reduce((n: number, it: any) => n + Number(it.qty || 0), 0) : 0;
              return (
                <tr key={s.id} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 text-sm text-gray-700 whitespace-nowrap">{time}</td>
                  <td className="py-3 pr-4 text-sm text-gray-700 hidden md:table-cell text-center">{items}</td>
                  <td className="py-3 pr-4 text-sm font-semibold text-gray-900 hidden md:table-cell">{money(Number(s.subtotal || 0))}</td>
                  <td className="py-3 pr-4 text-sm text-emerald-700 hidden md:table-cell">-{money(Number(s.discountTotal || 0))}</td>
                  <td className="py-3 pr-4 text-sm font-bold text-gray-900">{money(Number(s.total || 0))}</td>
                  <td className="py-3 text-sm text-gray-700 hidden md:table-cell">{s.staffName || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden mt-4 space-y-3">
        {sales.map((s) => {
          const ts: any = s.createdAt;
          const d = ts?.toDate ? ts.toDate() : null;
          const time = d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
          const items = Array.isArray(s.items) ? s.items.reduce((n: number, it: any) => n + Number(it.qty || 0), 0) : 0;
          return (
            <div key={s.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-black text-gray-900">{time}</div>
                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{items} items · {s.staffName?.split(' ')[0]}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-gray-900">{money(Number(s.total || 0))}</div>
                {Number(s.discountTotal || 0) > 0 && (
                  <div className="text-[10px] text-emerald-600 font-bold">-{money(Number(s.discountTotal || 0))}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {salesLoading && (
        <div className="py-12 text-center text-gray-500">កំពុងទាញយកទិន្នន័យ...</div>
      )}
      {!salesLoading && sales.length === 0 && (
        <div className="py-12 text-center text-gray-500">មិនមានប្រវត្តិលក់ទេ។</div>
      )}
    </div>
  );
}
