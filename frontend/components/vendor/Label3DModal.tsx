'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rotate3d, Box, Maximize2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DigitalLabel } from '@/types/vendor';

interface Label3DModalProps {
  label: DigitalLabel | null;
  onClose: () => void;
}

export const Label3DModal = ({ label, onClose }: Label3DModalProps) => {
  const [rotation, setRotation] = useState({ x: 15, y: -20 });
  const [isDragging, setIsDragging] = useState(false);

  if (!label) return null;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setRotation(prev => ({
      x: prev.x - e.movementY * 0.5,
      y: prev.y + e.movementX * 0.5
    }));
  };

  return (
    <AnimatePresence>
      {label && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 40 }} 
            className="relative w-full max-w-4xl bg-[#111928] rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 h-[80vh] flex flex-col"
          >
            {/* Studio Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#5750F1]/20 flex items-center justify-center text-[#5750F1]">
                  <Rotate3d className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Hardware 3D Studio</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Inspection Mode: {label.labelId}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-slate-400 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* 3D Interaction Stage */}
            <div 
              className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden perspective-2000"
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onMouseMove={handleMouseMove}
            >
              {/* Animated Background Grid */}
              <div className="absolute inset-0 opacity-10" 
                style={{ 
                  backgroundImage: 'radial-gradient(circle, #5750F1 1px, transparent 1px)', 
                  backgroundSize: '40px 40px' 
                }} 
              />

              {/* 3D Hardware Model */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div 
                  style={{ 
                    rotateX: rotation.x, 
                    rotateY: rotation.y,
                    transformStyle: 'preserve-3d'
                  }}
                  className="relative w-[500px] h-[300px] transform-gpu transition-transform duration-100 ease-out"
                >
                  {/* Front Face (Screen) */}
                  <div className="absolute inset-0 bg-white rounded-2xl border-4 border-slate-200 shadow-2xl flex flex-col overflow-hidden translate-z-[15px]"
                    style={{ transform: 'translateZ(15px)' }}
                  >
                     <div className="absolute inset-[15px] bg-[#fdfdfd] border border-slate-100 rounded-lg shadow-inner flex flex-col p-8">
                        <div className="flex justify-between items-start opacity-30 grayscale mb-6">
                           <span className="text-xs font-black text-slate-900 tracking-tighter uppercase">Smart Hardware 2.4" v3</span>
                           <div className="flex gap-2">
                              <div className="h-2 w-2 rounded-full bg-slate-900" />
                              <div className="h-2 w-2 rounded-full bg-slate-900" />
                           </div>
                        </div>

                        {label.productId ? (
                           <div className="flex-1 flex flex-col justify-center">
                              <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-[0.85] uppercase italic mb-8">{label.productName}</h4>
                              <div className="flex items-baseline justify-between mt-auto">
                                 <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{label.productSku || 'PR-00016'}</p>
                                 <p className="text-7xl font-black text-slate-900 tracking-tighter leading-none">
                                    ${(label.finalPrice || label.currentPrice || 0).toFixed(2)}
                                 </p>
                              </div>
                           </div>
                        ) : (
                           <div className="flex-1 flex items-center justify-center border-4 border-dashed border-slate-100 rounded-2xl">
                              <p className="text-xl font-black text-slate-200 uppercase tracking-[0.4em]">Ready for Provision</p>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 bg-slate-100 rounded-2xl border-2 border-slate-200" 
                    style={{ transform: 'translateZ(-15px) rotateY(180deg)' }}
                  >
                     <div className="w-full h-full p-8 flex flex-col items-center justify-center gap-4">
                        <div className="w-24 h-24 rounded-full border-4 border-slate-200 flex items-center justify-center">
                           <Box className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="w-32 h-2 bg-slate-200 rounded-full" />
                        <div className="w-24 h-2 bg-slate-200 rounded-full" />
                     </div>
                  </div>

                  {/* Sides */}
                  <div className="absolute left-[-15px] top-0 bottom-0 w-[30px] bg-slate-200" 
                    style={{ transform: 'rotateY(-90deg) translateZ(0)' }} 
                  />
                  <div className="absolute right-[-15px] top-0 bottom-0 w-[30px] bg-slate-200" 
                    style={{ transform: 'rotateY(90deg) translateZ(0)' }} 
                  />
                  <div className="absolute top-[-15px] left-0 right-0 h-[30px] bg-slate-200" 
                    style={{ transform: 'rotateX(90deg) translateZ(0)' }} 
                  />
                  <div className="absolute bottom-[-15px] left-0 right-0 h-[30px] bg-slate-300" 
                    style={{ transform: 'rotateX(-90deg) translateZ(0)' }} 
                  />
                </motion.div>
              </div>

              {/* Instructions Overlay */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 text-slate-500">
                <div className="flex items-center gap-2">
                   <Move className="h-4 w-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Click & Drag to Rotate</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                   <Maximize2 className="h-4 w-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Inspection Zoom Active</span>
                </div>
              </div>
            </div>

            {/* Bottom Tech Bar */}
            <div className="p-8 bg-white/5 flex items-center justify-between">
               <div className="flex items-center gap-8">
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Signal Quality</span>
                     <span className="text-xs font-black text-white uppercase italic">Ultra-Low Latency</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Rendering Engine</span>
                     <span className="text-xs font-black text-[#5750F1] uppercase">NextGen E-Ink v4</span>
                  </div>
               </div>
               <Button onClick={onClose} className="px-10 h-14 rounded-2xl bg-white text-[#111928] font-black uppercase tracking-widest shadow-xl shadow-white/10 hover:scale-105 transition-all">
                  Exit Studio
               </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
