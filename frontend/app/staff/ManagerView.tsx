'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { DashboardSidebar } from '@/components/admin/DashboardSidebar';
import { DashboardHeader } from '@/components/admin/DashboardHeader';

import CategoryModal from '@/components/modals/CategoryModal';
import ProductModal from '@/components/modals/ProductModal';

// Same vendor-quality components
import { DashboardTab } from '@/components/vendor/tabs/DashboardTab';
import { ProductsTab } from '@/components/vendor/tabs/ProductsTab';
import { CategoriesTab } from '@/components/vendor/tabs/CategoriesTab';
import { LabelsTab } from '@/components/vendor/tabs/LabelsTab';
import { StaffTab } from '@/components/vendor/tabs/StaffTab';
import { SupportTab } from '@/components/vendor/tabs/SupportTab';
import { SettingsTab } from '@/components/vendor/tabs/SettingsTab';
import { StaffManagementModal } from '@/components/vendor/StaffManagementModal';
import { AssignProductModal } from '@/components/vendor/AssignProductModal';
import { ManualDiscountModal } from '@/components/vendor/ManualDiscountModal';
import { ResetPasswordModal } from '@/components/vendor/ResetPasswordModal';
import { LabelDetailModal } from '@/components/vendor/LabelDetailModal';
import { ProvisionLabelModal } from '@/components/vendor/ProvisionLabelModal';
import { SmartAutoMapModal } from '@/components/vendor/SmartAutoMapModal';
import { LabelNoticeModal } from '@/components/vendor/LabelNoticeModal';
import { ReportIssueModal } from '@/components/vendor/ReportIssueModal';
import { PromotionsTab } from '@/components/vendor/tabs/PromotionsTab';
import { PromotionManagementModal } from '@/components/vendor/PromotionManagementModal';

