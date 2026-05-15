'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, User as UserIcon, Shield, Crown, Package, Zap, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Branch, StaffMember, StaffPermissions } from '@/types';
import { ROLE_PRESETS, PERMISSION_LABELS, getPermissionsForRole, StaffPosition } from '@/lib/role-presets';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface StaffManagementModalProps {
  showCreateStaff: boolean;
  showEditStaff: StaffMember | null;
  setShowCreateStaff: (show: boolean) => void;
  setShowEditStaff: (staff: StaffMember | null) => void;
  staffForm: any;
  setStaffForm: (form: any) => void;
  editStaffForm: any;
  setEditStaffForm: (form: any) => void;
  createStaff: (e: React.FormEvent) => void;
  updateStaff: (e: React.FormEvent) => void;
  branches: Branch[];
  currentUser: any;
}

const ROLE_ICONS: Record<string, any> = {
  'Manager': Crown,
  'Cashier': ShoppingCart,
  'Label Operator': Zap,
};

const ROLE_COLORS: Record<string, string> = {
  'Manager': 'bg-indigo-500',
  'Cashier': 'bg-emerald-500',
  'Label Operator': 'bg-cyan-500',
};

export const StaffManagementModal = ({
  showCreateStaff,
  showEditStaff,
  setShowCreateStaff,
  setShowEditStaff,
  staffForm,
  setStaffForm,
  editStaffForm,
  setEditStaffForm,
  createStaff,
  updateStaff,
  branches,
  currentUser
}: StaffManagementModalProps) => {
  const { t } = useLanguage();
  const isOpen = showCreateStaff || showEditStaff;
  const isCreate = showCreateStaff;
  const currentForm = isCreate ? staffForm : editStaffForm;
  const setCurrentForm = isCreate ? setStaffForm : setEditStaffForm;

  const handleClose = () => {
    setShowCreateStaff(false);
    setShowEditStaff(null);
  };

  // Auto-set permissions when position changes
  const handlePositionChange = (position: string) => {
    const permissions = getPermissionsForRole(position);
    setCurrentForm({
      ...currentForm,
      position,
      permissions
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#1C2434] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-lg md:text-xl font-black text-[#111928] dark:text-white uppercase tracking-tight">
                  {isCreate ? t('add_team_member') : t('edit_staff_member')}
                </h3>
                <p className="text-[10px] font-bold text-[#637381] mt-1 uppercase tracking-widest">{t('role_preset')} — {t('access_permissions')}.</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClose}
                className="h-10 w-10 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={isCreate ? createStaff : updateStaff} className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">{t('full_name')}</label>
                  <Input 
                    required
                    placeholder="e.g. John Doe"
                    value={currentForm.name}
                    onChange={(e) => setCurrentForm({...currentForm, name: e.target.value})}
                    className="h-12 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-none text-sm font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">{t('email_address')}</label>
                  <Input 
                    required
                    type="email"
                    placeholder="john@example.com"
                    value={currentForm.email}
                    onChange={(e) => setCurrentForm({...currentForm, email: e.target.value})}
                    className="h-12 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-none text-sm font-bold"
                  />
                </div>
                {branches.length > 1 ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">{t('assign_branch')}</label>
                    <select
                      required
                      className="w-full h-12 px-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm font-bold outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all text-[#111928] dark:text-white"
                      value={currentForm.branchId}
                      onChange={(e) => setCurrentForm({...currentForm, branchId: e.target.value})}
                    >
                      <option value="">{t('select_branch_placeholder')}</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                ) : (
                  // Auto-set branch for single-branch managers
                  <div className="hidden">
                    <input type="hidden" value={branches[0]?.id || ''} ref={(el) => {
                      if (el && !currentForm.branchId && branches[0]) {
                        setCurrentForm({...currentForm, branchId: branches[0].id});
                      }
                    }} />
                  </div>
                )}
                {isCreate && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">{t('temp_password')}</label>
                    <Input 
                      required
                      type="password"
                      value={currentForm.password}
                      onChange={(e) => setCurrentForm({...currentForm, password: e.target.value})}
                      className="h-12 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-none text-sm font-bold"
                    />
                  </div>
                )}
                {!isCreate && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">{t('status')}</label>
                    <select
                      className="w-full h-12 px-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm font-bold outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all text-[#111928] dark:text-white"
                      value={editStaffForm.status}
                      onChange={(e) => setEditStaffForm({...editStaffForm, status: e.target.value as any})}
                    >
                      <option value="active">{t('active')}</option>
                      <option value="inactive">{t('inactive')}</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Role Selection — The Star of the Show */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Shield className="h-4 w-4 text-[#5750F1]" />
                  <h4 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('select_role')}</h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-auto">{t('permissions_auto_apply')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.values(ROLE_PRESETS)
                    .filter(preset => currentUser?.role !== 'staff' || preset.position !== 'Manager')
                    .map((preset) => {
                      const isSelected = currentForm.position === preset.position;
                      const RoleIcon = ROLE_ICONS[preset.position] || UserIcon;
                      const bgColor = ROLE_COLORS[preset.position] || 'bg-slate-500';

                      return (
                        <button
                          key={preset.position}
                          type="button"
                          onClick={() => handlePositionChange(preset.position)}
                          className={`relative p-4 border-2 text-left transition-all ${
                            isSelected 
                              ? 'border-[#5750F1] bg-[#5750F1]/5 shadow-lg shadow-[#5750F1]/10' 
                              : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 h-5 w-5 bg-[#5750F1] flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <div className={`h-10 w-10 ${bgColor} flex items-center justify-center mb-3`}>
                            <RoleIcon className="h-5 w-5 text-white" />
                          </div>
                          <p className="text-xs font-black text-[#111928] dark:text-white uppercase tracking-tight mb-1">{t(preset.label)}</p>
                          <p className="text-[9px] font-medium text-slate-400 leading-relaxed line-clamp-2">{t(preset.description)}</p>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Auto-Applied Permissions Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <h4 className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-tight">{t('granted_permissions')}</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(PERMISSION_LABELS).map(([key, { label, icon }]) => {
                    const granted = currentForm.permissions?.[key as keyof StaffPermissions] as boolean;
                    const Icon = icon;
                    return (
                      <div 
                        key={key}
                        className={`flex items-center gap-2.5 px-3 py-2.5 border transition-all ${
                          granted 
                            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' 
                            : 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 opacity-40'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${granted ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                          granted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 line-through'
                        }`}>{t(label)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleClose}
                  className="h-12 px-6 font-black text-[10px] uppercase tracking-widest rounded-none"
                >
                  {t('cancel')}
                </Button>
                <Button 
                  type="submit"
                  className="h-12 px-8 bg-[#5750F1] hover:bg-[#4A44D1] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#5750F1]/20 rounded-none"
                >
                  {isCreate ? t('add_team_member') : t('update')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
