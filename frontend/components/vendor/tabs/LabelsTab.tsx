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
  ChevronDown, 
  Terminal, 
  Search,
  Plus,
  Box,
  LayoutGrid,
  Maximize2,
  Percent,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DigitalLabel, Branch } from '@/types/vendor';
import { useLanguage } from '@/lib/i18n/LanguageContext';

  interface LabelsTabProps {
  currentUser: any;
  labels: DigitalLabel[];
  branches: Branch[];
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSyncAllLabels: () => void;
  handleDeleteLabel: (id: string) => void;
  handleUnlinkProductFromLabel: (id: string) => void;
  setAssignProductModal: (modal: any) => void;
  setActiveDiscountModal: (modal: any) => void;
  openLabelNotice: (title: string, message: string, tone?: any) => void;
  setSelectedLabel: (label: any) => void;
  isRefreshing?: boolean;
  showProvisionModal: boolean;
  setShowProvisionModal: (show: boolean) => void;
  setShowSmartMapModal: (show: boolean) => void;
  unsetLabelsCount: number;
  bulkAutoMapLocations: (branchId: string, prefix: string) => void;
  handleBulkProvision: (branchId: string, count: number) => Promise<void>;
  provisionLabel: (data: { labelId: string; location: string; branchId: string }) => Promise<void>;
  openLabelConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const LabelsTab = ({
  currentUser,
  labels,
  branches,
  selectedBranchId,
  setSelectedBranchId,
  searchTerm,
  setSearchTerm,
  handleSyncAllLabels,
  handleDeleteLabel,
  handleUnlinkProductFromLabel,
  setAssignProductModal,
  setActiveDiscountModal,
  openLabelNotice,
  setSelectedLabel,
  isRefreshing,
  showProvisionModal,
  setShowProvisionModal,
  setShowSmartMapModal,
  unsetLabelsCount,
  bulkAutoMapLocations,
  handleBulkProvision,
  provisionLabel,
  openLabelConfirm,
}: LabelsTabProps) => {
  const { t } = useLanguage();
  const [provisionCount, setProvisionCount] = useState(1);
  const [showManualProvision, setShowManualProvision] = useState(false);
  const [manualLabelData, setManualLabelData] = useState({ labelId: '', location: '' });

  const filteredLabels = useMemo(() => {
    return [...labels].sort((a, b) => {
      const idA = a.labelId || '';
      const idB = b.labelId || '';
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [labels]);

  const handleManualProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId || selectedBranchId === 'all') {
      openLabelNotice('Branch Required', 'Please select a branch first.', 'error');
      return;
    }
    if (!manualLabelData.labelId) {
      openLabelNotice('ID Required', 'Please enter a Tag ID (e.g., DL-001).', 'error');
      return;
    }
    await provisionLabel({
      ...manualLabelData,
      branchId: selectedBranchId
    });
    setShowManualProvision(false);
    setManualLabelData({ labelId: '', location: '' });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Labels Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#5750F1] animate-pulse" />
            <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.25em]">{t('active_control_system')}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#111928] dark:text-white uppercase tracking-tight leading-none">{t('label_mgmt')}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {branches.length > 1 && currentUser?.role === 'vendor' && (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 pl-4 shadow-sm min-w-[200px]">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 dark:border-slate-800 pr-3">{t('fleet')}</span>
               <select 
                   className="bg-transparent border-none text-sm font-bold text-[#111928] dark:text-white outline-none cursor-pointer [&>option]:bg-white [&>option]:text-[#111928] dark:[&>option]:bg-[#1C2434] dark:[&>option]:text-white"
                   value={selectedBranchId}
                   onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  <option value="all">{t('global_network')}</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
               </select>
               <ChevronDown className="h-3 w-3 text-slate-400 -ml-5 pointer-events-none" />
            </div>
          )}

          <Button 
            onClick={() => {
              if (selectedBranchId === 'all') {
                openLabelNotice(t('action_required'), t('select_branch_first'), 'info');
                return;
              }
              openLabelConfirm(
                t('sync_fleet'),
                t('sync_confirm'),
                () => handleSyncAllLabels()
              );
            }}
            className="bg-[#10B981] hover:bg-[#059669] text-white rounded-lg h-11 px-6 text-sm font-bold shadow-lg shadow-emerald-500/20 gap-2 border-none transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('sync_fleet')}
          </Button>
        </div>
      </div>

      {/* Industrial Toolbar */}
      <div className="bg-white dark:bg-[#1C2434] p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
          {/* Search Section */}
          <div className="xl:col-span-5 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#5750F1] transition-colors" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search_tags_placeholder')}
              className="pl-12 h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold transition-all focus:ring-1 focus:ring-[#5750F1]"
            />
          </div>

          {/* Provisioning Section */}
          <div className="xl:col-span-4 flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="px-4 border-r border-slate-200 dark:border-slate-800 flex items-center gap-2">
               <Box className="h-3.5 w-3.5 text-slate-400" />
               <Input 
                type="number"
                value={provisionCount}
                onChange={(e) => setProvisionCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 h-12 border-none rounded-none text-center text-xs font-black bg-transparent focus:ring-0"
              />
            </div>
            <Button 
              onClick={async () => {
                if (selectedBranchId === 'all') {
                  openLabelNotice('Branch Required', 'Select a branch first.', 'error');
                  return;
                }
                await handleBulkProvision(selectedBranchId, provisionCount);
              }}
              className="flex-1 h-12 bg-[#5750F1] hover:bg-[#4A44D1] text-white rounded-lg border-none text-sm font-bold px-6 transition-all"
            >
              {t('add_dynamic_tags')}
            </Button>
          </div>

          {/* Action Tools Section */}
          <div className="xl:col-span-3 flex items-center gap-2">
            <Button 
              onClick={() => {
                if (selectedBranchId === 'all') {
                  openLabelNotice('Branch Required', 'Select a branch to manually add a node.', 'error');
                  return;
                }
                setShowManualProvision(true);
              }}
              variant="outline"
              className="flex-1 h-12 rounded-lg border-slate-200 dark:border-slate-800 text-sm font-bold text-[#5750F1] gap-2 hover:bg-[#5750F1] hover:text-white transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {t('manual_node')}
            </Button>

            <Button 
              onClick={() => setShowSmartMapModal(true)}
              variant="outline"
              className="h-12 w-12 flex items-center justify-center rounded-none border-slate-200 dark:border-slate-800 text-slate-400 hover:text-[#5750F1] hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-sm"
              title="Smart Architecture"
            >
              <Zap className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Manual Provision Modal */}
      {showManualProvision && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1C2434] w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
          >
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 shrink-0 bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[#5750F1]">
                     <Terminal className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                     <h3 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('manual_node_provisioning')}</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{t('store')}: {branches.find(b => b.id === selectedBranchId)?.name}</p>
                  </div>
               </div>
               <button
                 type="button"
                 onClick={() => setShowManualProvision(false)}
                 aria-label={t('cancel')}
                 title={t('cancel')}
                 className="h-9 w-9 shrink-0 flex items-center justify-center rounded-none text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
               >
                 <X className="h-4 w-4" />
               </button>
            </div>

            <form onSubmit={handleManualProvision} className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('tag_id_code')}</label>
                  <Input 
                    required
                    value={manualLabelData.labelId}
                    onChange={(e) => setManualLabelData({ ...manualLabelData, labelId: e.target.value.toUpperCase() })}
                    placeholder="DL-001"
                    className="h-11 rounded-none border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-black text-xs placeholder:opacity-50"
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('initial_placement')}</label>
                  <Input 
                    value={manualLabelData.location}
                    onChange={(e) => setManualLabelData({ ...manualLabelData, location: e.target.value })}
                    placeholder="Aisle 1, Shelf A"
                    className="h-11 rounded-none border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-xs"
                  />
               </div>

               <div className="flex items-center gap-3 pt-4">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setShowManualProvision(false)}
                    className="flex-1 rounded-none h-11 text-[10px] font-black uppercase tracking-widest"
                  >
                    {t('cancel') || 'Cancel'}
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 rounded-none h-11 bg-[#5750F1] hover:bg-[#4A44D1] text-white font-black text-[10px] uppercase tracking-widest border-none shadow-lg shadow-indigo-500/20"
                  >
                    {t('provision_node')}
                  </Button>
               </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Tag Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredLabels.map((label) => (
          <motion.div 
            key={label.id}
            layout
            className={`group relative bg-white dark:bg-[#1C2434] border ${label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice ? 'border-rose-500 shadow-rose-500/10' : 'border-slate-100 dark:border-slate-800'} rounded-none overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer`}
            onClick={() => {
              if (!label.productId) {
                setAssignProductModal({ labelId: label.id, branchId: label.branchId });
              } else {
                setSelectedLabel(label);
              }
            }}
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
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${label.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={`text-[10px] font-black ${label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice ? 'text-rose-600' : 'text-[#111928] dark:text-white'} uppercase tracking-tighter`}>{label.labelId}</span>
                </div>
                {/* Branch Badge */}
                <div className="flex items-center gap-1 opacity-60">
                   <Box className="h-2 w-2" />
                   <span className="text-[8px] font-black uppercase tracking-widest truncate max-w-[80px]">
                     {branches.find(b => b.id === label.branchId)?.name || 'Unknown Store'}
                   </span>
                </div>
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
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-[9px] font-black ${label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice ? 'text-rose-500' : 'text-[#5750F1]'} uppercase tracking-widest mb-1`}>{t('assigned_product')}</p>
                      <h4 className="text-sm font-black text-[#111928] dark:text-white line-clamp-1 group-hover:text-[#5750F1] transition-colors">{label.productName}</h4>
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-lg font-black ${label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice ? 'text-rose-600' : 'text-[#111928] dark:text-white'}`}>
                      ${label.finalPrice || label.currentPrice}
                    </span>
                    {label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice && (
                      <span className="text-[10px] font-bold text-slate-400 line-through">${label.currentPrice}</span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400">USD</span>
                  </div>
                </div>
              ) : (
                <div className="py-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 group-hover:border-[#5750F1]/20 transition-all">
                  <Plus className="h-5 w-5 text-slate-300 mb-2 group-hover:text-[#5750F1] transition-colors" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#5750F1]/60">{t('unlinked_node')}</span>
                </div>
              )}

              {/* Integrated Hardware Toolbar - ALWAYS VISIBLE */}
              <div className={`pt-4 border-t ${label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice ? 'border-rose-100 dark:border-rose-900/30' : 'border-slate-50 dark:border-slate-800/50'} flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-1.5 min-w-0">
                   <Box className="h-3 w-3 text-slate-400 shrink-0" />
                   <span className="text-[9px] font-black text-[#637381] dark:text-slate-500 uppercase truncate">{label.location || t('unplaced')}</span>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <a 
                    href={`/label/${label.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 w-7 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-[#5750F1] hover:bg-[#5750F1] hover:text-white transition-all border border-indigo-100 dark:border-indigo-800"
                    title="View Live Display"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </a>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openLabelNotice('Syncing', `Requesting real-time update for ${label.labelId}...`, 'info'); }}
                    className="h-7 w-7 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100 dark:border-emerald-800"
                    title="Manual Sync"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                  {label.productId && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openLabelConfirm(t('unlink_product'), `${t('unlink_product_confirm')} ${label.labelId}?`, () => handleUnlinkProductFromLabel(label.id)); }}
                      className="h-7 w-7 flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-500 hover:text-white transition-all border border-amber-100 dark:border-amber-800"
                      title={t('unlink_product')}
                    >
                      <ZapOff className="h-3 w-3" />
                    </button>
                  )}
                  {label.productId && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setActiveDiscountModal({
                          isOpen: true,
                          labelId: label.id,
                          productId: label.productId!,
                          productName: label.productName || 'Electronic Tag',
                          currentPrice: label.finalPrice || label.currentPrice || 0
                        });
                      }}
                      className="h-7 w-7 flex items-center justify-center bg-[#5750F1]/10 text-[#5750F1] hover:bg-[#5750F1] hover:text-white transition-all border border-indigo-100 dark:border-indigo-800"
                      title="Apply Discount"
                    >
                      <Percent className="h-3 w-3" />
                    </button>
                  )}
                  {!label.productId && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openLabelConfirm('Delete Tag', `Permanently remove hardware node ${label.labelId} from the system?`, () => handleDeleteLabel(label.id)); }}
                      className="h-7 w-7 flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 dark:border-rose-800"
                      title="Remove Tag"
                    >
                      <Trash2 className="h-3 w-3" />
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
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="h-20 w-20 bg-slate-50 dark:bg-slate-900 rounded-none flex items-center justify-center mb-6">
            <Terminal className="h-10 w-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-black text-[#111928] dark:text-white uppercase">{t('no_nodes_detected')}</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-xs">{t('no_nodes_desc')}</p>
        </div>
      )}
    </div>
  );
};
