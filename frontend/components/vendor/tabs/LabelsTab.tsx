'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Tag, Search, Filter, Wifi, Signal, Battery, RefreshCw, Trash2, PackagePlus, Settings2, Zap, ChevronDown, Package, Activity, Globe, ZapOff, ArrowRight, Bell, Terminal, MapPin, Sparkles, Plus, Rotate3d, Maximize2 } from 'lucide-react';
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
  openLabelConfirm,
}: LabelsTabProps) => {
  const [provisionCount, setProvisionCount] = useState(1);
  const sortedLabels = [...labels].sort((a, b) => {
    const idA = (a.labelCode || a.labelId || '').toLowerCase();
    const idB = (b.labelCode || b.labelId || '').toLowerCase();
    return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
  });

  const filteredLabels = sortedLabels
    .filter(l => selectedBranchId === 'all' || l.branchId === selectedBranchId)
    .filter(l => {
      const term = searchTerm.toLowerCase();
      const matchesId = (l.labelId || '').toLowerCase().includes(term);
      const matchesProduct = (l.productName || '').toLowerCase().includes(term);
      const matchesBranch = (l.branchName || '').toLowerCase().includes(term);
      const matchesSku = (l.productSku || '').toLowerCase().includes(term);
      return matchesId || matchesProduct || matchesBranch || matchesSku;
    });

  return (
    <div className="space-y-6">
      {/* Header with Stats Hub */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
         <div>
            <h2 className="text-xl md:text-2xl font-black text-[#111928] dark:text-white tracking-tight uppercase">Digital Label Command Center</h2>
            <p className="text-xs font-medium text-[#637381] dark:text-slate-400">Managing {labels.length} active hardware nodes across the network.</p>
         </div>

         <div className="flex flex-wrap items-center gap-3 md:gap-4">
            {/* Gateway Status Box */}
            <div className="flex-1 min-w-[140px] md:flex-none flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-[#1C2434] rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Gateway Node</span>
                  <span className="text-[10px] font-black text-[#111928] dark:text-white uppercase whitespace-nowrap text-ellipsis overflow-hidden">GWAY-204 ONLINE</span>
               </div>
            </div>

            {/* Latency Status Box */}
            <div className="flex-1 min-w-[140px] md:flex-none flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-[#1C2434] rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <Wifi className="h-4 w-4 text-[#5750F1]" />
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Signal Latency</span>
                  <span className="text-[10px] font-black text-[#111928] dark:text-white uppercase">14ms Average</span>
               </div>
            </div>

            <div className="w-full md:w-auto flex items-center gap-2">
               <Button className="flex-1 md:flex-none h-11 rounded-none bg-[#5750F1] hover:bg-[#4A44D1] text-[10px] font-black uppercase tracking-widest gap-2 px-6 shadow-lg shadow-indigo-500/20">
                  <Activity className="h-4 w-4" />
                  Console
               </Button>
               <Button onClick={handleSyncAllLabels} variant="outline" className="flex-1 md:flex-none h-11 rounded-none border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest px-6 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Sync
               </Button>
            </div>
         </div>
      </div>

      {/* System Pulse Log Bar */}
      <div className="bg-[#111928] rounded-none py-2 px-4 overflow-hidden border border-slate-800 shadow-lg relative">
         <div className="flex items-center gap-4 whitespace-nowrap animate-marquee">
            <div className="flex items-center gap-2 shrink-0">
               <Activity className="h-3 w-3 text-emerald-500" />
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">System Pulse</span>
            </div>
            {[
               { time: '16:03:45', msg: 'Label NODE-A29 synced successfully (v2.4.1)', color: 'text-slate-300' },
               { time: '16:03:12', msg: 'Gateway handshake successful - 204 nodes detected', color: 'text-slate-400' },
               { time: '16:02:55', msg: 'Periodic telemetry broadcast completed', color: 'text-slate-500' },
               { time: '16:01:20', msg: 'Battery optimization protocol initiated', color: 'text-slate-400' }
            ].map((log, i) => (
               <div key={i} className="flex items-center gap-2 shrink-0 border-l border-slate-800 pl-4 ml-4">
                  <span className="text-[9px] font-black text-[#5750F1]">[{log.time}]</span>
                  <span className={`text-[9px] font-bold ${log.color}`}>{log.msg}</span>
               </div>
            ))}
         </div>
      </div>

      {/* Toolbar as per Image */}
      <div className="p-4 md:p-6 bg-white dark:bg-[#1C2434] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
               <div className="flex items-center justify-between md:justify-start gap-4">
                  <span className="text-[10px] font-black text-[#637381] uppercase tracking-[0.2em] whitespace-nowrap">Target Branch</span>
                  <div className="relative">
                     <select 
                        className="appearance-none bg-transparent pr-8 text-sm font-black text-[#111928] dark:text-white outline-none cursor-pointer border-none focus:ring-0"
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                     >
                        <option value="all">Global Fleet</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                     </select>
                     <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <Input 
                     type="number" 
                     value={provisionCount}
                     onChange={(e) => setProvisionCount(parseInt(e.target.value) || 1)}
                     className="w-14 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none text-center text-xs font-black" 
                  />
                  <Button 
                     onClick={async () => {
                        if (selectedBranchId === 'all') {
                           openLabelNotice('Branch Required', 'Please select a specific branch to generate labels.', 'error');
                           return;
                        }
                        if (provisionCount > 5) { openLabelConfirm("Bulk Generation", `Are you sure you want to generate ${provisionCount} new digital labels for this branch?`, async () => { await handleBulkProvision(selectedBranchId, provisionCount); }); } else { await handleBulkProvision(selectedBranchId, provisionCount); }
                     }}
                     className="flex-1 md:flex-none h-10 px-4 md:px-6 bg-[#5750F1] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#4A44D1] transition-all rounded-none shadow-lg shadow-indigo-500/10 border-none"
                  >
                     {provisionCount > 1 ? `Generate ${provisionCount} Tags` : "Generate 1 Tag"}
                  </Button>
                  <Button 
                     onClick={async () => {
                        if (selectedBranchId !== 'all') {
                           openLabelConfirm(
                              'Auto-Map Locations',
                              'This will automatically assign shelf locations to all unplaced labels in this branch based on their ID sequence. Continue?',
                              () => bulkAutoMapLocations(selectedBranchId, 'Aisle')
                           );
                        }
                     }}
                     variant="ghost" 
                     className="h-10 px-2 md:px-4 text-[10px] font-black uppercase tracking-widest text-[#5750F1] gap-2"
                  >
                     <Zap className="h-3.5 w-3.5" />
                     <span className="hidden xs:inline">Auto-Bind</span>
                  </Button>
               </div>
            </div>

            <div className="flex items-center justify-between md:justify-start gap-4 pt-4 lg:pt-0 border-t lg:border-none border-slate-50 dark:border-slate-800/50">
               <span className="text-[10px] font-black text-[#637381] uppercase tracking-[0.2em]">Status</span>
               <div className="relative">
                  <select className="appearance-none bg-transparent pr-8 text-sm font-black text-[#111928] dark:text-white outline-none cursor-pointer border-none focus:ring-0">
                     <option>All Labels</option>
                     <option>Active</option>
                     <option>Offline</option>
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
               </div>
            </div>
         </div>
      </div>

      {/* Hyper-Modern Hardware Grid */}
      {filteredLabels.length > 0 ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredLabels.map((label, index) => (
               <motion.div
                  key={label.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ delay: index * 0.05, ease: "easeOut" }}
                  onClick={async () => {
                     if (!label.productId) {
                        setAssignProductModal({
                           labelId: label.id,
                           branchId: label.branchId || ''
                        });
                     } else {
                        setSelectedLabel(label);
                     }
                  }}
                  className={`group relative bg-[#F8FAFC] dark:bg-[#0F172A] rounded-none border ${label.discountPercent && label.discountPercent > 0 ? "border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : "border-slate-200 dark:border-slate-800"} hover:shadow-[0_20px_60px_-15px_rgba(87,80,241,0.2)] hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col cursor-pointer`}> {label.discountPercent && label.discountPercent > 0 && ( <div className="absolute top-0 right-0 z-10"> <div className="bg-rose-500 text-white text-[8px] font-black px-3 py-1 uppercase tracking-widest flex items-center gap-1 shadow-lg"> <Sparkles className="h-2.5 w-2.5" /> Promo Active </div> </div> )} {/* Hardware Device Header */}
                  <div className={`px-6 py-4 flex items-center justify-between border-b ${label.discountPercent && label.discountPercent > 0 ? "border-rose-100 bg-rose-50/50" : "bg-white dark:bg-[#1E293B] border-slate-100 dark:border-slate-800/50"}`}>
                     <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                           <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{label.labelId}</span>
                           </div>
                           <span className="text-[7px] font-black text-[#5750F1] uppercase tracking-[0.3em] mt-1 ml-4">Virtual Node</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        {/* Animated Signal Meter */}
                        <div className="flex items-end gap-[2px] h-3">
                           {[1, 2, 3, 4].map((bar) => (
                              <div 
                                 key={bar} 
                                 className={`w-[3px] rounded-full transition-all duration-500 ${bar <= 3 ? 'bg-[#5750F1]' : 'bg-slate-200 dark:bg-slate-700'}`} 
                                 style={{ height: `${bar * 25}%` }} 
                              />
                           ))}
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 dark:bg-slate-900 rounded-none border border-slate-100 dark:border-slate-800">
                           <Battery className={`h-3 w-3 ${label.battery < 20 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} />
                           <span className="text-[9px] font-black text-[#111928] dark:text-white">{label.battery}%</span>
                        </div>
                     </div>
                  </div>

                  {/* E-Ink Display Area (Hyper-Hardware Look) */}
                  <div 
                     className="p-5 flex-1 group/screen"
                  >
                     <div className="relative h-full min-h-[180px] bg-[#FEFEFE] dark:bg-slate-50 rounded-[1.5rem] border-2 border-slate-200 dark:border-slate-300 shadow-inner overflow-hidden flex flex-col p-6 group-hover/screen:border-[#5750F1] transition-all duration-300">
                        {/* Screen Texture Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-500/5 to-transparent pointer-events-none" />
                        
                        {/* Quick View Overlay */}
                        <div className="absolute inset-0 bg-[#5750F1]/0 group-hover/screen:bg-[#5750F1]/5 flex items-center justify-center transition-all">
                           <Settings2 className="h-8 w-8 text-[#5750F1] opacity-0 group-hover/screen:opacity-100 scale-50 group-hover/screen:scale-100 transition-all duration-300" />
                        </div>
                        
                        {label.productId ? (
                           <div className="flex-1 flex flex-col">
                              <div className="flex justify-between items-start">
                                 <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] italic max-w-[80%]">
                                    {label.productName}
                                 </h4>
                                 {label.discountPercent && (
                                    <div className="bg-[#CC2B2B] text-white text-[9px] font-black px-2 py-1 rounded-none rotate-2 shadow-lg">
                                       -{label.discountPercent}%
                                    </div>
                                 )}
                              </div>

                              <div className="mt-auto flex items-end justify-between pt-4">
                                 <div className="flex flex-col">
                                    <div className="flex items-center gap-1 mb-2">
                                       <div className="h-[2px] w-4 bg-slate-900" />
                                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label.productSku?.slice(0, 6)}</span>
                                    </div>
                                    <div className="flex flex-col leading-none">
                                       {label.discountPercent && (
                                          <span className="text-xs font-bold text-slate-400 line-through mb-1 opacity-50">
                                             ${(label.currentPrice || 0).toFixed(2)}
                                          </span>
                                       )}
                                       <span className="text-5xl font-black text-slate-900 tracking-tighter">
                                          <span className="text-2xl mr-0.5">$</span>
                                          {(label.finalPrice || label.currentPrice || 0).toFixed(2)}
                                       </span>
                                    </div>
                                 </div>
                                 {/* Decorative Hardware Barcode */}
                                 <div className="h-10 w-16 flex items-end gap-[1px] opacity-20">
                                    {[...Array(15)].map((_, i) => (
                                       <div key={i} className="bg-slate-900 w-full" style={{ height: `${20 + Math.random() * 80}%` }} />
                                    ))}
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <div 
                              onClick={(e) => {
                                 e.stopPropagation();
                                 setAssignProductModal({
                                    labelId: label.id,
                                    branchId: label.branchId || ''
                                 });
                              }}
                              className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-none group-hover:border-indigo-200 transition-colors gap-3"
                           >
                              <div className="h-12 w-12 rounded-none bg-slate-50 flex items-center justify-center">
                                 <PackagePlus className="h-6 w-6 text-slate-200 group-hover:text-[#5750F1] transition-colors" />
                              </div>
                              <div className="text-center">
                                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-3">Awaiting Content</p>
                                 <Button 
                                    className="h-9 rounded-none bg-[#5750F1] hover:bg-[#4A44D1] text-[9px] font-black uppercase tracking-widest px-6 shadow-lg shadow-indigo-500/20"
                                 >
                                    Link Inventory
                                 </Button>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Dynamic Status Footer */}
                  <div className="px-7 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50">
                     <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                           <div className="flex items-center gap-2">
                              <div className={`h-1.5 w-1.5 rounded-full ${label.status === 'active' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(87,80,241,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
                              <span className="text-[9px] font-black text-[#111928] dark:text-white uppercase tracking-widest">{label.status === 'active' ? 'Operational' : 'Syncing'}</span>
                           </div>
                           <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">
                              Last Node: {label.lastSync ? (
                                 (() => {
                                    const date = label.lastSync instanceof Date ? label.lastSync : (label.lastSync as any)?.seconds ? new Date((label.lastSync as any).seconds * 1000) : new Date();
                                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                 })()
                              ) : '12:45'}
                           </span>
                        </div>
                     </div>
                     <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-none">
                        <MapPin className="h-3 w-3 text-[#5750F1]" />
                        <span className="text-[9px] font-black text-[#5750F1] uppercase tracking-tight">{label.location || 'UNSET'}</span>
                     </div>
                  </div>

                  {/* Premium Action Strip */}
                  <div className="px-6 pb-6 pt-2 flex items-center gap-3">
                     {label.productId ? (
                        <>
                           <Button 
                              variant="outline" 
                              onClick={(e) => { e.stopPropagation(); setSelectedLabel(label); }}
                              className="flex-1 h-11 rounded-none border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-[#111928] dark:hover:bg-white hover:text-white dark:hover:text-[#111928] transition-all duration-300"
                           >
                              Configure
                           </Button>
                           <Button 
                              onClick={(e) => { 
                                 e.stopPropagation(); 
                                 setActiveDiscountModal({
                                    labelId: label.id,
                                    productId: label.productId || '',
                                    branchId: label.branchId || '',
                                    currentPercent: label.discountPercent || 0
                                 });
                              }}
                              variant="ghost"
                              className="h-11 w-11 rounded-none text-slate-300 hover:text-[#5750F1] hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                              title="Price Override"
                           >
                              <Tag className="h-4 w-4" />
                           </Button>
                        </>
                     ) : (
                        <Button 
                           variant="outline" 
                           onClick={(e) => { e.stopPropagation(); handleDeleteLabel(label.id); }}
                           className="flex-1 h-11 rounded-none border-rose-100 dark:border-rose-900/30 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300"
                        >
                           <Trash2 className="h-4 w-4 mr-2" />
                           Delete Hardware
                        </Button>
                     )}
                     <Link 
                        href={`/label/${label.id}`} 
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="h-11 px-4 rounded-none border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-[#5750F1] hover:border-[#5750F1] transition-all"
                        title="Open Live Preview"
                     >
                        <Globe className="h-4 w-4" />
                     </Link>
                  </div>
               </motion.div>
            ))}
         </div>
      ) : (
         <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="h-24 w-24 rounded-none bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-8 shadow-inner">
               <Activity className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-[#111928] dark:text-white uppercase tracking-tight">No Hardware Detected</h3>
            <p className="text-sm font-bold text-slate-400 max-w-xs mt-2 uppercase tracking-widest leading-relaxed">Your fleet is currently offline. Provision your first tag to start monitoring.</p>
         </div>
      )}
      <div className="fixed bottom-8 right-8 z-[100]">
         <Button 
            onClick={() => setShowSmartMapModal(true)}
            className="h-14 px-8 rounded-none bg-[#5750F1] hover:bg-[#4A44D1] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/40 hover:scale-105 transition-all gap-3"
         >
            <Sparkles className="h-4 w-4" />
            Smart Architect
         </Button>
      </div>
    </div>
  );
};



