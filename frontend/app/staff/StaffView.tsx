'use client';

import { useStaffDashboard } from '@/hooks/useStaffDashboard';
import { DashboardSidebar } from '@/components/admin/DashboardSidebar';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import { StaffDashboardTab } from '@/components/staff/tabs/DashboardTab';
import { StaffInventoryTab } from '@/components/staff/tabs/InventoryTab';
import { StaffLabelsTab } from '@/components/staff/tabs/LabelsTab';
import { StaffIssuesTab } from '@/components/staff/tabs/IssuesTab';
import { SettingsTab } from '@/components/vendor/tabs/SettingsTab';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Check, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function RegularStaffPage() {
  const {
    selectedTab, setSelectedTab,
    loading, isRefreshing,
    company, branch,
    branchProducts, labels, issues,
    searchTerm, setSearchTerm,
    currentUser,
    handleLogout,
    updateStock,
    reportIssue,
    syncAllLabels,
    handleSyncLabel,
    handleUnlinkProductFromLabel,
    handleDeleteLabel,
    loadStaffData,
    openLabelNotice,
    openLabelConfirm,
    labelModal, setLabelModal,
    labelConfirm, setLabelConfirm,
    showReportIssue, setShowReportIssue,
    handleProfileUpload,
    updateProfile
  } = useStaffDashboard();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#1C2434]">
        <div className="h-16 w-16 bg-[#5750F1] flex items-center justify-center animate-pulse mb-6">
           <RefreshCw className="h-8 w-8 text-white animate-spin" />
        </div>
        <p className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.3em] animate-pulse">Loading Branch Data...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-[#121926] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 h-full flex-shrink-0">
        <DashboardSidebar 
          currentUser={currentUser as any}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[101] w-72 lg:hidden"
            >
              <DashboardSidebar 
                currentUser={currentUser as any}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
                onLogout={handleLogout}
                onClose={() => setMobileMenuOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <DashboardHeader 
          onMenuOpen={() => setMobileMenuOpen(true)}
          onRefresh={loadStaffData}
          title={`${branch?.name || 'Branch'} Dashboard`}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onTabChange={setSelectedTab}
        />

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-transparent">
          <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10">
            <AnimatePresence mode="wait">
              {selectedTab === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <StaffDashboardTab 
                    branchProducts={branchProducts}
                    labels={labels}
                    issues={issues}
                    onTabChange={setSelectedTab}
                    onRefresh={loadStaffData}
                  />
                </motion.div>
              )}

              {selectedTab === 'inventory' && (
                <motion.div 
                  key="inventory"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <StaffInventoryTab 
                    branchProducts={branchProducts}
                    onUpdateStock={updateStock}
                    onRefresh={loadStaffData}
                  />
                </motion.div>
              )}

              {selectedTab === 'labels' && (
                <motion.div 
                  key="labels"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <StaffLabelsTab 
                    labels={labels}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    isRefreshing={isRefreshing}
                    handleSyncAllLabels={syncAllLabels}
                    handleSyncLabel={handleSyncLabel}
                    handleUnlinkProductFromLabel={handleUnlinkProductFromLabel}
                    handleDeleteLabel={handleDeleteLabel}
                    openLabelNotice={openLabelNotice}
                    openLabelConfirm={openLabelConfirm}
                    onReportIssue={(id) => {
                      setShowReportIssue(true);
                    }}
                  />
                </motion.div>
              )}

              {selectedTab === 'issues' && (
                <motion.div 
                  key="issues"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <StaffIssuesTab 
                    issues={issues}
                    onRefresh={loadStaffData}
                    onReportNew={() => setShowReportIssue(true)}
                  />
                </motion.div>
              )}

              {selectedTab === 'settings' && (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <SettingsTab 
                    currentUser={currentUser}
                    company={company}
                    handleProfileUpload={handleProfileUpload}
                    updateProfile={updateProfile}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Unified Modals */}
      <AnimatePresence>
        {labelModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setLabelModal(null)} />
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#1C2434] p-8 rounded-none border border-slate-100 dark:border-slate-800 shadow-2xl max-w-sm w-full text-center">
                <div className={`h-16 w-16 mx-auto mb-6 flex items-center justify-center rounded-none ${
                  labelModal.tone === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                  labelModal.tone === 'error' ? 'bg-rose-500/10 text-rose-500' :
                  'bg-indigo-500/10 text-[#5750F1]'
                }`}>
                   {labelModal.tone === 'success' ? <Check className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
                </div>
                <h3 className="text-xl font-black text-[#111928] dark:text-white uppercase tracking-tight mb-2">{labelModal.title}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">{labelModal.message}</p>
                <Button onClick={() => setLabelModal(null)} className="w-full h-12 bg-slate-900 text-white rounded-none border-none text-[10px] font-black uppercase tracking-widest">Acknowledge</Button>
             </motion.div>
          </div>
        )}

        {showReportIssue && (
          <ReportIssueModal 
            isOpen={showReportIssue}
            onClose={() => setShowReportIssue(false)}
            onSubmit={reportIssue}
            labels={labels}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for reporting issues
function ReportIssueModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  labels 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSubmit: (id: string, msg: string, prio: any) => Promise<void>,
  labels: any[]
}) {
  const [form, setForm] = useState({ id: '', msg: '', prio: 'medium' as const });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const filteredLabels = labels.filter(l => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return (
      l.labelId.toLowerCase().includes(s) ||
      (l.productName || '').toLowerCase().includes(s) ||
      (l.location || '').toLowerCase().includes(s)
    );
  });

  const selectedLabel = labels.find(l => l.labelId === form.id);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative bg-white dark:bg-[#1C2434] p-8 rounded-none border border-slate-100 dark:border-slate-800 shadow-2xl max-w-md w-full">
          <div className="flex items-center gap-3 mb-8">
             <div className="h-10 w-10 bg-rose-500 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-white" />
             </div>
             <div>
                <h3 className="text-lg font-black text-[#111928] dark:text-white uppercase tracking-tight">Report Incident</h3>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Hardware / Stock Discrepancy</p>
             </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tag / Item ID</label>
                <Input 
                   value={searchQuery || form.id} 
                   onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearching(true);
                   }} 
                   onFocus={() => setIsSearching(true)}
                   className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold" 
                   placeholder="Search ID, Product, or Shelf..." 
                />

                <AnimatePresence>
                   {isSearching && (
                      <>
                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-10" onClick={() => setIsSearching(false)} />
                         <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1C2434] border border-slate-200 dark:border-slate-800 shadow-xl z-20 max-h-[200px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                            {filteredLabels.length > 0 ? filteredLabels.map(l => (
                               <button
                                  key={l.id}
                                  type="button"
                                  onClick={() => {
                                     setForm({...form, id: l.labelId});
                                     setSearchQuery('');
                                     setIsSearching(false);
                                  }}
                                  className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                               >
                                  <div className="flex items-center justify-between gap-4 mb-1">
                                     <span className="text-[10px] font-black text-[#111928] dark:text-white uppercase tracking-widest">{l.labelId}</span>
                                     {l.location && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{l.location}</span>}
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-500 truncate">{l.productName || 'Unassigned Node'}</p>
                               </button>
                            )) : (
                               <div className="p-8 text-center">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching tags</p>
                               </div>
                            )}
                         </motion.div>
                      </>
                   )}
                </AnimatePresence>

                {selectedLabel && !isSearching && (
                   <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4 animate-in fade-in zoom-in-95">
                      <div className="flex-1 min-w-0">
                         <p className="text-[10px] font-black text-[#111928] dark:text-white uppercase truncate">{selectedLabel.productName || 'Hardware Node'}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedLabel.labelId} • {selectedLabel.location || 'Warehouse'}</p>
                      </div>
                      <span className="text-[8px] font-black bg-rose-500 text-white px-1.5 py-0.5 uppercase">Linked</span>
                   </div>
                )}
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incident Details</label>
                <textarea value={form.msg} onChange={(e) => setForm({...form, msg: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold outline-none focus:border-rose-500 min-h-[100px]" placeholder="Describe the issue..." />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <Button onClick={onClose} variant="ghost" className="h-12 rounded-none text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                <Button 
                  disabled={loading || !form.id}
                  onClick={async () => {
                    setLoading(true);
                    await onSubmit(form.id, form.msg, form.prio);
                    setLoading(false);
                    onClose();
                  }} 
                  className="h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-none border-none text-[10px] font-black uppercase tracking-widest"
                >
                  {loading ? 'Submitting...' : 'Send Report'}
                </Button>
             </div>
          </div>
       </motion.div>
    </div>
  );
}
