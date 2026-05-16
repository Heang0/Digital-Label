'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/user-store';
import { applyDiscountToLabel, clearDiscountFromLabel } from '@/lib/label-discount';
import { db, logOut } from '@/lib/firebase';
import { 
  doc as fsDoc,
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc,
  deleteDoc,
  Timestamp,
  addDoc,
  onSnapshot
} from 'firebase/firestore';
import { generateLabelsForBranch } from '@/lib/supermarket-setup';
import { makeProductCodeForVendor, makeSku, nextBranchSequence } from '@/lib/id-generator';
import { createNotification } from '@/lib/notifications';

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
  const { user: currentUser, setUser, clearUser, hasHydrated } = useUserStore();
  
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
    
    if (currentUser?.branchId && currentUser.companyId) {
      loadStaffData();
    } else if (currentUser && !currentUser.branchId) {
      // User exists but has no branch assigned — stop loading, show empty state
      setLoading(false);
    } else if (!currentUser) {
      setLoading(false);
    }
  }, [currentUser, hasHydrated]);

  const loadStaffData = async () => {
    if (!currentUser?.branchId || !currentUser.companyId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Load branch & company
      const [compDoc, brDoc] = await Promise.all([
        getDoc(fsDoc(db, 'companies', currentUser.companyId)),
        getDoc(fsDoc(db, 'branches', currentUser.branchId))
      ]);

      if (compDoc.exists()) {
        const compData = compDoc.data() as any;
        setCompany({ id: compDoc.id, ...compData } as Company);
        
        // Sync to user store for sidebar
        if (currentUser.companyName !== compData.name || currentUser.companyLogo !== compData.logoUrl) {
          setUser({
            ...currentUser,
            companyName: compData.name,
            companyLogo: compData.logoUrl
          });
        }
      }
      
      if (brDoc.exists()) {
        const brData = brDoc.data() as any;
        setBranch({ id: brDoc.id, ...brData } as Branch);
        
        // Sync branch name for sidebar
        if (currentUser.branchName !== brData.name) {
          setUser({
            ...currentUser,
            branchName: brData.name
          });
        }
      }

      // Load products
      const bpSnap = await getDocs(query(
        collection(db, 'branch_products'),
        where('branchId', '==', currentUser.branchId)
      ));
      
      const bpData = await Promise.all(bpSnap.docs.map(async (d) => {
        const data = d.data();
        const pDoc = await getDoc(fsDoc(db, 'products', data.productId));
        return {
          id: d.id,
          ...data,
          productDetails: pDoc.exists() ? { id: pDoc.id, ...pDoc.data() } as Product : undefined
        } as BranchProduct;
      }));
      setBranchProducts(bpData);

      // Load labels
      const labelsSnap = await getDocs(query(
        collection(db, 'labels'),
        where('branchId', '==', currentUser.branchId)
      ));
      setLabels(labelsSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        labelId: d.data().labelId || d.data().labelCode || d.id
      })) as DigitalLabel[]);

      // Load categories
      const catSnap = await getDocs(query(
        collection(db, 'categories'),
        where('companyId', '==', currentUser.companyId)
      ));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Category[]);

      // Load issues
      const issuesSnap = await getDocs(query(
        collection(db, 'issue_reports'),
        where('branchId', '==', currentUser.branchId)
      ));
      setIssues(issuesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as IssueReport[]);

      // Manager-level: load products and staff
      if (isManager) {
        const prodSnap = await getDocs(query(
          collection(db, 'products'),
          where('companyId', '==', currentUser.companyId)
        ));
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);

        const staffSnap = await getDocs(query(
          collection(db, 'users'),
          where('companyId', '==', currentUser.companyId),
          where('branchId', '==', currentUser.branchId),
          where('role', '==', 'staff')
        ));
        setStaffMembers(staffSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }

    } catch (error) {
      console.error('Error loading staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscriptions
  useEffect(() => {
    if (!currentUser?.branchId) return;
    
    const unsubLabels = onSnapshot(query(collection(db, 'labels'), where('branchId', '==', currentUser.branchId)), (snap) => {
      setLabels(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        labelId: d.data().labelId || d.data().labelCode || d.id
      })) as DigitalLabel[]);
    });

    const unsubIssues = onSnapshot(query(collection(db, 'issue_reports'), where('branchId', '==', currentUser.branchId)), (snap) => {
      setIssues(snap.docs.map(d => ({ id: d.id, ...d.data() })) as IssueReport[]);
    });

    return () => {
      unsubLabels();
      unsubIssues();
    };
  }, [currentUser?.branchId]);

  const handleLogout = async () => {
    await logOut();
    clearUser();
    router.push('/login');
  };

  // Actions
  const updateStock = async (productId: string, value: number, mode: 'adjust' | 'set' = 'adjust', silent: boolean = false) => {
    if (!currentUser?.branchId) return;
    try {
      const bpSnap = await getDocs(query(
        collection(db, 'branch_products'),
        where('productId', '==', productId),
        where('branchId', '==', currentUser.branchId)
      ));
      
      if (bpSnap.empty) return;
      const bpDoc = bpSnap.docs[0];
      const data = bpDoc.data();
      const currentStock = Number(data.stock) || 0;
      const minStock = Number(data.minStock) || 0;
      
      let newStock = mode === 'set' ? Number(value) : currentStock + Number(value);
      newStock = Math.max(0, newStock);

      // Recalculate status based on new stock
      let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
      if (newStock === 0) status = 'out-of-stock';
      else if (newStock <= minStock) status = 'low-stock';
      
      await updateDoc(fsDoc(db, 'branch_products', bpDoc.id), {
        stock: newStock,
        status,
        lastUpdated: Timestamp.now()
      });
      
      if (!silent) {
        openLabelNotice('Stock Updated', `Inventory is now ${newStock} units (${status.replace('-', ' ')}).`, 'success');
      }
      loadStaffData();
    } catch (error) {
      openLabelNotice('Error', 'Failed to update stock.', 'error');
    }
  };

  const reportIssue = async (labelCode: string, issue: string, priority: 'high' | 'medium' | 'low') => {
    if (!currentUser?.branchId || !currentUser.companyId) return;
    try {
      const labelSnap = await getDocs(query(
        collection(db, 'labels'),
        where('labelId', '==', labelCode),
        where('branchId', '==', currentUser.branchId)
      ));

      if (labelSnap.empty) {
        openLabelNotice('Not Found', 'Could not locate that hardware tag in this branch.', 'error');
        return;
      }

      const labelDoc = labelSnap.docs[0];
      await addDoc(collection(db, 'issue_reports'), {
        labelId: labelCode,
        productId: labelDoc.data().productId,
        issue,
        status: 'open',
        reportedAt: Timestamp.now(),
        priority,
        branchId: currentUser.branchId,
        companyId: currentUser.companyId,
        reportedBy: currentUser.id,
        reportedByName: currentUser.name
      });

      // Create role-specific notification
      await createNotification({
        companyId: currentUser.companyId,
        branchId: currentUser.branchId,
        title: 'New Issue Reported',
        message: `${currentUser.name} reported: ${issue} (Tag: ${labelCode})`,
        type: priority === 'high' ? 'alert' : 'warning'
      });

      await updateDoc(fsDoc(db, 'labels', labelDoc.id), { status: 'error' });
      openLabelNotice('Report Sent', 'Maintenance team has been notified.', 'success');
      setShowReportIssue(false);
    } catch (error) {
      openLabelNotice('Error', 'Failed to submit report.', 'error');
    }
  };

  const syncAllLabels = async () => {
    setIsRefreshing(true);
    try {
      // Simulate sync for UI feedback
      await new Promise(r => setTimeout(r, 1500));
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
      await updateDoc(fsDoc(db, 'labels', labelId), {
        status: 'syncing',
        lastSync: Timestamp.now()
      });
      setTimeout(() => {
        updateDoc(fsDoc(db, 'labels', labelId), { status: 'active' });
      }, 1500);
    } catch (error) {
      openLabelNotice('Error', 'Sync request failed.', 'error');
    }
  };

  const handleUnlinkProductFromLabel = async (labelId: string) => {
    try {
      await updateDoc(fsDoc(db, 'labels', labelId), {
        productId: null,
        productName: null,
        productSku: null,
        currentPrice: null,
        basePrice: null,
        finalPrice: null,
        discountPercent: null,
        discountPrice: null,
        lastSync: Timestamp.now(),
        status: 'inactive'
      });
      openLabelNotice('Unlinked', 'Tag cleared successfully.', 'success');
    } catch (error) {
      openLabelNotice('Error', 'Failed to unlink product.', 'error');
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    try {
      await deleteDoc(fsDoc(db, 'labels', labelId));
      openLabelNotice('Removed', 'Hardware node deleted from network.', 'success');
    } catch (error) {
      openLabelNotice('Error', 'Failed to delete tag.', 'error');
    }
  };

  const executeManualDiscount = async (percent: number) => {
    if (!activeDiscountModal) return;
    try {
      const { labelId, productId } = activeDiscountModal;
      
      if (labelId) {
        // Single label discount
        const label = labels.find(l => l.id === labelId);
        if (!label) throw new Error("Label not found");
        const basePrice = label.basePrice || label.currentPrice || 0;
        await applyDiscountToLabel({ labelId, basePrice, percent });
      } else if (productId) {
        // Product-wide discount for this branch
        const targetLabels = labels.filter(l => l.productId === productId);
        if (targetLabels.length === 0) {
          openLabelNotice('Info', 'No active tags found for this product.', 'info');
          setActiveDiscountModal(null);
          return;
        }

        await Promise.all(targetLabels.map(label => {
          const basePrice = label.basePrice || label.currentPrice || 0;
          return applyDiscountToLabel({ labelId: label.id, basePrice, percent });
        }));
      }

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
      const formData = new FormData();
      formData.append('image', file);

      // Upload to our backend (ImageKit integration)
      const response = await fetch('http://localhost:5000/api/upload/profile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const photoURL = data.url;

      // Update Firestore
      await updateDoc(fsDoc(db, 'users', currentUser.id), { photoURL });
      
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
      await updateDoc(fsDoc(db, 'users', currentUser.id), { name: data.name });
      
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
