'use client';

import { useState } from 'react';
import { 
  Save, 
  Upload, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Hash, 
  ShieldCheck, 
  Zap, 
  Lock,
  RefreshCw,
  Store,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Company } from '@/types/vendor';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface SettingsTabProps {
  currentUser: any;
  company: Company | null;
  handleProfileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateProfile: (data: { name: string; phone?: string; taxId?: string; address?: string }) => Promise<void>;
}

export const SettingsTab = ({
  currentUser,
  company,
  handleProfileUpload,
  handleLogoUpload,
  updateProfile
}: SettingsTabProps) => {
  const { t } = useLanguage();
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    phone: company?.phone || '',
    taxId: company?.taxId || '',
    address: company?.address || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const isStaff = currentUser?.role === 'staff' || currentUser?.position === 'Manager';

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(profileData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
           <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="h-4 w-4 text-[#5750F1]" />
              <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.2em]">{t('profile_management')}</span>
           </div>
          <h2 className="text-2xl font-black text-[#111928] dark:text-white tracking-tight uppercase">
            {currentUser?.role === 'staff' || currentUser?.role === 'Manager' ? t('staff_profile') : t('vendor_profile')}
          </h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">
            {currentUser?.role === 'staff' || currentUser?.role === 'Manager' ? t('staff_profile_desc') : t('account_workspace_desc')}
          </p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="h-11 px-10 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2 shadow-lg shadow-indigo-500/20"
        >
           {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
           {t('save_changes')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white dark:bg-[#1C2434] p-8 border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#5750F1]" />
              <div className="relative inline-block group mb-6">
                 <div className="h-28 w-28 rounded-none bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:scale-105">
                    {currentUser?.photoURL ? (
                       <img src={currentUser.photoURL} alt="" className="h-full w-full object-cover" />
                    ) : (
                       <div className="h-full w-full flex items-center justify-center text-3xl font-black text-slate-300">
                          {profileData.name?.charAt(0)}
                       </div>
                    )}
                 </div>
                 <label className="absolute -bottom-2 -right-2 h-10 w-10 rounded-none bg-slate-900 text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#5750F1] transition-all">
                    <Upload className="h-4 w-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleProfileUpload} />
                 </label>
              </div>
              
              <div className="space-y-1">
                 <h4 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">{profileData.name}</h4>
                 <p className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.2em]">{currentUser?.role}</p>
                 <p className="text-[10px] font-bold text-slate-400 mt-2">{currentUser?.email}</p>
              </div>
           </div>

           <div className="bg-white dark:bg-[#1C2434] p-8 border border-slate-200 dark:border-slate-800 space-y-6">
              <h4 className="text-xs font-black text-[#637381] dark:text-slate-500 uppercase tracking-[0.3em]">{t('security_center')}</h4>
              <Button variant="outline" className="w-full h-12 rounded-none border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest gap-2">
                 <Lock className="h-4 w-4" />
                 {t('change_password')}
              </Button>
              <div className="pt-4 space-y-3">
                 {[
                    { label: 'Cloud Sync', status: 'Optimal', icon: Zap, color: 'text-emerald-500' },
                    { label: 'Encryption', status: 'AES-256', icon: ShieldCheck, color: 'text-[#5750F1]' },
                 ].map(stat => (
                    <div key={stat.label} className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3">
                       <div className="flex items-center gap-2">
                          <stat.icon className={`h-3 w-3 ${stat.color}`} />
                          <span className="text-slate-500">{stat.label}</span>
                       </div>
                       <span className="text-[#111928] dark:text-white">{stat.status}</span>
                    </div>
                 ))}
              </div>
            </div>
         </div>

         <div className="lg:col-span-2 space-y-6">
            {!isStaff && (
              <div className="bg-white dark:bg-[#1C2434] p-8 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <Store className="h-4 w-4 text-[#5750F1]" />
                  <h3 className="text-xs font-black text-[#111928] dark:text-white uppercase tracking-[0.3em]">Store Branding</h3>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    {company?.logoUrl ? (
                      <img src={company.logoUrl} className="h-full w-full object-contain p-2" alt="Store Logo" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 opacity-20">
                        <LayoutGrid className="h-6 w-6" />
                        <span className="text-[8px] font-black uppercase">No Logo</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">Store Logo</h4>
                      <p className="text-[10px] font-medium text-slate-400 mt-1">This logo will replace the default platform logo in sidebars and headers.</p>
                    </div>
                    
                    <Button 
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      variant="outline" 
                      className="h-10 rounded-none border-slate-200 dark:border-slate-800 text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Logo
                      <input 
                        id="logo-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                      />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-[#1C2434] p-8 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-black text-[#111928] dark:text-white uppercase tracking-[0.3em] mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                {isStaff ? t('personal_information') : t('corporate_credentials')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-widest">{t('legal_entity')}</label>
                    <div className="relative">
                       <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                       <Input 
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="pl-11 h-12 rounded-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-xs" 
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-widest">{t('tax_identification')}</label>
                    <div className="relative">
                       <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                       <Input 
                        value={profileData.taxId}
                        onChange={(e) => setProfileData({...profileData, taxId: e.target.value})}
                        placeholder="VAT-XXX-XXX-XXX"
                        className="pl-11 h-12 rounded-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-xs" 
                       />
                    </div>
                 </div>
                 <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-widest">{t('hq_address')}</label>
                    <div className="relative">
                       <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                       <Input 
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        className="pl-11 h-12 rounded-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-xs" 
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-widest">{t('contact_line')}</label>
                    <div className="relative">
                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                       <Input 
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="pl-11 h-12 rounded-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-xs" 
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-widest">{t('registered_email')}</label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                       <Input readOnly value={currentUser?.email} className="pl-11 h-12 rounded-none bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 font-bold text-xs opacity-60" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
