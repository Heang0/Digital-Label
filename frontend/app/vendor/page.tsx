'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  LayoutDashboard,
  Package,
  Users,
  Tag,
  Percent,
  Settings,
  DollarSign
} from 'lucide-react';
import { DashboardSidebar } from '@/components/admin/DashboardSidebar';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import CategoryModal from '@/components/modals/CategoryModal';
import ProductModal from '@/components/modals/ProductModal';

// Modular Vendor Components
import { DashboardTab } from '@/components/vendor/tabs/DashboardTab';
import { ProductsTab } from '@/components/vendor/tabs/ProductsTab';
import { CategoriesTab } from '@/components/vendor/tabs/CategoriesTab';
import { LabelsTab } from '@/components/vendor/tabs/LabelsTab';
import { StaffTab } from '@/components/vendor/tabs/StaffTab';
import { PromotionsTab } from '@/components/vendor/tabs/PromotionsTab';
import { SalesTab } from '@/components/vendor/tabs/SalesTab';
import { SupportTab } from '@/components/vendor/tabs/SupportTab';
import { SettingsTab } from '@/components/vendor/tabs/SettingsTab';
import { StaffManagementModal } from '@/components/vendor/StaffManagementModal';
import { PromotionManagementModal } from '@/components/vendor/PromotionManagementModal';
import { AssignProductModal } from '@/components/vendor/AssignProductModal';
import { ManualDiscountModal } from '@/components/vendor/ManualDiscountModal';
import { ResetPasswordModal } from '@/components/vendor/ResetPasswordModal';
import { LabelDetailModal } from '@/components/vendor/LabelDetailModal';
import { ProvisionLabelModal } from '@/components/vendor/ProvisionLabelModal';
import { SmartAutoMapModal } from '@/components/vendor/SmartAutoMapModal';

// Business Logic Hook
import { useVendorDashboard } from '@/hooks/useVendorDashboard';

