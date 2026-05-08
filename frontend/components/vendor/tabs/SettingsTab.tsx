'use client';

import { motion } from 'framer-motion';
import { Settings, Save, Upload, User as UserIcon, Mail, Phone, Building2, MapPin, Hash, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Company } from '@/types/vendor';

interface SettingsTabProps {
  currentUser: any;
  company: Company | null;
  handleProfileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsTab = ({
  currentUser,
  company,
  handleProfileUpload
}: SettingsTabProps) => {
  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Account Workspace</h2>
          <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Manage corporate identity and security protocols.</p>
        </div>
        <Button className="h-11 px-8 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] font-bold gap-2">
           <Save className="h-4 w-4" />
           Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="premium-card p-8 text-center">
              <div className="relative inline-block group mb-6">
                 <div className="h-28 w-28 rounded-3xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-4 border-white dark:border-[#1C2434] shadow-xl">
                    {currentUser?.photoURL ? (
                       <img src={currentUser.photoURL} alt="" className="h-full w-full object-cover" />
                    ) : (
                       <div className="h-full w-full flex items-center justify-center text-3xl font-black text-slate-300">
                          {currentUser?.name?.charAt(0)}
                       </div>
                    )}
                 </div>
                 <label className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-[#5750F1] text-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                    <Upload className="h-4 w-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleProfileUpload} />
                 </label>
              </div>
              <h3 className="text-lg font-black text-[#111928] dark:text-white leading-none mb-1">{currentUser?.name}</h3>
              <p className="text-xs font-bold text-[#5750F1] uppercase tracking-widest">{currentUser?.role} Account</p>
           </div>

           <div className="premium-card p-6 space-y-4">
              <h4 className="text-xs font-black text-[#637381] dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Service Status</h4>
              {[
                 { label: 'Cloud Sync', status: 'Optimal', icon: Zap, color: 'text-emerald-500' },
                 { label: 'Security', status: 'Encrypted', icon: ShieldCheck, color: 'text-[#5750F1]' },
              ].map(stat => (
                 <div key={stat.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                       <stat.icon className={`h-4 w-4 ${stat.color}`} />
                       <span className="text-xs font-bold text-[#111928] dark:text-white">{stat.label}</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600">{stat.status}</span>
                 </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
           <div className="premium-card p-8">
              <h3 className="text-lg font-bold text-[#111928] dark:text-white mb-6">Corporate Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#637381] dark:text-slate-500 uppercase tracking-widest">Legal Entity</label>
                    <div className="relative">
                       <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                       <Input readOnly value={company?.name} className="pl-11 h-12 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 font-bold" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#637381] dark:text-slate-500 uppercase tracking-widest">Business ID</label>
                    <div className="relative">
                       <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                       <Input readOnly value={company?.id} className="pl-11 h-12 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 font-mono text-xs" />
                    </div>
                 </div>
                 <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-[#637381] dark:text-slate-500 uppercase tracking-widest">HQ Address</label>
                    <div className="relative">
                       <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                       <Input readOnly value={company?.address} className="pl-11 h-12 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 font-bold" />
                    </div>
                 </div>
              </div>
           </div>

           <div className="premium-card p-8">
              <h3 className="text-lg font-bold text-[#111928] dark:text-white mb-6">Contact Access</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#637381] dark:text-slate-500 uppercase tracking-widest">Primary Email</label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                       <Input readOnly value={currentUser?.email} className="pl-11 h-12 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 font-bold" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#637381] dark:text-slate-500 uppercase tracking-widest">Phone Network</label>
                    <div className="relative">
                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                       <Input readOnly value={company?.phone} className="pl-11 h-12 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 font-bold" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
