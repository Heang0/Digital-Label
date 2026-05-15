import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, Battery, Wifi, Activity, MapPin, Package, Calendar, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DigitalLabel } from '@/types/vendor';

interface LabelDetailModalProps {
  label: DigitalLabel | null;
  onClose: () => void;
  onSync: (id: string) => void;
  onUpdateLocation: (id: string, location: string) => Promise<void>;
  onOpenDiscount: (label: DigitalLabel) => void;
  onAssign: (labelId: string, branchId: string) => void;
  onUnlink: (labelId: string) => void;
}

export const LabelDetailModal = ({ label, onClose, onSync, onUpdateLocation, onOpenDiscount, onAssign, onUnlink }: LabelDetailModalProps) => {
  const [location, setLocation] = useState(label?.location || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (label) setLocation(label.location || '');
  }, [label]);

  if (!label) return null;

  const handleLocationUpdate = async () => {
    if (!label) return;
    setIsSaving(true);
    try {
      await onUpdateLocation(label.id, location);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {label && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
            className="relative w-full max-w-lg bg-white dark:bg-[#1C2434] rounded-none shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col"
          >
            {/* Header Mirroring ProductModal */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-none bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-[#5750F1]">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#111928] dark:text-white uppercase tracking-tight">Tag Configuration</h2>
                    <p className="text-[10px] font-bold text-[#637381] uppercase tracking-widest mt-0.5">{label.labelCode || label.labelId}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none text-slate-400 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
               {/* 3D Hardware Simulation Area */}
               <div className="px-8 py-8 flex justify-center bg-slate-50/50 dark:bg-slate-900/30">
                  <motion.div 
                     initial={{ rotateY: -10, rotateX: 5 }}
                     animate={{ rotateY: 0, rotateX: 0 }}
                     className="relative w-full max-w-[340px] h-[180px] bg-white rounded-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden"
                  >
                     {/* E-Ink Display Screen */}
                     <div className="absolute inset-[10px] bg-[#fdfdfd] border border-slate-100 rounded-none shadow-inner flex flex-col p-4">
                        <div className="flex justify-between items-start opacity-40 grayscale">
                           <span className="text-[8px] font-black text-slate-900 tracking-tighter uppercase">Smart Label 2.4"</span>
                           <div className="flex gap-1">
                              <div className="h-1 w-1 rounded-none bg-slate-900" />
                              <div className="h-1 w-1 rounded-none bg-slate-900" />
                           </div>
                        </div>

                        {label.productId ? (
                           <div className="flex-1 flex flex-col justify-center mt-2">
                              <h4 className="text-xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase line-clamp-2">{label.productName}</h4>
                              <div className="flex items-baseline justify-between mt-auto">
                                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{label.productSku || 'PR-00016'}</p>
                                 <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                                    ${(label.finalPrice || label.currentPrice || 0).toFixed(2)}
                                 </p>
                              </div>
                           </div>
                        ) : (
                           <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-none mt-2 gap-3">
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Awaiting Content</p>
                              <Button 
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                    onAssign(label.id, label.branchId || '');
                                 }}
                                 className="h-8 rounded-none bg-[#5750F1] hover:bg-[#4A44D1] text-[9px] font-black uppercase tracking-widest px-4 shadow-lg shadow-indigo-500/20"
                              >
                                 Link Product
                              </Button>
                           </div>
                        )}
                     </div>
                  </motion.div>
               </div>

               <div className="p-8 space-y-8">
                  {/* Telemetry Grid Mirroring Product Details */}
                  <div className="grid grid-cols-3 gap-3">
                     <div className="p-3 rounded-none bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Battery</p>
                        <div className="flex items-center gap-2">
                           <Battery className={`h-3 w-3 ${label.battery < 20 ? 'text-rose-500' : 'text-emerald-500'}`} />
                           <span className="text-sm font-black text-[#111928] dark:text-white">{label.battery}%</span>
                        </div>
                     </div>
                     <div className="p-3 rounded-none bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Signal</p>
                        <div className="flex items-center gap-2">
                           <Wifi className="h-3 w-3 text-[#5750F1]" />
                           <span className="text-sm font-black text-[#111928] dark:text-white">EX</span>
                        </div>
                     </div>
                     <div className="p-3 rounded-none bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <div className="flex items-center gap-2">
                           <Activity className={`h-3 w-3 ${label.status === 'active' ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`} />
                           <span className="text-[8px] font-black uppercase tracking-widest">{label.status === 'active' ? 'ACTIVE' : 'SYNC'}</span>
                        </div>
                     </div>
                  </div>

                  {/* Placement Section */}
                  <div className="space-y-3">
                     <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">Shelf Positioning / Aisle</label>
                     <div className="flex gap-2">
                        <div className="relative flex-1">
                           <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                           <Input 
                              placeholder="e.g. Aisle 1, Shelf B-12" 
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="pl-10 h-11 rounded-none bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 font-bold text-sm"
                           />
                        </div>
                        <Button 
                           onClick={handleLocationUpdate}
                           disabled={isSaving || location === label.location}
                           className="h-11 w-11 rounded-none bg-[#111928] dark:bg-white dark:text-[#111928] text-white p-0 shadow-lg active:scale-95 transition-all"
                        >
                           {isSaving ? (
                             <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           ) : (
                             <Save className="h-4 w-4" />
                           )}
                        </Button>
                     </div>
                  </div>

                   {label.productId && (
                      <div className="space-y-3">
                         <div className="p-4 rounded-none bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-none bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                               <Package className="h-6 w-6 text-[#5750F1]" />
                            </div>
                            <div className="flex-1">
                               <p className="text-[9px] font-black text-[#5750F1] uppercase tracking-widest">Linked Inventory</p>
                               <p className="text-sm font-bold text-[#111928] dark:text-white">{label.productName}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                               <Button 
                                  onClick={() => onOpenDiscount(label)}
                                  className="h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#111928] dark:text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#5750F1] hover:text-white transition-all rounded-none gap-2 px-4"
                               >
                                  <Tag className="h-3 w-3" />
                                  Adjust Price
                               </Button>
                               <Button 
                                  onClick={() => {
                                     onUnlink(label.id);
                                     onClose();
                                  }}
                                  variant="ghost"
                                  className="h-8 text-rose-500 hover:text-white hover:bg-rose-500 text-[8px] font-black uppercase tracking-widest rounded-none transition-all"
                               >
                                  Unlink Product
                               </Button>
                            </div>
                         </div>
                      </div>
                   )}
               </div>
            </div>

            {/* Bottom Actions Mirroring ProductModal */}
            <div className="flex justify-end gap-3 p-6 border-t bg-white dark:bg-[#1C2434] shrink-0">
               <Button onClick={onClose} variant="outline" className="rounded-none h-10 font-bold px-6 uppercase text-[10px] tracking-widest">Close View</Button>
               <Button 
                  onClick={() => onSync(label.id)}
                  className="rounded-none h-10 bg-[#5750F1] hover:bg-[#4A44D1] text-white font-bold px-8 shadow-lg shadow-indigo-500/20 gap-2 uppercase text-[10px] tracking-widest"
               >
                  <RefreshCw className="h-4 w-4" />
                  Sync Tag
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
