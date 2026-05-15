'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ScanLine, Camera, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export const BarcodeScannerModal = ({ isOpen, onClose, onScan }: BarcodeScannerModalProps) => {
  const { t } = useLanguage();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Haptic and Audio feedback engine
  const triggerFeedback = () => {
    try {
      // 1. Haptic Vibration (100ms sharp pulse)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }

      // 2. Play custom MP3 from /public folder
      const audio = new Audio('/scanner-beep.MP3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Fallback to Electronic Beep if MP3 is missing or blocked
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(850, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      });
    } catch (e) {
      console.warn('Feedback failed:', e);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current && isStarted) {
        scannerRef.current.stop().catch(console.error);
        setIsStarted(false);
      }
      return;
    }

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = {
          fps: 20,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            html5QrCode.stop().then(() => {
              setIsStarted(false);
              triggerFeedback();
              onScan(decodedText);
              onClose();
            }).catch(console.error);
          },
          () => {} // silent ignore scan errors
        );
        
        setIsStarted(true);
        setError(null);
      } catch (err) {
        console.error("Camera start error:", err);
        setError("Could not access camera. Please ensure HTTPS and permissions.");
      }
    };

    const timer = setTimeout(startScanner, 300);
    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black md:bg-transparent">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl hidden md:block"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="relative w-full h-full md:h-[600px] md:max-w-md bg-[#0F172A] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header Area */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#5750F1] rounded-xl flex items-center justify-center shadow-lg shadow-[#5750F1]/20">
                  <ScanLine className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-black tracking-tight text-lg leading-none">{t('scan_barcode')}</h3>
                  <p className="text-[#5750F1] text-[10px] font-black uppercase tracking-[0.2em] mt-1">{t('align_barcode_hint')}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Camera Viewport */}
            <div className="flex-1 relative bg-black overflow-hidden">
              <div 
                id="reader" 
                className="absolute inset-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover" 
              />
              
              {!isStarted && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F172A] z-20">
                  <div className="h-12 w-12 border-4 border-[#5750F1]/20 border-t-[#5750F1] rounded-full animate-spin mb-4" />
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest animate-pulse">Initializing Lens...</p>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center bg-[#0F172A] z-30">
                  <div className="h-16 w-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
                    <Camera className="h-8 w-8 text-rose-500" />
                  </div>
                  <h4 className="text-white font-black mb-2 uppercase tracking-tight">Camera Error</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-8 px-6 py-3 bg-[#5750F1] text-white text-xs font-black uppercase tracking-widest rounded-xl"
                  >
                    Retry Connection
                  </button>
                </div>
              )}

              {/* Scanning Overlay */}
              {isStarted && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                  {/* The Target Frame */}
                  <div className="relative">
                    <div className="w-[280px] h-[160px] border-2 border-white/20 rounded-2xl relative overflow-hidden shadow-[0_0_0_2000px_rgba(0,0,0,0.6)]">
                      {/* Corner Highlights */}
                      <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-[#5750F1] rounded-tl-2xl" />
                      <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-[#5750F1] rounded-tr-2xl" />
                      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-[#5750F1] rounded-bl-2xl" />
                      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-[#5750F1] rounded-br-2xl" />
                      
                      {/* Laser Line */}
                      <motion.div 
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-[#5750F1] shadow-[0_0_20px_#5750F1]"
                      />
                    </div>
                  </div>
                  
                  {/* Floating Hint */}
                  <div className="mt-12">
                    <div className="px-6 py-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                      <p className="text-white text-[10px] font-black uppercase tracking-[0.2em] text-center">{t('align_barcode_hint')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls Area (Only visible on mobile) */}
            <div className="p-8 bg-gradient-to-t from-black to-[#0F172A] flex justify-center items-center md:hidden">
              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-2 opacity-40">
                  <div className="h-12 w-12 rounded-full border border-white/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-[8px] font-bold text-white uppercase">Auto</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
