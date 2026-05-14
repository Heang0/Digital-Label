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
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DigitalLabel, Branch } from '@/types/vendor';

 interface LabelsTabProps {
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
            <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.25em]">Active Control System</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#111928] dark:text-white uppercase tracking-tight leading-none">Digital Labels</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {branches.length > 1 && (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 pl-4 shadow-sm min-w-[200px]">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 dark:border-slate-800 pr-3">Fleet</span>
               <select 
                  className="flex-1 bg-transparent text-xs font-black outline-none border-none pr-6 py-1 cursor-pointer appearance-none"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
               >
                  <option value="all">Global Network</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
               </select>
               <ChevronDown className="h-3 w-3 text-slate-400 -ml-5 pointer-events-none" />
            </div>
          )}

          <Button 
            onClick={() => {
              if (selectedBranchId === 'all') {
                openLabelNotice('Action Required', 'Please select a specific branch to update.', 'info');
                return;
              }
              openLabelConfirm(
                'Sync Global Fleet',
                'This will update all physical price tags in this store. Continue?',
                () => handleSyncAllLabels()
              );
            }}
            className="bg-[#10B981] hover:bg-[#059669] text-white rounded-none h-11 px-6 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 gap-2 border-none transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync Fleet
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
              placeholder="Search tags by ID, product, or shelf..."
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
              className="flex-1 h-12 bg-[#5750F1] hover:bg-[#4A44D1] text-white rounded-none border-none text-[10px] font-black uppercase tracking-widest px-6 transition-all"
            >
              Add Dynamic Tags
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
              className="flex-1 h-12 rounded-none border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-[#5750F1] gap-2 hover:bg-[#5750F1] hover:text-white transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Manual Node
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
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
               <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[#5750F1]">
                  <Terminal className="h-4 w-4" />
               </div>
               <div>
                  <h3 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">Manual Node Provisioning</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Store: {branches.find(b => b.id === selectedBranchId)?.name}</p>
               </div>
            </div>

            <form onSubmit={handleManualProvision} className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tag ID Code</label>
                  <Input 
                    required
                    value={manualLabelData.labelId}
                    onChange={(e) => setManualLabelData({ ...manualLabelData, labelId: e.target.value.toUpperCase() })}
                    placeholder="DL-001"
                    className="h-11 rounded-none border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-black text-xs placeholder:opacity-50"
                  />
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Initial Placement (Optional)</label>
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
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 rounded-none h-11 bg-[#5750F1] hover:bg-[#4A44D1] text-white font-black text-[10px] uppercase tracking-widest border-none shadow-lg shadow-indigo-500/20"
                  >
                    Provision Node
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
                   Promo Active
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
                      <p className={`text-[9px] font-black ${label.finalPrice && label.currentPrice && label.finalPrice < label.currentPrice ? 'text-rose-500' : 'text-[#5750F1]'} uppercase tracking-widest mb-1`}>Assigned Product</p>
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
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#5750F1]/60">Unlinked Node</span>
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
                      onClick={(e) => { e.stopPropagation(); openLabelConfirm('Unlink Product', `Are you sure you want to remove the product from tag ${label.labelId}?`, () => handleUnlinkProductFromLabel(label.id)); }}
                      className="h-7 w-7 flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-500 hover:text-white transition-all border border-amber-100 dark:border-amber-800"
                      title="Unlink Product"
                    >
                      <ZapOff className="h-3 w-3" />
                    </button>
                  )}
                  {label.productId && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setActiveDiscountModal({
                          labelId: label.id,
                          productId: label.productId!,
                          branchId: label.branchId,
                          currentPercent: label.discountPercent || 0
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
          <h3 className="text-xl font-black text-[#111928] dark:text-white uppercase">No Nodes Detected</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-xs">Change your filters or click 'Add Tags' to provision new hardware labels.</p>
        </div>
      )}
    </div>
  );
};