export default function VendorDashboard() {
  const {
    selectedTab, setSelectedTab,
    loading,
    isRefreshing,
    company,
    branches,
    products,
    categories,
    staffMembers,
    labels,
    promotions,
    issues,
    selectedBranchId, setSelectedBranchId,
    selectedFilterCategory, setSelectedFilterCategory,
    searchTerm, setSearchTerm,
    paginatedProducts,
    totalProductPages,
    productPage, setProductPage,
    mobileNavOpen, setMobileNavOpen,
    showCreateStaff, setShowCreateStaff,
    showProductModal, setShowProductModal,
    showCreateBranch, setShowCreateBranch,
    showCreatePromotion, setShowCreatePromotion,
    editingPromotion, setEditingPromotion,
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
    promotionForm, setPromotionForm,
    resetPasswordData, setResetPasswordData,
    handleLogout,
    createStaff, updateStaff, handleResetPassword,
    createPromotion, updatePromotion,
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
    handleDeletePromotion,
    handleDeleteCategory,
    handleProfileUpload,
    handleUnlinkProductFromLabel,
    handleDeleteLabel,
    selectedLabel, setSelectedLabel,
    showProvisionModal, setShowProvisionModal,
    provisionLabel,
    handleBulkProvision,
    updateLabelLocation,
    bulkAutoMapLocations
  } = useVendorDashboard();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const editLabelId = searchParams.get('editLabel');
    
    if (editLabelId && labels.length > 0) {
      const targetLabel = labels.find(l => l.id === editLabelId);
      if (targetLabel) {
        setSelectedTab('labels' as any);
        setSelectedLabel(targetLabel);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [labels, setSelectedLabel, setSelectedTab]);

  const [showSmartMapModal, setShowSmartMapModal] = useState(false);
  const unsetLabelsCount = labels.filter(l =>
    (selectedBranchId === 'all' || l.branchId === selectedBranchId) &&
    (!l.location || l.location.toLowerCase().includes('unset'))
  ).length;

  if (!currentUser || currentUser.role !== 'vendor') return null;

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

      <div className="hidden lg:block w-72 flex-shrink-0">
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
          title={selectedTab}
          isRefreshing={loading}
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
              {loading && !company && (
                <div className="flex items-center gap-3 p-4 mb-6 glass rounded-xl text-sm font-bold text-[#5750F1]">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Syncing Platform Data...
                </div>
              )}

              {selectedTab === 'dashboard' && (
                <DashboardTab
                  currentUser={currentUser}
                  company={company}
                  branches={branches}
                  labels={labels}
                  selectedBranchId={selectedBranchId}
                  setSelectedBranchId={setSelectedBranchId}
                  setSelectedTab={setSelectedTab as any}
                  setShowCreateBranch={setShowCreateBranch}
                />
              )}

              {selectedTab === 'products' && (
                <ProductsTab
                  products={products}
                  branches={branches}
                  categories={categories}
                  selectedBranchId={selectedBranchId}
                  setSelectedBranchId={setSelectedBranchId}
                  selectedFilterCategory={selectedFilterCategory}
                  setSelectedFilterCategory={setSelectedFilterCategory}
                  paginatedProducts={paginatedProducts}
                  totalProductPages={totalProductPages}
                  productPage={productPage}
                  setProductPage={setProductPage}
                  setShowProductModal={setShowProductModal}
                  setShowCategoryModal={setShowCategoryModal}
                  setShowEditProduct={handleEditProduct}
                  handleDeleteProduct={handleDeleteProduct}
                  getDisplayStockForProduct={getDisplayStockForProduct}
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
                  labels={labels}
                  branches={branches}
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
                  openLabelConfirm={openLabelConfirm}
                />
              )}

              {selectedTab === 'staff' && (
                <StaffTab
                  staffMembers={staffMembers}
                  branches={branches}
                  setShowCreateStaff={setShowCreateStaff}
                  setShowEditStaff={setShowEditStaff}
                  setShowResetPassword={setShowResetPassword}
                  handleDeleteStaff={handleDeleteStaff}
                  selectedBranchId={selectedBranchId}
                  setSelectedBranchId={setSelectedBranchId}
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

              {selectedTab === 'sales' && (
                <SalesTab
                  currentUser={currentUser}
                  branches={branches}
                  selectedBranchId={selectedBranchId}
                />
              )}

              {selectedTab === 'settings' && (
                <SettingsTab
                  currentUser={currentUser}
                  company={company}
                  handleProfileUpload={handleProfileUpload}
                />
              )}

              {selectedTab === 'support' && <SupportTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Notice Modal */}
      {labelModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setLabelModal(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-sm bg-white dark:bg-[#1C2434] rounded-2xl shadow-2xl overflow-hidden p-8 text-center border border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-[#111928] dark:text-white mb-2">{labelModal.title}</h3>
            <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mb-8">{labelModal.message}</p>
            <div className="flex justify-center gap-3">
              {labelModal.cancelLabel && (
                <button onClick={() => setLabelModal(null)} className="px-6 py-2.5 text-xs font-bold text-[#637381] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">{labelModal.cancelLabel}</button>
              )}
              <button onClick={() => { labelModal.onConfirm?.(); setLabelModal(null); }} className="px-8 py-2.5 bg-[#5750F1] text-white rounded-xl text-xs font-bold hover:bg-[#4A44D1] shadow-lg shadow-[#5750F1]/20 transition-all">{labelModal.confirmLabel || 'Acknowledge'}</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modals */}
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
        branches={branches}
        createStaff={createStaff}
        updateStaff={updateStaff}
      />

      <ResetPasswordModal
        showResetPassword={showResetPassword}
        setShowResetPassword={setShowResetPassword}
        resetPasswordData={resetPasswordData}
        setResetPasswordData={setResetPasswordData}
        handleResetPassword={handleResetPassword}
      />

      <PromotionManagementModal
        showCreatePromotion={showCreatePromotion}
        setShowCreatePromotion={setShowCreatePromotion}
        editingPromotion={editingPromotion}
        setEditingPromotion={setEditingPromotion}
        promotionForm={promotionForm}
        setPromotionForm={setPromotionForm}
        products={products}
        createPromotion={createPromotion}
        updatePromotion={updatePromotion}
      />

      <ProvisionLabelModal
        isOpen={showProvisionModal}
        onClose={() => setShowProvisionModal(false)}
        onProvision={provisionLabel}
        branches={branches}
        selectedBranchId={selectedBranchId}
        existingLabels={labels}
      />

      <SmartAutoMapModal
        isOpen={showSmartMapModal}
        onClose={() => setShowSmartMapModal(false)}
        onConfirm={(prefix, forceAll) => bulkAutoMapLocations(selectedBranchId, prefix, forceAll)}
        count={unsetLabelsCount}
      />

      <LabelDetailModal
        label={selectedLabel}
        onClose={() => setSelectedLabel(null)}
        onSync={(id) => {
          openLabelNotice('Syncing', `Requesting real-time update for tag ${id.slice(0, 8)}...`, 'info');
          setTimeout(() => {
            setSelectedLabel(null);
            openLabelNotice('Sync Complete', 'Hardware display updated successfully.', 'success');
          }, 1500);
        }}
        onUpdateLocation={updateLabelLocation}
        onOpenDiscount={(l) => setActiveDiscountModal({
          labelId: l.id,
          productId: l.productId || '',
          branchId: l.branchId || '',
          currentPercent: l.discountPercent || 0
        })}
        onAssign={(labelId, branchId) => setAssignProductModal({ labelId, branchId })}
        onUnlink={handleUnlinkProductFromLabel}
      />
    </div>
  );
}
