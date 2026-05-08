'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Trash2,
  Upload,
  Loader2,
  UserCircle,
  Shield,
  Key,
  Lock,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileUpload } from './ProfileUpload';
import { useUserStore } from '@/lib/user-store';
import { auth } from '@/lib/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export const AdminSettings = () => {
  const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  // Password State
  const [showPassModal, setShowPassModal] = useState(false);
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '+990 3343 7865',
    email: user?.email || '',
    username: user?.username || 'admin.master',
    bio: user?.bio || 'Write your bio here',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '+990 3343 7865',
        email: user.email || '',
        username: user.username || 'admin.master',
        bio: user.bio || 'Write your bio here',
      });
    }
  }, [user]);

  useEffect(() => {
    const handleSetTab = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('set-settings-tab', handleSetTab);
    return () => window.removeEventListener('set-settings-tab', handleSetTab);
  }, []);

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/users/profile/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      setUser({ ...user, ...formData });
      alert('Settings updated successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passData.new !== passData.confirm) return alert('Passwords do not match');
    if (passData.new.length < 6) return alert('Password must be at least 6 characters');

    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) return;

      const credential = EmailAuthProvider.credential(currentUser.email, passData.current);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passData.new);
      
      alert('Password updated successfully!');
      setShowPassModal(false);
      setPassData({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      alert(error.message || 'Authentication failed. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-1">
        <div>
          <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Admin Workspace</h2>
          <div className="flex items-center gap-2 text-xs font-medium text-[#637381] dark:text-slate-400 mt-1">
             <span>Dashboard</span>
             <span>/</span>
             <span className="text-[#5750F1]">Settings</span>
          </div>
        </div>

        {/* Local Tab Switcher */}
        <div className="flex bg-white dark:bg-[#24303F] p-1 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'profile' ? 'bg-[#5750F1] text-white shadow-md' : 'text-[#637381] dark:text-slate-400 hover:text-[#5750F1]'}`}
          >
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'security' ? 'bg-[#5750F1] text-white shadow-md' : 'text-[#637381] dark:text-slate-400 hover:text-[#5750F1]'}`}
          >
            Security
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {activeTab === 'profile' ? (
          <>
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-white dark:bg-[#24303F] rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                <div className="px-7 py-5 border-b border-[#E2E8F0] dark:border-slate-700">
                  <h3 className="text-lg font-bold text-[#111928] dark:text-white">Personal Information</h3>
                </div>
                <div className="p-7 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111928] dark:text-white">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#637381]" />
                        <input 
                          type="text" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#1C2434] text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111928] dark:text-white">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#637381]" />
                        <input 
                          type="text" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#1C2434] text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111928] dark:text-white">BIO</label>
                    <textarea 
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="w-full h-32 p-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#1C2434] text-sm font-medium text-[#111928] dark:text-white focus:border-[#5750F1] outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-4 pt-4">
                    <Button onClick={handleSave} disabled={loading} className="h-11 px-8 rounded-lg bg-[#5750F1] hover:bg-[#4a42e0] text-white font-bold text-sm shadow-md shadow-[#5750F1]/10 transition-all gap-2">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white dark:bg-[#24303F] rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                <div className="px-7 py-5 border-b border-[#E2E8F0] dark:border-slate-700">
                  <h3 className="text-lg font-bold text-[#111928] dark:text-white">Your Photo</h3>
                </div>
                <div className="p-7">
                  <ProfileUpload />
                  <Button onClick={handleSave} disabled={loading} className="w-full h-11 mt-8 rounded-lg bg-[#5750F1] hover:bg-[#4a42e0] text-white font-bold text-sm transition-all shadow-md shadow-[#5750F1]/10">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Update Photo
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Simplified Security Tab Content */
          <div className="lg:col-span-12 space-y-8 max-w-3xl mx-auto w-full">
            <div className="bg-white dark:bg-[#24303F] rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <div className="px-7 py-5 border-b border-[#E2E8F0] dark:border-slate-700 flex items-center gap-3">
                <Shield className="h-5 w-5 text-[#5750F1]" />
                <h3 className="text-lg font-bold text-[#111928] dark:text-white">Security & Account</h3>
              </div>
              <div className="p-7 space-y-8">
                {/* Change Password */}
                <div className="flex items-start gap-4 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                   <div className="h-12 w-12 rounded-xl bg-[#5750F1]/10 flex items-center justify-center text-[#5750F1]">
                      <Key className="h-6 w-6" />
                   </div>
                   <div className="flex-1">
                      <p className="text-base font-bold text-[#111928] dark:text-white">Change Password</p>
                      <p className="text-sm text-[#637381] dark:text-slate-400 mt-1">Last changed 3 months ago</p>
                      <Button 
                        onClick={() => setShowPassModal(true)}
                        className="mt-5 h-10 px-6 text-xs font-bold bg-white dark:bg-slate-800 text-[#111928] dark:text-white border border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        Update Password
                      </Button>
                   </div>
                </div>

                {/* 2FA */}
                <div className="flex items-start gap-4 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                   <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-[#10B981]">
                      <Smartphone className="h-6 w-6" />
                   </div>
                   <div className="flex-1">
                      <p className="text-base font-bold text-[#111928] dark:text-white">Two-Factor Authentication</p>
                      <p className="text-sm text-[#637381] dark:text-slate-400 mt-1">Secure your account with 2FA codes</p>
                      <Button className="mt-5 h-10 px-6 text-xs font-bold bg-[#10B981] hover:bg-[#0da06f] text-white">Enable 2FA</Button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Modal */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white dark:bg-[#1C2434] w-full max-w-md rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-slate-800 overflow-hidden scale-in duration-300">
              <div className="px-8 py-6 border-b border-[#E2E8F0] dark:border-slate-800">
                 <h3 className="text-lg font-bold text-[#111928] dark:text-white">Update Password</h3>
                 <p className="text-xs text-[#637381] dark:text-slate-400 mt-1">Please confirm your current password to continue.</p>
              </div>
              <div className="p-8 space-y-5">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-[#111928] dark:text-white uppercase tracking-wider">Current Password</label>
                    <div className="relative">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#637381]" />
                       <input 
                         type={showPass ? "text" : "password"}
                         value={passData.current}
                         onChange={(e) => setPassData({...passData, current: e.target.value})}
                         className="w-full h-11 pl-12 pr-12 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F9FAFB] dark:bg-[#24303F] text-sm font-medium outline-none focus:border-[#5750F1]"
                       />
                       <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2">
                          {showPass ? <EyeOff className="h-4 w-4 text-[#637381]" /> : <Eye className="h-4 w-4 text-[#637381]" />}
                       </button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-[#111928] dark:text-white uppercase tracking-wider">New Password</label>
                    <input 
                      type="password"
                      value={passData.new}
                      onChange={(e) => setPassData({...passData, new: e.target.value})}
                      className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F9FAFB] dark:bg-[#24303F] text-sm font-medium outline-none focus:border-[#5750F1]"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-[#111928] dark:text-white uppercase tracking-wider">Confirm Password</label>
                    <input 
                      type="password"
                      value={passData.confirm}
                      onChange={(e) => setPassData({...passData, confirm: e.target.value})}
                      className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-[#F9FAFB] dark:bg-[#24303F] text-sm font-medium outline-none focus:border-[#5750F1]"
                    />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => setShowPassModal(false)} className="flex-1 h-11 rounded-lg">Cancel</Button>
                    <Button onClick={handleUpdatePassword} disabled={loading} className="flex-1 h-11 rounded-lg bg-[#5750F1] text-white">
                       {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
