'use client';

import { 
  Save, 
  Palette, 
  RefreshCw, 
  Layout,
  Minimize2,
  Tag,
  Zap,
  Package,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { LabelUIConfig, DEFAULT_LABEL_CONFIG, getLabelConfig, saveLabelConfig } from '@/lib/label-config';
import { LabelPreview } from '@/components/ui/LabelPreview';

interface LabelDesignerTabProps {
  companyId: string;
}

export const LabelDesignerTab = ({ companyId }: LabelDesignerTabProps) => {
  const { t } = useLanguage();
  const [template, setTemplate] = useState<LabelUIConfig['template']>('standard');
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<LabelUIConfig>(DEFAULT_LABEL_CONFIG);

  useEffect(() => {
    const loadConfig = async () => {
      const savedConfig = await getLabelConfig(companyId);
      setConfig(savedConfig);
      setTemplate(savedConfig.template);
    };
    loadConfig();
  }, [companyId]);

  const templates = [
    { id: 'standard', name: t('template_standard') || 'Standard', icon: Layout },
    { id: 'promo', name: t('template_promo') || 'Hot Sale', icon: Tag },
    { id: 'minimal', name: t('template_minimal') || 'Minimal', icon: Minimize2 },
    { id: 'inventory', name: t('template_inventory') || 'Stock Focus', icon: Package },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveLabelConfig(companyId, { ...config, template });
      // Notification would be nice here, but for now we rely on UI feedback
    } catch (error) {
      console.error('Failed to save label design:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1.5">
              <Palette className="h-4 w-4 text-[#5750F1]" />
              <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.2em]">{t('brand_identity')}</span>
           </div>
          <h2 className="text-2xl font-black text-[#111928] dark:text-white tracking-tight uppercase">
            {t('label_ui') || 'Hardware UI Designer'}
          </h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">
            {t('designer_desc') || 'Customize how your products appear on the e-ink digital tags.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 px-10 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2 shadow-lg shadow-indigo-500/20"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('save_changes')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Template Selector */}
          <div className="bg-white dark:bg-[#1C2434] p-8 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-black text-[#637381] dark:text-slate-500 uppercase tracking-[0.3em] mb-8 border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#5750F1]" />
              {t('ui_templates') || 'Layout Presets'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setTemplate(tmpl.id as LabelUIConfig['template'])}
                  className={`p-6 rounded-none border-2 flex flex-col items-center gap-3 transition-all ${
                    template === tmpl.id 
                      ? 'border-[#5750F1] bg-[#5750F1]/5 text-[#5750F1]' 
                      : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <tmpl.icon className="h-6 w-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{tmpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Visual Config */}
          <div className="bg-white dark:bg-[#1C2434] p-8 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-black text-[#637381] dark:text-slate-500 uppercase tracking-[0.3em] mb-8 border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2">
              <Palette className="h-4 w-4 text-emerald-500" />
              {t('rendering_options') || 'Rendering'}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contrast Engine</label>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-none">
                  <button 
                    onClick={() => setConfig({...config, highContrast: true})}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${config.highContrast ? 'bg-white dark:bg-slate-800 text-[#111928] dark:text-white shadow-sm' : 'text-slate-400'}`}
                  >
                    High Contrast
                  </button>
                  <button 
                    onClick={() => setConfig({...config, highContrast: false})}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${!config.highContrast ? 'bg-white dark:bg-slate-800 text-[#111928] dark:text-white shadow-sm' : 'text-slate-400'}`}
                  >
                    Soft E-Ink
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('typography') || 'System Font'}</label>
                 <select 
                    value={config.fontFamily}
                    onChange={(e) => setConfig({...config, fontFamily: e.target.value})}
                    className="w-full h-12 px-4 rounded-none border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-xs"
                 >
                    <option value="Inter">Inter (Global)</option>
                    <option value="'Kantumruy Pro', sans-serif">Kantumruy Pro (Khmer)</option>
                    <option value="Georgia">Georgia (Classic)</option>
                    <option value="monospace">Mono Space (Industrial)</option>
                 </select>
              </div>

              <div className="pt-4 space-y-4">
                  {[
                    { id: 'showBattery', label: t('show_battery') || 'Battery Health' },
                    { id: 'showQrCode', label: t('show_qr') || 'Digital QR Link' },
                    { id: 'showStock', label: t('show_stock') || 'Inventory Level' },
                  ].map(item => (
                    <label key={item.id} className="flex items-center justify-between group cursor-pointer">
                       <span className="text-[10px] font-black text-[#111928] dark:text-white uppercase tracking-widest">{item.label}</span>
                       <div className="relative inline-flex items-center">
                         <input 
                           type="checkbox" 
                           checked={(config as any)[item.id]}
                           onChange={(e) => setConfig({...config, [item.id]: e.target.checked})}
                           className="sr-only peer"
                         />
                         <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-none peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-5 after:transition-all peer-checked:bg-[#5750F1]"></div>
                       </div>
                    </label>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Real 3D Label Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-none border border-slate-200 dark:border-slate-800 p-8 lg:p-20 flex flex-col items-center justify-center min-h-[650px] relative overflow-hidden">
            
            {/* Background Branding Overlay */}
            <div className="absolute top-10 left-10 opacity-[0.03] pointer-events-none">
               <h4 className="text-[120px] font-black italic -rotate-12 select-none uppercase tracking-tighter">PREVIEW</h4>
            </div>

            {/* 3D HARDWARE WRAPPER */}
            <div className="[perspective:2000px] hover:[perspective:3000px] transition-all duration-700">
              <motion.div 
                layout
                initial={{ scale: 0.8, opacity: 0, rotateY: -15, rotateX: 10 }}
                animate={{ scale: 1, opacity: 1, rotateY: -5, rotateX: 5 }}
                whileHover={{ rotateY: 0, rotateX: 0, scale: 1.05 }}
                className="w-[450px] aspect-[4/3] bg-white rounded-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3),0_30px_60px_-30px_rgba(0,0,0,0.4)] border-[1px] border-slate-100 p-8 flex flex-col relative transition-all duration-500 [transform-style:preserve-3d]"
              >
                {/* Physical Bezel Depth */}
                <div className="absolute inset-0 border-[14px] border-[#1C2434] shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] pointer-events-none z-10" />
                
                {/* Internal Screen Recess */}
                <div className="absolute inset-[14px] bg-[#fdfdfd] shadow-[inset_0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col">
                  <LabelPreview 
                    config={{ ...config, template }}
                    productName="Premium Espresso Beans"
                    price={24.99}
                    discountPrice={19.99}
                    sku="COF-772-PRO"
                  />
                </div>

                {/* Hardware Highlights */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-white/20 rounded-full blur-[1px] z-20" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/10 rounded-full blur-[2px] z-20" />
              </motion.div>
            </div>

            {/* Scale Indicator */}
            <div className="mt-16 flex items-center gap-12 pt-8 border-t border-slate-100 dark:border-slate-800/50 w-full max-w-md justify-center">
               <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-none bg-[#5750F1]" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4.2" E-Ink</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-none bg-[#5750F1]" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">400x300 DPI</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-none bg-[#5750F1]" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RF-868MHz</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
