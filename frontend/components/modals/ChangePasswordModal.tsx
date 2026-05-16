'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError(t('passwords_not_match') || 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError(t('password_too_short') || 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No authenticated user found');

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password') {
        setError(t('incorrect_current_password') || 'Incorrect current password');
      } else {
        setError(err.message || 'Failed to update password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
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
            className="relative w-full max-w-md bg-white dark:bg-[#1C2434] shadow-2xl overflow-hidden"
          >
            {/* Header Area */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#5750F1]/10 flex items-center justify-center rounded-none border border-[#5750F1]/20">
                    <Lock className="h-5 w-5 text-[#5750F1]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#111928] dark:text-white uppercase tracking-tight">
                      {t('change_password')}
                    </h3>
                    <p className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.2em]">
                      {t('security_center')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-[#111928] dark:hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8">
              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center"
                >
                  <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h4 className="text-xl font-black text-[#111928] dark:text-white uppercase mb-2">
                    {t('password_updated')}
                  </h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {t('security_nominal')}
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#111928] dark:text-white uppercase tracking-[0.2em]">
                      {t('current_password')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input 
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pl-11 h-12 rounded-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#111928] dark:text-white uppercase tracking-[0.2em]">
                      {t('new_password')}
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input 
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-11 h-12 rounded-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#111928] dark:text-white uppercase tracking-[0.2em]">
                      {t('confirm_new_password')}
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input 
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-11 h-12 rounded-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="flex-1 h-12 rounded-none border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest"
                    >
                      {t('cancel')}
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 h-12 rounded-none bg-[#5750F1] hover:bg-[#4A44D1] text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-indigo-500/20"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {t('update_password')}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer decoration */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#5750F1]/20 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
