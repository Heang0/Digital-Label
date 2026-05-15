'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, 
  Battery, 
  RefreshCw, 
  Zap, 
  ZapOff,
  Trash2,
  Terminal, 
  Search,
  Plus,
  Box,
  Maximize2,
  AlertCircle,
  ScanLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DigitalLabel } from '@/hooks/useStaffDashboard';
import { Tag } from 'lucide-react';
import { User } from '@/lib/user-store';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { BarcodeScannerModal } from '@/components/ui/BarcodeScannerModal';

interface StaffLabelsTabProps {
  labels: DigitalLabel[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSyncAllLabels: () => void;
  handleDeleteLabel: (id: string) => void;
  handleUnlinkProductFromLabel: (id: string) => void;
  handleSyncLabel: (id: string) => void;
  openLabelNotice: (title: string, message: string, tone?: any) => void;
  openLabelConfirm: (title: string, message: string, onConfirm: () => void) => void;
  isRefreshing?: boolean;
  onReportIssue: (labelId: string) => void;
  onOpenDiscount?: (label: DigitalLabel) => void;
  currentUser?: User;
}

export const StaffLabelsTab = ({
  labels,
  searchTerm,
  setSearchTerm,
  handleSyncAllLabels,
  handleDeleteLabel,
  handleUnlinkProductFromLabel,
  handleSyncLabel,
  openLabelNotice,
  openLabelConfirm,
  isRefreshing,
  onReportIssue,
  onOpenDiscount,
  currentUser
}: StaffLabelsTabProps) => {
  const { t } = useLanguage();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const sortedLabels = useMemo(() => {
    return [...labels].sort((a, b) => {
      const idA = (a.labelId || '').toLowerCase();
      const idB = (b.labelId || '').toLowerCase();
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [labels]);

  const filteredLabels = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return sortedLabels.filter(l => {
      return (
        (l.labelId || '').toLowerCase().includes(term) ||
        (l.productName || '').toLowerCase().includes(term) ||
        (l.productSku || '').toLowerCase().includes(term) ||
        (l.productCode || '').toLowerCase().includes(term) ||
        (l.location || '').toLowerCase().includes(term)
      );
    });
  }, [sortedLabels, searchTerm]);

  return (
    <div className="space-y-8 pb-20">
      {/* Labels Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <Terminal className="h-4 w-4 text-[#5750F1]" />
              <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.2em]">{t('active_control_system')}</span>
           </div>
           <h2 className="text-2xl font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('digital_labels')}</h2>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => {
              openLabelConfirm(
                t('sync_branch_fleet'),
                t('sync_branch_fleet_desc'),
                () => handleSyncAllLabels()
              );
            }}
            className="bg-[#10B981] hover:bg-[#059669] text-white rounded-none h-12 px-6 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 gap-2 border-none"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('sync_fleet')}
          </Button>
        </div>
      </div>

      {/* Industrial Toolbar */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#5750F1] transition-colors" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search_tags_placeholder')}
            className="pl-12 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold"
          />
          <Button 
            onClick={() => setIsScannerOpen(true)}
            variant="outline"
            className="absolute right-0 top-0 h-12 w-12 p-0 rounded-none border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#5750F1] hover:bg-[#5750F1] hover:text-white transition-colors"
            title={t('scan_barcode')}
          >
            <ScanLine className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tag Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredLabels.map((label) => (
          <motion.div 
            key={label.id}
            layout
            className={`group relative bg-white dark:bg-[#1C2434] border ${label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice ? 'border-rose-500 shadow-rose-500/10' : 'border-slate-100 dark:border-slate-800'} rounded-none overflow-hidden shadow-sm hover:shadow-xl transition-all`}
          >
            {/* SALE Badge Overlay */}
            {label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice && (
              <div className="absolute top-0 right-0 z-10">
                <div className="bg-rose-500 text-white text-[8px] font-black px-2 py-1 uppercase tracking-tighter">
                   {t('promo_active')}
                </div>
              </div>
            )}

            {/* Tag Header */}
            <div className={`p-4 border-b ${label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice ? 'border-rose-100 dark:border-rose-900/30' : 'border-slate-50 dark:border-slate-800/50'} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${label.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : label.status === 'syncing' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`} />
                <span className={`text-[10px] font-black ${label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice ? 'text-rose-600' : 'text-[#111928] dark:text-white'} uppercase tracking-tighter`}>{label.labelId}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                   <Battery className={`h-3 w-3 ${label.battery < 20 ? 'text-rose-500' : 'text-slate-400'}`} />
                   <span className="text-[9px] font-bold text-slate-500">{label.battery}%</span>
                </div>
                <Wifi className="h-3 w-3 text-slate-400" />
              </div>
            </div>

            {/* Tag Content */}
            <div className="p-5 space-y-4">
              {label.productId ? (
                <div className="min-h-[60px]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-[9px] font-black ${label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice ? 'text-rose-500' : 'text-[#5750F1]'} uppercase tracking-widest mb-1`}>{t('assigned_product')}</p>
                      <h4 className="text-sm font-black text-[#111928] dark:text-white line-clamp-2 group-hover:text-[#5750F1] transition-colors">{label.productName}</h4>
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className={`text-xl font-black ${label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice ? 'text-rose-600' : 'text-[#111928] dark:text-white'} tracking-tighter`}>
                      ${label.finalPrice || label.currentPrice}
                    </span>
                    {label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice && (
                      <span className="text-[10px] font-bold text-slate-400 line-through">${label.currentPrice}</span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400">USD</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 group-hover:border-[#5750F1]/20 transition-all">
                  <Plus className="h-5 w-5 text-slate-300 mb-2 group-hover:text-[#5750F1] transition-colors" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#5750F1]/60">{t('unlinked_node')}</span>
                </div>
              )}

              {/* Integrated Hardware Toolbar - ALWAYS VISIBLE */}
              <div className={`pt-4 border-t ${label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice ? 'border-rose-100 dark:border-rose-900/30' : 'border-slate-50 dark:border-slate-800/50'} flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-1.5 min-w-0">
                   <Box className="h-3 w-3 text-slate-400 shrink-0" />
                   <span className="text-[9px] font-black text-[#637381] dark:text-slate-500 uppercase truncate">{label.location || 'Unplaced'}</span>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <a 
                    href={`/label/${label.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-[#5750F1] hover:bg-[#5750F1] hover:text-white transition-all border border-indigo-100 dark:border-indigo-800"
                    title="View Live Display"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </a>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSyncLabel(label.id); }}
                    className="h-8 w-8 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100 dark:border-emerald-800"
                    title="Manual Sync"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  {label.productId && onOpenDiscount && currentUser?.permissions?.canChangePrices && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onOpenDiscount(label); }}
                      className="h-8 w-8 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-[#5750F1] hover:bg-[#5750F1] hover:text-white transition-all border border-indigo-100 dark:border-indigo-800"
                      title={t('adjust_pricing')}
                    >
                      <Tag className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {label.productId && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openLabelConfirm(t('unlink_product'), `${t('unlink_product_confirm')} ${label.labelId}?`, () => handleUnlinkProductFromLabel(label.id)); }}
                      className="h-8 w-8 flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-500 hover:text-white transition-all border border-amber-100 dark:border-amber-800"
                      title={t('unlink_product')}
                    >
                      <ZapOff className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {!label.productId && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openLabelConfirm('Delete Tag', `Permanently remove hardware node ${label.labelId} from the system?`, () => handleDeleteLabel(label.id)); }}
                      className="h-8 w-8 flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 dark:border-rose-800"
                      title="Remove Tag"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-[#5750F1]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredLabels.length === 0 && (
        <div className="py-20 bg-white dark:bg-[#1C2434] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
           <AlertCircle className="h-12 w-12 text-slate-100 dark:text-slate-800 mb-4" />
           <p className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">No labels detected</p>
           <p className="text-xs font-medium text-slate-400 mt-1">Try adjusting your search or filters.</p>
        </div>
      )}

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(decodedText) => {
          setSearchTerm(decodedText);
        }}
      />
    </div>
  );
};
