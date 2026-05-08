'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ResetPasswordModalProps {
  showResetPassword: string | null;
  setShowResetPassword: (id: string | null) => void;
  resetPasswordData: any;
  setResetPasswordData: (data: any) => void;
  handleResetPassword: (e: React.FormEvent) => void;
}

export const ResetPasswordModal = ({
  showResetPassword,
  setShowResetPassword,
  resetPasswordData,
  setResetPasswordData,
  handleResetPassword
}: ResetPasswordModalProps) => {
  return (
    <AnimatePresence>
      {showResetPassword && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowResetPassword(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-[#1C2434] rounded-3xl shadow-2xl p-8 text-center border border-slate-100 dark:border-slate-800">
               <div className="h-16 w-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/10">
                  <Lock className="h-8 w-8" />
               </div>
               <h3 className="text-xl font-bold text-[#111928] dark:text-white mb-2">Security Override</h3>
               <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mb-8 px-4">Generate a new secure access key for this team member.</p>
               <div className="space-y-4">
                  <Input 
                     type="password" 
                     placeholder="New Secure Password" 
                     value={resetPasswordData.newPassword}
                     onChange={(e) => setResetPasswordData({...resetPasswordData, newPassword: e.target.value})}
                     className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-[#5750F1]" 
                  />
                  <Input 
                     type="password" 
                     placeholder="Confirm Secure Password" 
                     value={resetPasswordData.confirmPassword}
                     onChange={(e) => setResetPasswordData({...resetPasswordData, confirmPassword: e.target.value})}
                     className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-[#5750F1]" 
                  />
                  <div className="flex gap-3 pt-6">
                     <Button variant="ghost" onClick={() => setShowResetPassword(null)} className="flex-1 h-12 font-bold hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</Button>
                     <Button onClick={handleResetPassword} className="flex-1 h-12 bg-[#5750F1] hover:bg-[#4A44D1] font-bold shadow-lg shadow-[#5750F1]/20">Update Key</Button>
                  </div>
               </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
