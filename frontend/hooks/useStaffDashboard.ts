'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/user-store';
import { applyDiscountToLabel, clearDiscountFromLabel } from '@/lib/label-discount';
import { laravelApi, API_BASE_URL } from '@/lib/api';
import { createNotification } from '@/lib/notifications';
import { Timestamp, collection, getDocs, query, where, setDoc, addDoc, deleteDoc, doc as fsDoc } from 'firebase/firestore';
import { logOut, db } from '@/lib/firebase';
import { compressImage } from '@/lib/image-compress';


// INTERFACES
export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager?: string;
  companyId: string;
  status: 'active' | 'inactive';
  location?: string;
}

export interface Company {
  id: string;
  name: string;
  code?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  productCode?: string;
  category: string;
  basePrice: number;
  imageUrl?: string;
  companyId: string;
}

export interface BranchProduct {
  id: string;
  productId: string;
  branchId: string;
  companyId: string;
  currentPrice: number;
  stock: number;
  minStock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: Timestamp;
  productDetails?: Product;
}

export interface DigitalLabel {
  id: string;
  labelId: string;
  labelCode?: string;
  productId: string | null;
  productName?: string;
  productSku?: string | null;
  productCode?: string;
  branchId: string;
  currentPrice: number | null;
  basePrice?: number | null;
  finalPrice?: number | null;
  discountPercent?: number | null;
  discountPrice?: number | null;
  battery: number;
  status: 'active' | 'inactive' | 'low-battery' | 'error' | 'syncing';
  lastSync?: Timestamp | null;
  location?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  assignedBy: string;
  branchId: string;
}

export interface IssueReport {
  id: string;
  labelId: string;
  productId: string;
  productName?: string;
  issue: string;
  status: 'open' | 'in-progress' | 'resolved';
  reportedAt: Timestamp;
  priority: 'high' | 'medium' | 'low';
  branchId: string;
  reportedBy: string;
  reportedByName?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  companyId: string;
  createdAt: Timestamp;
}