// Same business logic engine as vendor
import { useVendorDashboard } from '@/hooks/useVendorDashboard';
import { StaffIssuesTab } from '@/components/staff/tabs/IssuesTab';
import { ActivityTab } from '@/components/vendor/tabs/ActivityTab';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function ManagerStaffPage() {
  const {
    selectedTab, setSelectedTab,
    loading,
    isRefreshing,
    company,
    branches,
    products,
    branchProducts,
    categories,
    staffMembers,
    labels,
    issues,
    selectedBranchId, setSelectedBranchId,
    selectedFilterCategory, setSelectedFilterCategory,
    searchTerm, setSearchTerm,
    promotions,
    showCreatePromotion, setShowCreatePromotion,
    editingPromotion, setEditingPromotion,
    promotionForm, setPromotionForm,
    createPromotion, updatePromotion, handleDeletePromotion,
    paginatedProducts,
    totalProductPages,
    productPage, setProductPage,
    mobileNavOpen, setMobileNavOpen,
    showCreateStaff, setShowCreateStaff,
    showProductModal, setShowProductModal,
    handleEditProduct,
    showEditStaff, setShowEditStaff,
    showResetPassword, setShowResetPassword,
    showCategoryModal, setShowCategoryModal,
    selectedCategory, setSelectedCategory,
    selectedProductForEdit, setSelectedProductForEdit,
    assignProductModal, setAssignProductModal,
    assignSearchQuery, setAssignSearchQuery,
    activeDiscountModal, setActiveDiscountModal,
    labelModal, setLabelModal,
    staffForm, setStaffForm,
    editStaffForm, setEditStaffForm,
    resetPasswordData, setResetPasswordData,
    handleLogout,
    createStaff, updateStaff, handleResetPassword,
    handleDeleteProduct,
    handleSyncAllLabels,
    assignProductToLabel,
    executeManualDiscount,
    getDisplayStockForProduct,
    currentUser,
    loadVendorData,
    openLabelConfirm,
    openLabelNotice,
    createProductFromModal,
    updateProduct,
    handleDeleteStaff,
    handleDeleteCategory,
    handleProfileUpload,
    updateProfile,
    handleUnlinkProductFromLabel,
    handleDeleteLabel,
    selectedLabel, setSelectedLabel,
    showProvisionModal, setShowProvisionModal,
    provisionLabel,
    handleBulkProvision,
    updateLabelLocation,
    bulkAutoMapLocations,
    showReportIssue, setShowReportIssue,
    reportIssue,
    updateIssueStatus,
    addIssueNote,
    downloadImportTemplate,
    handleBulkImport,
    handleBulkExport
  } = useVendorDashboard();

  const [showSmartMapModal, setShowSmartMapModal] = useState(false);
  
  // Filter branches to only show the manager's branch
  const managerBranches = currentUser?.branchId 
    ? branches.filter(b => b.id === currentUser.branchId)
    : [];

  const unsetLabelsCount = labels.filter(l =>
    (selectedBranchId === 'all' || l.branchId === selectedBranchId) &&
    (!l.location || l.location.toLowerCase().includes('unset'))
  ).length;

  const { t } = useLanguage();
  if (loading && !company) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#1C2434]">
        <div className="h-16 w-16 bg-[#5750F1] flex items-center justify-center animate-pulse mb-6">
          <RefreshCw className="h-8 w-8 text-white animate-spin" />
        </div>
        <p className="text-[10px] font-black text-[#5750F1] uppercase tracking-[0.3em] animate-pulse">{t('loading_branch_data')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#111928] overflow-hidden transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[101] w-72 lg:hidden"
            >
              <DashboardSidebar
                currentUser={currentUser as any}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab as any}
                onLogout={handleLogout}
                onClose={() => setMobileNavOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="hidden lg:block w-64 flex-shrink-0">
        <DashboardSidebar
          currentUser={currentUser as any}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab as any}
          onLogout={handleLogout}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          onMenuOpen={() => setMobileNavOpen(true)}
          onRefresh={loadVendorData}
          title={t(selectedTab) || selectedTab}
          isRefreshing={isRefreshing || loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onTabChange={setSelectedTab as any}
        />

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#111928] p-4 lg:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {selectedTab === 'dashboard' && (
                <DashboardTab
                  currentUser={currentUser}
                  company={company as any}
                  branches={branches as any}
                  labels={labels}
                  branchProducts={branchProducts}
                  issues={issues}
                  selectedBranchId={selectedBranchId}
                  setSelectedBranchId={setSelectedBranchId}
                  setSelectedTab={setSelectedTab as any}
                  setShowCreateBranch={() => {}}
                />
              )}

              {selectedTab === 'products' && (
                <ProductsTab
                  currentUser={currentUser}
                  products={products}
                  branches={managerBranches}
                  categories={categories}
                  selectedBranchId={selectedBranchId}
                  setSelectedBranchId={setSelectedBranchId}
                  selectedFilterCategory={selectedFilterCategory}
                  setSelectedFilterCategory={setSelectedFilterCategory}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  paginatedProducts={paginatedProducts}
                  totalProductPages={totalProductPages}
                  productPage={productPage}
                  setProductPage={setProductPage}
                  setShowProductModal={setShowProductModal}
                  setShowCategoryModal={setShowCategoryModal}
                  setShowEditProduct={handleEditProduct}
                  handleDeleteProduct={handleDeleteProduct}
                  getDisplayStockForProduct={getDisplayStockForProduct}
                  handleBulkImport={handleBulkImport}
                  handleBulkExport={handleBulkExport}
                  downloadImportTemplate={downloadImportTemplate}
                />
              )}

              {selectedTab === 'categories' && (
                <CategoriesTab
                  categories={categories}
                  products={products}
                  setShowCategoryModal={setShowCategoryModal}
                  setSelectedCategory={setSelectedCategory}
                  handleDeleteCategory={handleDeleteCategory}
                />
              )}

              {selectedTab === 'labels' && (
                <LabelsTab 
                  currentUser={currentUser}
                  labels={labels}
                  branches={managerBranches}
                  selectedBranchId={selectedBranchId}
                  setSelectedBranchId={setSelectedBranchId}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  handleSyncAllLabels={handleSyncAllLabels}
                  handleDeleteLabel={handleDeleteLabel}
                  handleUnlinkProductFromLabel={handleUnlinkProductFromLabel}
                  setAssignProductModal={setAssignProductModal}
                  setActiveDiscountModal={setActiveDiscountModal}
                  openLabelNotice={openLabelNotice}
                  setSelectedLabel={setSelectedLabel}
                  isRefreshing={isRefreshing}
                  showProvisionModal={showProvisionModal}
                  setShowProvisionModal={setShowProvisionModal}
                  setShowSmartMapModal={setShowSmartMapModal}
                  unsetLabelsCount={unsetLabelsCount}
                  bulkAutoMapLocations={bulkAutoMapLocations}
                  handleBulkProvision={handleBulkProvision}
                  provisionLabel={provisionLabel}
                  openLabelConfirm={openLabelConfirm}
                />
              )}

              {selectedTab === 'staff' && (
                <StaffTab
                  staffMembers={staffMembers}
                  branches={managerBranches}
                  setShowCreateStaff={setShowCreateStaff}
                  setShowEditStaff={setShowEditStaff}
                  setShowResetPassword={setShowResetPassword}
                  handleDeleteStaff={handleDeleteStaff}
                  selectedBranchId={selectedBranchId}
                  setSelectedBranchId={setSelectedBranchId}
                />
              )}

              {selectedTab === 'issues' && (
                <StaffIssuesTab
                  issues={issues as any}
                  onRefresh={loadVendorData}
                  onReportNew={() => setShowReportIssue(true)}
                  onUpdateStatus={updateIssueStatus}
                  onAddNote={addIssueNote}
                />
              )}

              {selectedTab === 'promotions' && (
                <PromotionsTab
                  promotions={promotions}
                  setShowCreatePromotion={setShowCreatePromotion}
                  setEditingPromotion={setEditingPromotion}
                  setPromotionForm={setPromotionForm}
                  handleDeletePromotion={handleDeletePromotion}
                />
              )}

              {selectedTab === 'activity' && (
                <ActivityTab 
                  currentUser={currentUser}
                  branches={managerBranches}
                  onTabChange={setSelectedTab}
                />
              )}

              {selectedTab === 'settings' && (
                <SettingsTab
                  currentUser={currentUser}
                  company={company}
                  handleProfileUpload={handleProfileUpload}
                  updateProfile={updateProfile}
                />
              )}

              {selectedTab === 'support' && <SupportTab />}
            </motion.div>
          </AnimatePresence>

        </main>
      </div>

      {/* All the same vendor modals */}
      <ManualDiscountModal
        activeDiscountModal={activeDiscountModal}
        setActiveDiscountModal={setActiveDiscountModal}
        executeManualDiscount={executeManualDiscount}
        openLabelNotice={openLabelNotice}
      />

      <AssignProductModal
        assignProductModal={assignProductModal}
        setAssignProductModal={setAssignProductModal}
        products={products}
        assignSearchQuery={assignSearchQuery}
        setAssignSearchQuery={setAssignSearchQuery}
        assignProductToLabel={assignProductToLabel}
      />

      <PromotionManagementModal
        showCreatePromotion={showCreatePromotion}
        setShowCreatePromotion={setShowCreatePromotion}
        editingPromotion={editingPromotion}
        setEditingPromotion={setEditingPromotion}
        promotionForm={promotionForm}
        setPromotionForm={setPromotionForm}
        createPromotion={createPromotion}
        updatePromotion={updatePromotion}
        products={products}
      />

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        companyId={currentUser?.companyId || ''}
        category={selectedCategory}
        onCategoryChange={loadVendorData}
      />

      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={selectedProductForEdit}
        categories={categories}
        onSubmit={async (productData) => {
          if (selectedProductForEdit) {
            await updateProduct(selectedProductForEdit.id, productData);
          } else {
            await createProductFromModal(productData);
          }
        }}
      />

      <StaffManagementModal
        showCreateStaff={showCreateStaff}
        setShowCreateStaff={setShowCreateStaff}
        showEditStaff={showEditStaff}
        setShowEditStaff={setShowEditStaff}
        staffForm={staffForm}
        setStaffForm={setStaffForm}
        editStaffForm={editStaffForm}
        setEditStaffForm={setEditStaffForm}
        branches={managerBranches}
        createStaff={createStaff}
        updateStaff={updateStaff}
        currentUser={currentUser}
      />

      <ResetPasswordModal
        showResetPassword={showResetPassword}
        setShowResetPassword={setShowResetPassword}
        resetPasswordData={resetPasswordData}
        setResetPasswordData={setResetPasswordData}
        handleResetPassword={handleResetPassword}
      />

      <ProvisionLabelModal
        isOpen={showProvisionModal}
        onClose={() => setShowProvisionModal(false)}
        onProvision={provisionLabel}
        branches={managerBranches}
        selectedBranchId={selectedBranchId}
        existingLabels={labels}
      />

      <SmartAutoMapModal
        isOpen={showSmartMapModal}
        onClose={() => setShowSmartMapModal(false)}
        onConfirm={(prefix, forceAll) => bulkAutoMapLocations(selectedBranchId, prefix, forceAll)}
        count={unsetLabelsCount}
      />

      <LabelNoticeModal modal={labelModal} onClose={() => setLabelModal(null)} />

      <LabelDetailModal
        label={selectedLabel}
        onClose={() => setSelectedLabel(null)}
        onSync={(id) => {
          openLabelNotice(t('syncing'), `${t('requesting_update')} ${id.slice(0, 8)}...`, 'info');
          setTimeout(() => {
            setSelectedLabel(null);
            openLabelNotice(t('sync_complete'), t('display_updated'), 'success');
          }, 1500);
        }}
        onUpdateLocation={updateLabelLocation}
        onOpenDiscount={(l) => setActiveDiscountModal({
          isOpen: true,
          labelId: l.id,
          productId: l.productId || '',
          productName: l.productName || 'Unknown Product',
          currentPrice: l.currentPrice || 0
        })}
        onAssign={(labelId, branchId) => setAssignProductModal({ labelId, branchId })}
        onUnlink={handleUnlinkProductFromLabel}
      />

      <ReportIssueModal
        isOpen={showReportIssue}
        onClose={() => setShowReportIssue(false)}
        onSubmit={reportIssue}
        labels={labels}
        selectedBranchId={selectedBranchId}
      />
    </div>
  );
}