export function useStaffDashboard() {
  const router = useRouter();
  const { user: currentUser, accessToken, setUser, clearUser, hasHydrated } = useUserStore();
  
  // States
  const [selectedTab, setSelectedTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('staff_selected_tab') || 'dashboard';
    }
    return 'dashboard';
  });
  
  // Persist selected tab across refreshes
  useEffect(() => {
    localStorage.setItem('staff_selected_tab', selectedTab);
  }, [selectedTab]);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [branchProducts, setBranchProducts] = useState<BranchProduct[]>([]);
  const [labels, setLabels] = useState<DigitalLabel[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const isManager = currentUser?.position === 'Manager';
  
  // Modals
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [activeDiscountModal, setActiveDiscountModal] = useState<{ 
    isOpen: boolean, 
    labelId: string, 
    productId: string, 
    productName: string, 
    currentPrice: number 
  } | null>(null);
  
  // Custom Notice Modals (for unified style)
  const [labelModal, setLabelModal] = useState<{
    title: string;
    message: string;
    tone: 'info' | 'success' | 'warning' | 'error';
    onConfirm?: () => void;
  } | null>(null);

  const openLabelNotice = (title: string, message: string, tone: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLabelModal({ title, message, tone });
  };

  const [labelConfirm, setLabelConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const openLabelConfirm = (title: string, message: string, onConfirm: () => void) => {
    setLabelConfirm({ title, message, onConfirm });
  };

  // Helper: Get company display code
  const getCompanyDisplayCode = () => {
    const raw = company?.code || (company?.id ? `VE${company.id.slice(-3).toUpperCase()}` : 'VE000');
    return raw.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  };

  // Automatic Data Loading
  useEffect(() => {
    if (!hasHydrated) return;
    
    if (accessToken) {
      loadStaffData();
    } else {
      setLoading(false);
    }
  }, [accessToken, hasHydrated]);

  const loadStaffData = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const data = await laravelApi.getStaffDashboard(accessToken);
      
      setCompany(data.company);
      setBranch(data.branch);
      
      const updatedUser = {
        ...currentUser,
      } as any;
      
      if (data.company) {
        updatedUser.companyName = data.company.name;
        updatedUser.companyLogo = data.company.logo_url || data.company.logoUrl;
      }
      
      if (data.branch) {
        updatedUser.branchName = data.branch.name;
      }
      
      setUser(updatedUser);
      
      // Map Laravel data to frontend expectations
      const mappedProducts = data.branchProducts.map((bp: any) => ({
        id: bp.id,
        productId: bp.product_id,
        branchId: bp.branch_id,
        companyId: bp.company_id,
        currentPrice: bp.current_price,
        stock: bp.stock,
        minStock: bp.min_stock,
        status: bp.status,
        lastUpdated: bp.updated_at,
        productDetails: bp.product ? {
          id: bp.product.id,
          name: bp.product.name,
          sku: bp.product.sku,
          price: bp.product.price,
          category: bp.product.category,
          description: bp.product.description,
          imageUrl: bp.product.image_url,
          companyId: bp.company_id
        } : undefined
      }));
      setBranchProducts(mappedProducts);

      const mappedLabels = data.labels.map((l: any) => ({
        id: l.id,
        labelId: l.label_id,
        labelCode: l.label_code,
        productId: l.product_id,
        productName: l.product?.name,
        productSku: l.product?.sku,
        branchId: l.branch_id,
        currentPrice: l.current_price,
        basePrice: l.base_price,
        finalPrice: l.final_price,
        discountPercent: l.discount_percent,
        discountPrice: l.discount_price,
        battery: l.battery,
        status: l.status,
        lastSync: l.updated_at,
        location: l.location
      }));
      setLabels(mappedLabels);

      setCategories(data.categories);
      setIssues(data.issues || []);

      if (isManager && data.allProducts) {
        setProducts(data.allProducts);
      }

    } catch (error) {
      console.error('Error loading staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscriptions - Removed Firestore, will use periodic refresh or manual refresh

  const handleLogout = async () => {
    await logOut();
    clearUser();
    router.push('/login');
  };

  // Actions
  const updateStock = async (productId: string, value: number, mode: 'adjust' | 'set' = 'adjust', silent: boolean = false) => {
    if (!currentUser?.branchId) return;
    try {
      await laravelApi.updateStock({
        productId,
        branchId: currentUser.branchId,
        value,
        mode
      }, accessToken!);
      
      if (!silent) {
        openLabelNotice('Stock Updated', `Inventory updated successfully.`, 'success');
      }
      loadStaffData();
    } catch (error) {
      openLabelNotice('Error', 'Failed to update stock.', 'error');
    }
  };

  const reportIssue = async (labelCode: string, issue: string, priority: 'high' | 'medium' | 'low') => {
    if (!currentUser?.branchId || !currentUser.companyId) return;
    try {
      const label = labels.find(l => l.labelId === labelCode);
      if (!label) {
        openLabelNotice('Not Found', 'Could not locate that hardware tag in this branch.', 'error');
        return;
      }

      await laravelApi.reportIssue({
        labelId: label.id,
        productId: label.productId || undefined,
        issue,
        priority
      }, accessToken!);

      // Create role-specific notification
      await createNotification({
        companyId: currentUser.companyId,
        branchId: currentUser.branchId,
        title: 'New Issue Reported',
        message: `${currentUser.name} reported: ${issue} (Tag: ${labelCode})`,
        type: priority === 'high' ? 'alert' : 'warning'
      });

      openLabelNotice('Report Sent', 'Maintenance team has been notified.', 'success');
      setShowReportIssue(false);
      loadStaffData();
    } catch (error) {
      openLabelNotice('Error', 'Failed to submit report.', 'error');
    }
  };

  const syncAllLabels = async () => {
    if (!currentUser?.branchId) return;
    setIsRefreshing(true);
    try {
      await Promise.all(labels.map(l => 
        laravelApi.syncLabel(l.id, 'active', accessToken!)
      ));
      await loadStaffData();
      openLabelNotice('Sync Complete', 'Branch hardware is now up to date.', 'success');
    } catch (error) {
      openLabelNotice('Error', 'Bulk sync failed.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSyncLabel = async (labelId: string) => {
    openLabelNotice('Syncing', 'Requesting real-time update for hardware node...', 'info');
    try {
      await laravelApi.syncLabel(labelId, 'syncing', accessToken!);
      loadStaffData();
      setTimeout(async () => {
        await laravelApi.syncLabel(labelId, 'active', accessToken!);
        loadStaffData();
      }, 1500);
    } catch (error) {
      openLabelNotice('Error', 'Sync request failed.', 'error');
    }
  };

  const handleUnlinkProductFromLabel = async (labelId: string) => {
    try {
      await laravelApi.unlinkProductFromLabel(labelId, accessToken!);
      openLabelNotice('Unlinked', 'Tag cleared successfully.', 'success');
      loadStaffData();
    } catch (error) {
      openLabelNotice('Error', 'Failed to unlink product.', 'error');
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    try {
      await laravelApi.deleteLabel(labelId, accessToken!);
      openLabelNotice('Removed', 'Hardware node deleted from network.', 'success');
      loadStaffData();
    } catch (error) {
      openLabelNotice('Error', 'Failed to delete tag.', 'error');
    }
  };

  const executeManualDiscount = async (percent: number) => {
    if (!activeDiscountModal) return;
    try {
      const { labelId, productId } = activeDiscountModal;
      
      await laravelApi.applyDiscount({
        labelId: labelId || undefined,
        productId: productId || undefined,
        percent
      }, accessToken!);

      setActiveDiscountModal(null);
      openLabelNotice('Campaign Active', `A ${percent}% discount has been pushed to the network.`, 'success');
      loadStaffData();
    } catch (error) {
      console.error(error);
      openLabelNotice('Error', 'Failed to apply discount override.', 'error');
    }
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    setIsRefreshing(true);
    try {
      // Compress the profile photo on the client side to save storage, bandwidth, and make uploads blazingly fast!
      const compressedFile = await compressImage(file, 800, 800, 0.75);
      
      const formData = new FormData();
      formData.append('image', compressedFile);

      // Upload to our backend (ImageKit integration)
      const response = await fetch(`${API_BASE_URL}/upload/profile`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const photoURL = data.url;

      // Update Laravel MySQL Database
      if (accessToken) {
        try {
          await fetch(`${API_BASE_URL}/user/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ photo_url: photoURL })
          });
        } catch (dbErr) {
          console.warn('MySQL profile update failed:', dbErr);
        }
      }

      // Update Firestore gracefully (using setDoc to avoid No Document To Update)
      try {
        await setDoc(fsDoc(db, 'users', currentUser.id), { photoURL }, { merge: true });
      } catch (fErr) {
        console.warn('Firestore sync skipped:', fErr);
      }
      
      // Update local state in store
      const { setUser } = useUserStore.getState();
      setUser({ ...currentUser, photoURL });
      
      openLabelNotice('Success', 'Profile picture updated successfully!', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      openLabelNotice('Error', 'Upload failed. Check server connection.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateProfile = async (data: { name: string }) => {
    if (!currentUser) return;
    try {
      await setDoc(fsDoc(db, 'users', currentUser.id), { name: data.name }, { merge: true });
      
      // Update local state in store
      const { setUser } = useUserStore.getState();
      setUser({ ...currentUser, name: data.name });
      
      openLabelNotice('Success', 'Profile updated successfully!', 'success');
    } catch (error) {
      openLabelNotice('Error', 'Failed to update profile.', 'error');
    }
  };

  return {
    selectedTab, setSelectedTab,
    loading, isRefreshing,
    company, branch,
    branchProducts, labels, tasks, issues, categories,
    products, staffMembers, isManager,
    searchTerm, setSearchTerm,
    showReportIssue, setShowReportIssue,
    showProductModal, setShowProductModal,
    showCategoryModal, setShowCategoryModal,
    activeDiscountModal, setActiveDiscountModal,
    labelModal, setLabelModal,
    labelConfirm, setLabelConfirm,
    currentUser,
    handleLogout,
    updateStock,
    reportIssue,
    syncAllLabels,
    handleSyncLabel,
    handleUnlinkProductFromLabel,
    handleDeleteLabel,
    executeManualDiscount,
    handleProfileUpload,
    updateProfile,
    loadStaffData,
    openLabelNotice,
    openLabelConfirm
  };
}
