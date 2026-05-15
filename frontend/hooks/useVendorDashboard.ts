import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/user-store';
import { auth, db, logOut, secondaryAuth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  createUserWithEmailAndPassword,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  doc as fsDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  onSnapshot,
  query, 
  where, 
  updateDoc,
  deleteDoc,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { 
  Company, 
  Branch, 
  Product, 
  BranchProduct, 
  StaffMember, 
  DigitalLabel, 
  Promotion, 
  Category, 
  IssueReport,
  StaffPermissions
} from '@/types/vendor';
import { makeProductCodeForVendor, makeSku, nextBranchSequence, nextCompanySequence } from '@/lib/id-generator';
import { applyDiscountToLabel, clearDiscountFromLabel } from '@/lib/label-discount';
import { generateLabelsForBranch } from '@/lib/supermarket-setup';
import { getPermissionsForRole } from '@/lib/role-presets';
import { createNotification } from '@/lib/notifications';

export function useVendorDashboard() {
  const router = useRouter();
  const { user: currentUser, setUser, clearUser, hasHydrated } = useUserStore();
  const realtimeUnsubsRef = useRef<(() => void)[]>([]);
  const productUpdateLockRef = useRef(false);
  
  // States
  const [selectedTab, setSelectedTab] = useState<
    'dashboard' | 'products' | 'categories' | 'staff' | 'labels' | 'promotions' | 'sales' | 'reports' | 'settings' | 'support' | 'branches' | 'issues' | 'activity' | 'inventory' | 'analytics' | 'audit' | 'pos' | 'label-ui' | 'sync' | 'rbac'
  >('dashboard');

  // Persist selected tab across refreshes
  useEffect(() => {
    const savedTab = localStorage.getItem('vendor_selected_tab');
    if (savedTab) setSelectedTab(savedTab as any);
  }, []);

  useEffect(() => {
    localStorage.setItem('vendor_selected_tab', selectedTab);
  }, [selectedTab]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branchProducts, setBranchProducts] = useState<BranchProduct[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [labels, setLabels] = useState<DigitalLabel[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [labelSyncFilter, setLabelSyncFilter] = useState<'all' | 'synced' | 'not-synced'>('all');
  const [assignProductModal, setAssignProductModal] = useState<{labelId: string, branchId: string, labelCode?: string} | null>(null);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [activeDiscountModal, setActiveDiscountModal] = useState<{
    isOpen: boolean, 
    labelId: string, 
    productId: string, 
    productName: string, 
    currentPrice: number
  } | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<DigitalLabel | null>(null);
  const [labelFor3D, setLabelFor3D] = useState<DigitalLabel | null>(null);
  const [labelModal, setLabelModal] = useState<{
    title: string;
    message: string;
    tone: 'info' | 'success' | 'warning' | 'error';
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void | Promise<void>;
  } | null>(null);

  // Modal states
  const [showCreateStaff, setShowCreateStaff] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [showCreatePromotion, setShowCreatePromotion] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [showEditProduct, setShowEditProduct] = useState<Product | null>(null);
  const [showEditStaff, setShowEditStaff] = useState<StaffMember | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [selectedBranchForEdit, setSelectedBranchForEdit] = useState<Branch | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);

  const handleEditProduct = (product: Product | null) => {
    setSelectedProductForEdit(product);
    setShowProductModal(!!product);
  };

  const handleEditBranch = (branch: Branch | null) => {
    setSelectedBranchForEdit(branch);
    setShowCreateBranch(!!branch);
  };

  // Auto-populate edit form when a staff member is selected for editing
  useEffect(() => {
    if (showEditStaff) {
      setEditStaffForm({
        name: showEditStaff.name || '',
        email: showEditStaff.email || '',
        position: showEditStaff.position || 'Cashier',
        branchId: showEditStaff.branchId || '',
        status: showEditStaff.status || 'active',
        permissions: {
          canViewProducts: showEditStaff.permissions?.canViewProducts ?? true,
          canUpdateStock: showEditStaff.permissions?.canUpdateStock ?? true,
          canReportIssues: showEditStaff.permissions?.canReportIssues ?? true,
          canViewReports: showEditStaff.permissions?.canViewReports ?? false,
          canChangePrices: showEditStaff.permissions?.canChangePrices ?? false,
          canCreateProducts: showEditStaff.permissions?.canCreateProducts ?? false,
          canCreateLabels: showEditStaff.permissions?.canCreateLabels ?? false,
          canCreatePromotions: showEditStaff.permissions?.canCreatePromotions ?? false,
          maxPriceChange: showEditStaff.permissions?.maxPriceChange ?? 0
        }
      });
    }
  }, [showEditStaff]);

  // Form states
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    position: 'Cashier',
    branchId: '',
    password: 'welcome123',
    permissions: getPermissionsForRole('Cashier')
  });

  const [editStaffForm, setEditStaffForm] = useState({
    name: '',
    email: '',
    position: 'Cashier',
    branchId: '',
    status: 'active' as 'active' | 'inactive',
    permissions: getPermissionsForRole('Cashier')
  });

  const [promotionForm, setPromotionForm] = useState({
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'bogo',
    value: 10,
    applyTo: 'all' as 'all' | 'selected',
    selectedProducts: [] as string[],
    selectedBranches: [] as string[],
    startDate: '',
    endDate: ''
  });

  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const updateIssueStatus = async (issueId: string, status: 'open' | 'in-progress' | 'resolved') => {
    try {
      // 1. Update the issue record
      await updateDoc(fsDoc(db, 'issue_reports', issueId), {
        status,
        updatedAt: Timestamp.now()
      });

      // 2. If resolved, find the associated label and mark it back to 'active'
      if (status === 'resolved') {
        const issue = issues.find(i => i.id === issueId);
        if (issue) {
          const label = labels.find(l => l.labelId === issue.labelId);
          if (label) {
            await updateDoc(fsDoc(db, 'labels', label.id), { status: 'active' });
          }

          // Create notification
          await createNotification({
            companyId: currentUser?.companyId || '',
            branchId: issue.branchId,
            title: 'Issue Resolved',
            message: `Maintenance completed for ${issue.labelId}. System is now nominal.`,
            type: 'success'
          });
        }
      }

      openLabelNotice('Status Updated', `Incident status set to ${status}.`, 'success');
    } catch (error) {
      console.error('Update error:', error);
      openLabelNotice('Error', 'Failed to update incident status.', 'error');
    }
  };

  const addIssueNote = async (issueId: string, noteText: string) => {
    try {
      const issueRef = fsDoc(db, 'issue_reports', issueId);
      const issue = issues.find(i => i.id === issueId);
      
      // We'll store notes in an array within the document
      const currentNotes = (issue as any).notes || [];
      await updateDoc(issueRef, {
        notes: [
          ...currentNotes,
          {
            text: noteText,
            author: currentUser?.name || 'Manager',
            createdAt: Timestamp.now()
          }
        ],
        updatedAt: Timestamp.now()
      });

      openLabelNotice('Note Added', 'Maintenance update recorded.', 'success');
    } catch (error) {
      console.error('Note error:', error);
      openLabelNotice('Error', 'Failed to save note.', 'error');
    }
  };

  const loadVendorData = async () => {
    if (!currentUser?.companyId) return;
    try {
      if (!company) setLoading(true);
      const cid = currentUser.companyId;

      const staffQuery = currentUser.role === 'staff' && currentUser.branchId
        ? query(collection(db, 'users'), where('companyId', '==', cid), where('role', '==', 'staff'), where('branchId', '==', currentUser.branchId))
        : query(collection(db, 'users'), where('companyId', '==', cid), where('role', '==', 'staff'));

      const [companyDoc, branchesSnap, productsSnap, branchProductsSnap, categoriesSnap, staffSnap] = await Promise.all([
        getDoc(fsDoc(db, 'companies', cid)),
        getDocs(query(collection(db, 'branches'), where('companyId', '==', cid))),
        getDocs(query(collection(db, 'products'), where('companyId', '==', cid))),
        getDocs(query(collection(db, 'branch_products'), where('companyId', '==', cid))),
        getDocs(query(collection(db, 'categories'), where('companyId', '==', cid))),
        getDocs(staffQuery)
      ]);

      if (companyDoc.exists()) setCompany({ id: companyDoc.id, ...companyDoc.data() } as Company);
      
      const branchesData = branchesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Branch[];
      setBranches(branchesData);

      const productsData = productsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
      setProducts(productsData);

      setBranchProducts(branchProductsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as BranchProduct[]);
      setCategories(categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Category[]);
      
      const staffData = staffSnap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        branchName: branchesData.find(b => b.id === (d.data() as any).branchId)?.name || 'Unknown Branch'
      })) as StaffMember[];
      setStaffMembers(staffData);

      setLoading(false);
      // Auto-select branch for staff members and update local branchName for UI
      if (currentUser.role === 'staff' && currentUser.branchId) {
        const myBranch = branchesData.find(b => b.id === currentUser.branchId);
        const myCompany = companyDoc.exists() ? (companyDoc.data() as any).name : null;
        
        if (selectedBranchId === 'all') {
          setSelectedBranchId(currentUser.branchId);
        }
        
        // Update local store with branch name and company name for sidebar display
        const companyLogo = companyDoc.exists() ? (companyDoc.data() as any).logoUrl : null;
        
        if (
          (myBranch && currentUser.branchName !== myBranch.name) || 
          (myCompany && currentUser.companyName !== myCompany) ||
          (companyLogo && currentUser.companyLogo !== companyLogo)
        ) {
          setUser({
            ...currentUser,
            branchName: myBranch?.name || currentUser.branchName,
            companyName: myCompany || currentUser.companyName,
            companyLogo: companyLogo || currentUser.companyLogo
          });
        }
      } else if (currentUser.role === 'vendor') {
        const myCompanyData = companyDoc.exists() ? (companyDoc.data() as any) : null;
        const myCompanyName = myCompanyData?.name;
        const myCompanyLogo = myCompanyData?.logoUrl;

        if (
          (myCompanyName && currentUser.companyName !== myCompanyName) ||
          (myCompanyLogo && currentUser.companyLogo !== myCompanyLogo)
        ) {
          setUser({
            ...currentUser,
            companyName: myCompanyName || currentUser.companyName,
            companyLogo: myCompanyLogo || currentUser.companyLogo
          });
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dedicated Effect for Real-time Subscriptions (Unified)
  useEffect(() => {
    if (!currentUser?.companyId) return;
    const cid = currentUser.companyId;
    
    // Role-based queries
    const labelsQuery = currentUser.role === 'staff' && currentUser.branchId
      ? query(collection(db, 'labels'), where('companyId', '==', cid), where('branchId', '==', currentUser.branchId))
      : query(collection(db, 'labels'), where('companyId', '==', cid));

    const issuesQuery = currentUser.role === 'staff' && currentUser.branchId
      ? query(collection(db, 'issue_reports'), where('companyId', '==', cid), where('branchId', '==', currentUser.branchId))
      : query(collection(db, 'issue_reports'), where('companyId', '==', cid));

    const productsQuery = query(collection(db, 'products'), where('companyId', '==', cid));
    const promosQuery = query(collection(db, 'promotions'), where('companyId', '==', cid));
    const branchProductsQuery = query(collection(db, 'branch_products'), where('companyId', '==', cid));

    // Listeners
    const unsubLabels = onSnapshot(labelsQuery, (snap) => {
      setLabels(snap.docs.map(d => ({ id: d.id, ...d.data() })) as DigitalLabel[]);
    });

    const unsubIssues = onSnapshot(issuesQuery, (snap) => {
      setIssues(snap.docs.map(d => ({ id: d.id, ...d.data() })) as IssueReport[]);
    });

    const unsubProducts = onSnapshot(productsQuery, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
    });

    const unsubPromos = onSnapshot(promosQuery, (snap) => {
      setPromotions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Promotion[]);
    });

    const unsubBranchProducts = onSnapshot(branchProductsQuery, (snap) => {
      setBranchProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as BranchProduct[]);
    });

    return () => {
      unsubLabels();
      unsubIssues();
      unsubProducts();
      unsubPromos();
      unsubBranchProducts();
    };
  }, [currentUser?.id, currentUser?.companyId, currentUser?.branchId]);

  const getDisplayStockForProduct = (productId: string) => {
    const bp = branchProducts.find(b => b.productId === productId && (selectedBranchId === 'all' ? true : b.branchId === selectedBranchId));
    return { stock: bp?.stock || 0, minStock: bp?.minStock || 10 };
  };

  useEffect(() => {
    if (!hasHydrated) return;
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role === 'admin') {
      router.push('/admin');
    } else if (currentUser.companyId) {
      loadVendorData();
    }
  }, [currentUser, hasHydrated]);

  // Immediate branch selection for staff
  useEffect(() => {
    if (hasHydrated && currentUser?.role === 'staff' && currentUser.branchId) {
      setSelectedBranchId(currentUser.branchId);
    }
  }, [currentUser?.role, currentUser?.branchId, hasHydrated]);

  const updateProfile = async (data: { name: string }) => {
    if (!currentUser?.id) return;
    try {
      await updateDoc(fsDoc(db, 'users', currentUser.id), {
        name: data.name,
        updatedAt: Timestamp.now()
      });
      
      // Update local store to reflect changes immediately
      setUser({
        ...currentUser,
        name: data.name
      });

      openLabelNotice('Profile Updated', 'Your name has been updated successfully.', 'success');
    } catch (error: any) {
      openLabelNotice('Update Failed', error.message || 'Could not update profile.', 'error');
    }
  };

  // Helper: Get company display code
  const getCompanyDisplayCode = () => {
    if (company?.code) return company.code;
    return company?.name?.slice(0, 3).toUpperCase() || 'VND';
  };

  // Helper: Notice modals
  const openLabelNotice = (title: string, message: string, tone: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLabelModal({ title, message, tone, confirmLabel: 'OK' });
  };

  const openLabelConfirm = (title: string, message: string, onConfirm: () => void | Promise<void>, confirmLabel = 'Confirm') => {
    setLabelModal({ title, message, tone: 'warning', confirmLabel, cancelLabel: 'Cancel', onConfirm });
  };

  // derived filtered states
  const isBranchFiltered = selectedBranchId !== 'all' && selectedBranchId !== '';
  
  const filteredProducts = useMemo(() => {
    let items = products;
    if (isBranchFiltered) {
      const branchProductIds = new Set(branchProducts.filter(bp => bp.branchId === selectedBranchId).map(bp => bp.productId));
      items = items.filter(p => branchProductIds.has(p.id));
    }
    if (selectedFilterCategory !== 'all') {
      items = items.filter(p => p.category === selectedFilterCategory);
    }
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      items = items.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.sku.toLowerCase().includes(term) ||
        (p.productCode || '').toLowerCase().includes(term)
      );
    }
    return items;
  }, [products, branchProducts, selectedBranchId, selectedFilterCategory, searchTerm, isBranchFiltered]);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice((productPage - 1) * productsPerPage, productPage * productsPerPage);
  }, [filteredProducts, productPage, productsPerPage]);

  const totalProductPages = Math.ceil(filteredProducts.length / productsPerPage);

  const filteredLabels = useMemo(() => {
    let items = [...labels]; // Use spread to avoid mutating original
    if (isBranchFiltered) items = items.filter(l => l.branchId === selectedBranchId);
    
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      items = items.filter(l => 
        (l.labelId || '').toLowerCase().includes(term) || 
        (l.productName || '').toLowerCase().includes(term) ||
        (l.productSku || '').toLowerCase().includes(term) ||
        (l.productCode || '').toLowerCase().includes(term) ||
        (l.productId || '').toLowerCase().includes(term)
      );
    }

    // Explicitly sort: Numeric-aware sequence (DL-001, DL-002, DL-010, etc.)
    return items.sort((a, b) => {
      const idA = a.labelId || '';
      const idB = b.labelId || '';
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [labels, selectedBranchId, searchTerm, isBranchFiltered]);

  // Actions
  const handleLogout = async () => {
    await logOut();
    clearUser();
    router.push('/login');
  };

  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.companyId || !staffForm.branchId) {
      openLabelNotice('Select branch', 'Please select a branch.', 'warning');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, staffForm.email, staffForm.password);
      const userId = userCredential.user.uid;
      await setDoc(fsDoc(db, 'users', userId), {
        id: userId,
        email: staffForm.email,
        name: staffForm.name,
        role: staffForm.position === 'Stock Controller' ? 'stock' : 
              staffForm.position === 'Inventory Manager' ? 'inventory_manager' : 'staff',
        companyId: currentUser.companyId,
        branchId: staffForm.branchId,
        position: staffForm.position,
        permissions: staffForm.permissions,
        status: 'active',
        createdAt: Timestamp.now(),
        createdBy: currentUser.id
      });
      setShowCreateStaff(false);
      openLabelNotice('Staff created', `Staff "${staffForm.name}" created successfully!`, 'success');

      // Trigger notification
      await createNotification({
        companyId: currentUser.companyId,
        branchId: staffForm.branchId,
        title: 'New Staff Member',
        message: `${staffForm.name} has been added to the team as ${staffForm.position}.`,
        type: 'success'
      });
    } catch (error: any) {
      openLabelNotice('Create failed', error?.message || 'Could not create staff.', 'error');
    }
  };

  const updateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditStaff?.id) return;
    try {
      await updateDoc(fsDoc(db, 'users', showEditStaff.id), {
        ...editStaffForm,
        role: editStaffForm.position === 'Stock Controller' ? 'stock' : 
              editStaffForm.position === 'Inventory Manager' ? 'inventory_manager' : 'staff',
        updatedAt: Timestamp.now()
      });
      setShowEditStaff(null);
      openLabelNotice('Staff updated', 'Staff details saved.', 'success');
    } catch (error) {
      openLabelNotice('Update failed', 'Could not update staff details.', 'error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetPassword || !resetPasswordData.newPassword) return;
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      openLabelNotice('Error', 'Passwords do not match.', 'error');
      return;
    }
    try {
      // Logic for password reset...
      openLabelNotice('Success', 'Password reset successfully.', 'success');
      setShowResetPassword(null);
    } catch (error: any) {
      openLabelNotice('Reset failed', error?.message || 'Could not reset password.', 'error');
    }
  };

  const createPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.companyId) return;
    try {
      await addDoc(collection(db, 'promotions'), {
        ...promotionForm,
        companyId: currentUser.companyId,
        branchId: currentUser.role === 'staff' ? currentUser.branchId : (promotionForm as any).branchId || 'all',
        startDate: Timestamp.fromDate(new Date(promotionForm.startDate)),
        endDate: Timestamp.fromDate(new Date(promotionForm.endDate)),
        status: 'active',
        createdAt: Timestamp.now()
      });
      setShowCreatePromotion(false);
      openLabelNotice('Success', 'Promotion created successfully!', 'success');

      // Trigger notification
      await createNotification({
        companyId: currentUser.companyId,
        branchId: currentUser.role === 'staff' ? currentUser.branchId : (promotionForm as any).branchId || 'all',
        title: 'New Campaign Launched',
        message: `Promotion "${promotionForm.name}" is now active.`,
        type: 'info'
      });
    } catch (error: any) {
      openLabelNotice('Create failed', error.message || 'Could not create promotion.', 'error');
    }
  };

  const updatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromotion?.id) return;
    try {
      await updateDoc(fsDoc(db, 'promotions', editingPromotion.id), {
        ...promotionForm,
        startDate: Timestamp.fromDate(new Date(promotionForm.startDate)),
        endDate: Timestamp.fromDate(new Date(promotionForm.endDate)),
      });
      setEditingPromotion(null);
      openLabelNotice('Success', 'Promotion updated successfully!', 'success');
    } catch (error: any) {
      openLabelNotice('Update failed', error.message || 'Could not update promotion.', 'error');
    }
  };

  const createProductFromModal = async (productData: any) => {
    if (!currentUser?.companyId) return;
    try {
      const productSeq = await nextCompanySequence(currentUser.companyId, "nextProductNumber");
      const vendorCode = getCompanyDisplayCode();
      const productCode = productData.productCode?.trim() || makeProductCodeForVendor(vendorCode, productSeq);
      const sku = productData.sku?.trim() || makeSku(productSeq);

      const productRef = await addDoc(collection(db, 'products'), {
        ...productData,
        productCode,
        sku,
        companyId: currentUser.companyId,
        createdBy: currentUser.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Recalculate status
      const stockVal = Number(productData.stock || 0);
      const minVal = Number(productData.minStock || 10);
      let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
      if (stockVal === 0) status = 'out-of-stock';
      else if (stockVal <= minVal) status = 'low-stock';

      // Create branch products
      const targetBranches = currentUser.role === 'staff' && currentUser.branchId 
        ? branches.filter(b => b.id === currentUser.branchId)
        : branches;

      await Promise.all(targetBranches.map(branch => 
        addDoc(collection(db, 'branch_products'), {
          productId: productRef.id,
          branchId: branch.id,
          companyId: currentUser.companyId,
          currentPrice: productData.basePrice,
          stock: stockVal,
          minStock: minVal,
          status,
          lastUpdated: Timestamp.now()
        })
      ));

      setShowProductModal(false);
      openLabelNotice('Success', `Product "${productData.name}" created.`, 'success');
    } catch (error: any) {
      openLabelNotice('Error', error.message || 'Could not create product.', 'error');
    }
  };

  const updateProduct = async (productId: string, productData: any) => {
    try {
      // 1. Update master product
      await updateDoc(fsDoc(db, 'products', productId), {
        ...productData,
        updatedAt: Timestamp.now()
      });

      // 2. Sync changes to branch products (especially stock and status)
      const stockVal = Number(productData.stock || 0);
      const minVal = Number(productData.minStock || 10);
      let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
      if (stockVal === 0) status = 'out-of-stock';
      else if (stockVal <= minVal) status = 'low-stock';

      const bpSnap = await getDocs(query(
        collection(db, 'branch_products'),
        where('productId', '==', productId)
      ));

      await Promise.all(bpSnap.docs.map(doc => 
        updateDoc(fsDoc(db, 'branch_products', doc.id), {
          stock: stockVal,
          minStock: minVal,
          currentPrice: productData.basePrice,
          status,
          lastUpdated: Timestamp.now()
        })
      ));

      setShowProductModal(false);
      openLabelNotice('Updated', 'Product details and inventory status synced.', 'success');
    } catch (error: any) {
      openLabelNotice('Error', error.message || 'Could not update product.', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    openLabelConfirm('Delete product', 'Are you sure? This will remove the product from all branches.', async () => {
      try {
        await deleteDoc(fsDoc(db, 'products', id));
        openLabelNotice('Deleted', 'Product removed.', 'success');
      } catch (error) {
        openLabelNotice('Error', 'Could not delete product.', 'error');
      }
    });
  };

  const handleDeleteStaff = async (id: string) => {
    openLabelConfirm('Delete staff', 'Are you sure you want to remove this staff member?', async () => {
      try {
        await deleteDoc(fsDoc(db, 'users', id));
        openLabelNotice('Deleted', 'Staff member removed.', 'success');
      } catch (error) {
        openLabelNotice('Error', 'Could not delete staff.', 'error');
      }
    });
  };

  const handleDeletePromotion = async (id: string) => {
    openLabelConfirm('Delete promotion', 'Are you sure? This action cannot be undone.', async () => {
      try {
        await deleteDoc(fsDoc(db, 'promotions', id));
        openLabelNotice('Deleted', 'Promotion removed.', 'success');
      } catch (error) {
        openLabelNotice('Error', 'Could not delete promotion.', 'error');
      }
    });
  };

  const handleDeleteCategory = async (id: string) => {
    openLabelConfirm('Delete category', 'Are you sure? Products in this category will be moved to General.', async () => {
      try {
        await deleteDoc(fsDoc(db, 'categories', id));
        openLabelNotice('Deleted', 'Category removed.', 'success');
      } catch (error) {
        openLabelNotice('Error', 'Could not delete category.', 'error');
      }
    });
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    setIsRefreshing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      // Upload to our backend (Cloudinary integration)
      const response = await fetch('http://localhost:5000/api/upload/profile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const photoURL = data.url;

      // Update Firestore
      await updateDoc(fsDoc(db, 'users', currentUser.id), { photoURL });
      
      // Update local state
      setUser({ ...currentUser, photoURL });
      
      openLabelNotice('Success', 'Profile picture updated successfully!', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      openLabelNotice('Error', 'Upload failed. Check server connection.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.companyId) return;
    
    setIsRefreshing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      // Upload to our backend (Cloudinary integration)
      const response = await fetch('http://localhost:5000/api/upload/profile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const logoUrl = data.url;

      // Update Company Document
      await updateDoc(fsDoc(db, 'companies', currentUser.companyId), { logoUrl });
      
      // Update local state
      setCompany(prev => prev ? { ...prev, logoUrl } : null);
      setUser({ ...currentUser, companyLogo: logoUrl });
      
      openLabelNotice('Success', 'Store logo updated successfully!', 'success');
    } catch (error) {
      console.error('Logo upload error:', error);
      openLabelNotice('Error', 'Logo upload failed.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBulkImport = async (file: File) => {
    if (!currentUser?.companyId) return;
    setIsRefreshing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const newProducts = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',').map(v => v.trim());
          const product: any = {};
          headers.forEach((header, index) => {
            product[header] = values[index];
          });
          
          if (product.name && product.baseprice) {
            newProducts.push({
              name: product.name,
              sku: product.sku || makeSku(Math.floor(Math.random() * 1000000)),
              basePrice: parseFloat(product.baseprice) || 0,
              category: product.category || 'General',
              stock: parseInt(product.stock) || 0,
              minStock: parseInt(product.minstock) || 10,
              description: product.description || '',
              imageUrl: '',
              status: 'active',
              companyId: currentUser.companyId,
              createdBy: currentUser.id,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
          }
        }

        if (newProducts.length === 0) {
          openLabelNotice('Import Error', 'No valid products found in CSV.', 'error');
          setIsRefreshing(false);
          return;
        }

        const promises = newProducts.map(async (pData) => {
          const productRef = await addDoc(collection(db, 'products'), pData);
          const stockVal = pData.stock;
          const minVal = pData.minStock;
          let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
          if (stockVal === 0) status = 'out-of-stock';
          else if (stockVal <= minVal) status = 'low-stock';

          await Promise.all(branches.map(branch => 
            addDoc(collection(db, 'branch_products'), {
              productId: productRef.id,
              branchId: branch.id,
              companyId: currentUser.companyId,
              currentPrice: pData.basePrice,
              stock: stockVal,
              minStock: minVal,
              status,
              lastUpdated: Timestamp.now()
            })
          ));
        });

        await Promise.all(promises);
        openLabelNotice('Success', `Imported ${newProducts.length} products successfully.`, 'success');
        setIsRefreshing(false);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Import error:', error);
      openLabelNotice('Import Failed', 'Failed to process CSV file.', 'error');
      setIsRefreshing(false);
    }
  };

  const handleBulkProvision = async (branchId: string, count: number) => {
    if (!currentUser?.companyId) return;
    try {
      await generateLabelsForBranch({
        companyId: currentUser.companyId,
        branchId,
        count
      });
      openLabelNotice('Success', `${count} labels generated for this branch.`, 'success');
    } catch (error: any) {
      openLabelNotice('Bulk Provision Failed', error.message || 'Could not generate labels.', 'error');
    }
  };

  const handleBulkExport = () => {
    try {
      const headers = ['Name', 'SKU', 'BasePrice', 'Category', 'Stock', 'MinStock', 'Description'];
      const csvContent = [
        headers.join(','),
        ...products.map(p => {
          const { stock, minStock } = getDisplayStockForProduct(p.id);
          return [
            `"${p.name}"`,
            `"${p.sku}"`,
            p.basePrice,
            `"${p.category || 'General'}"`,
            stock,
            minStock || 10,
            `"${(p.description || '').replace(/"/g, '""')}"`
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      openLabelNotice('Export Failed', 'Failed to generate CSV export.', 'error');
    }
  };

  const downloadImportTemplate = () => {
    const headers = ['Name', 'SKU', 'BasePrice', 'Category', 'Stock', 'MinStock', 'Description'];
    const sampleData = [
      ['Sample Product', 'SKU-001', '19.99', 'Electronics', '100', '10', 'High quality sample product'],
      ['Another Item', 'SKU-002', '5.50', 'Groceries', '50', '5', 'Fresh organic item']
    ];
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const provisionLabel = async (data: { labelId: string; location: string; branchId: string }) => {
    if (!currentUser?.companyId) return;
    
    // Check for location conflict in the same branch
    if (data.location) {
      const isDuplicate = labels.some(l => 
        l.branchId === data.branchId && 
        l.location?.toLowerCase().trim() === data.location.toLowerCase().trim()
      );
      if (isDuplicate) {
        openLabelNotice('Location Conflict', `${data.location} is already occupied by another label in this branch.`, 'error');
        return;
      }
    }

    try {
      await addDoc(collection(db, 'labels'), {
        ...data,
        companyId: currentUser.companyId,
        status: 'active',
        battery: 100,
        productId: null,
        lastSync: Timestamp.now(),
        createdAt: Timestamp.now()
      });
      openLabelNotice('Success', `Label ${data.labelId} provisioned at ${data.location || 'unspecified location'}.`, 'success');
    } catch (error: any) {
      openLabelNotice('Provision failed', error.message || 'Could not register hardware.', 'error');
    }
  };

  const updateLabelLocation = async (id: string, location: string) => {
    const label = labels.find(l => l.id === id);
    if (!label) return;

    // Check for location conflict (excluding itself)
    if (location) {
      const isDuplicate = labels.some(l => 
        l.id !== id && 
        l.branchId === label.branchId && 
        l.location?.toLowerCase().trim() === location.toLowerCase().trim()
      );
      if (isDuplicate) {
        openLabelNotice('Location Conflict', `${location} is already occupied by another label in this branch.`, 'error');
        return;
      }
    }

    try {
      await updateDoc(fsDoc(db, 'labels', id), { location });
      openLabelNotice('Location Updated', `Label relocated to ${location}.`, 'success');
      loadVendorData();
    } catch (error: any) {
      openLabelNotice('Update Failed', error.message || 'Could not update location.', 'error');
    }
  };

  const bulkAutoMapLocations = async (branchId: string, prefix: string, forceAll: boolean = false) => {
    const targets = labels.filter(l => {
      const isCorrectBranch = (branchId === 'all' || l.branchId === branchId);
      if (!isCorrectBranch) return false;
      
      // If forceAll is true, we map everything. Otherwise only unset/missing.
      if (forceAll) return true;
      return (!l.location || l.location.toLowerCase().includes('unset'));
    });

    if (targets.length === 0) {
      openLabelNotice('Nothing to Map', 'No applicable labels found for this operation.', 'info');
      return;
    }

    let successCount = 0;
    try {
      for (const label of targets) {
        const match = label.labelId.match(/\d+/);
        if (match) {
          const rawNum = match[0];
          // Preserve 3-digit padding if the original ID had it, otherwise default to 2
          const padding = rawNum.length >= 3 ? 3 : 2;
          const num = rawNum.padStart(padding, '0');
          const newLocation = `${prefix} ${num}`;
          await updateDoc(fsDoc(db, 'labels', label.id), { location: newLocation });
          successCount++;
        }
      }
      openLabelNotice('Auto-Map Complete', `Successfully organized ${successCount} labels as ${prefix} positions.`, 'success');
      loadVendorData();
    } catch (error: any) {
      openLabelNotice('Auto-Map Failed', error.message || 'Error during bulk update.', 'error');
    }
  };

  const assignProductToLabel = async (labelId: string, productId: string, branchId: string, labelCode?: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      // Get branch specific price
      const bp = branchProducts.find(b => b.productId === productId && b.branchId === branchId);
      const currentPrice = bp?.currentPrice || product.basePrice;

      await updateDoc(fsDoc(db, 'labels', labelId), {
        productId,
        productName: product.name,
        productSku: product.sku,
        productCode: product.productCode || null,
        basePrice: product.basePrice,
        currentPrice: currentPrice,
        finalPrice: currentPrice,
        status: 'syncing',
        lastSync: Timestamp.now()
      });

      // Simulate network latency for "syncing" feel
      setTimeout(async () => {
         await updateDoc(fsDoc(db, 'labels', labelId), { status: 'active' });
      }, 2000);

      openLabelNotice('Syncing', `Label ${labelCode || labelId} is being synchronized with ${product.name}.`, 'success');
    } catch (error) {
      openLabelNotice('Error', 'Failed to assign product.', 'error');
    }
  };

  const handleUnlinkProductFromLabel = async (labelId: string) => {
    try {
      await updateDoc(fsDoc(db, 'labels', labelId), {
        productId: null,
        productName: null,
        productSku: null,
        currentPrice: 0,
        status: 'inactive',
        lastSync: Timestamp.now()
      });
      openLabelNotice('Unlinked', 'Product removed from label.', 'success');
    } catch (error) {
      openLabelNotice('Error', 'Failed to unlink product.', 'error');
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    try {
      await deleteDoc(fsDoc(db, 'labels', labelId));
      openLabelNotice('Deleted', 'Hardware node permanently removed from system.', 'success');
    } catch (error) {
      openLabelNotice('Error', 'Failed to remove hardware node.', 'error');
    }
  };

  const executeManualDiscount = async (percent: number) => {
    if (!activeDiscountModal) return;
    try {
      const label = labels.find(l => l.id === activeDiscountModal.labelId);
      if (!label) throw new Error("Label not found");

      // Use the stored basePrice or fall back to currentPrice
      const basePrice = label.basePrice || label.currentPrice || 0;

      await applyDiscountToLabel({
        labelId: label.id,
        basePrice: basePrice,
        percent
      });
      setActiveDiscountModal(null);
      openLabelNotice('Campaign Active', `A ${percent}% discount has been pushed to the electronic tag.`, 'success');
    } catch (error) {
      console.error(error);
      openLabelNotice('Error', 'Failed to apply discount override.', 'error');
    }
  };

  const handleSyncAllLabels = async () => {
    if (!selectedBranchId || selectedBranchId === 'all') {
       openLabelNotice('Action Required', 'Please select a specific branch to perform a full system sync.', 'info');
       return;
    }
    
    setIsRefreshing(true);
    try {
      const branchLabels = labels.filter(l => l.branchId === selectedBranchId);
      
      if (branchLabels.length === 0) {
         // Offer to generate test labels if none exist
         openLabelConfirm(
            'No Labels Detected', 
            'This branch currently has no digital labels registered. Would you like to initialize the default tag set (12 units)?',
            async () => {
               await generateLabelsForBranch({
                  companyId: currentUser!.companyId,
                  branchId: selectedBranchId,
                  count: 12
               });
               openLabelNotice('Provisioned', 'Default label set created for branch.', 'success');
            }
         );
         setIsRefreshing(false);
         return;
      }

      // Perform a batch update of all prices
      const batch = labels.filter(l => l.branchId === selectedBranchId && l.productId);
      
      for (const label of batch) {
         const bp = branchProducts.find(p => p.productId === label.productId && p.branchId === label.branchId);
         if (bp) {
            await updateDoc(fsDoc(db, 'labels', label.id), {
               currentPrice: bp.currentPrice,
               finalPrice: label.discountPercent 
                  ? Math.round(bp.currentPrice * (1 - label.discountPercent / 100) * 100) / 100
                  : bp.currentPrice,
               status: 'syncing',
               lastSync: Timestamp.now()
            });
            
            // Auto-complete sync after delay
            setTimeout(() => {
               updateDoc(fsDoc(db, 'labels', label.id), { status: 'active' });
            }, 1500);
         }
      }
      
      openLabelNotice('Sync Complete', `Successfully pushed latest pricing to ${batch.length} electronic tags.`, 'success');
    } catch (error) {
      openLabelNotice('Sync Failed', 'System error during bulk synchronization.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const createBranch = async (branchData: any) => {
    if (!currentUser?.companyId) return;
    try {
      await addDoc(collection(db, 'branches'), {
        ...branchData,
        companyId: currentUser.companyId,
        createdAt: Timestamp.now()
      });
      openLabelNotice('Branch Created', `${branchData.name} has been added to your retail network.`, 'success');
      setShowCreateBranch(false);
    } catch (error) {
      openLabelNotice('Error', 'Failed to create new branch.', 'error');
    }
  };

  const updateBranch = async (branchId: string, branchData: any) => {
    try {
      await updateDoc(fsDoc(db, 'branches', branchId), {
        ...branchData,
        updatedAt: Timestamp.now()
      });
      openLabelNotice('Branch Updated', `${branchData.name} details have been refreshed.`, 'success');
      setShowCreateBranch(false);
    } catch (error) {
      openLabelNotice('Error', 'Failed to update branch.', 'error');
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    openLabelConfirm('Delete Branch', 'Are you sure? This will permanently remove this location and may affect assigned staff/labels.', async () => {
      try {
        await deleteDoc(fsDoc(db, 'branches', branchId));
        openLabelNotice('Branch Removed', 'Location has been deleted from your network.', 'success');
      } catch (error) {
        openLabelNotice('Error', 'Failed to delete branch.', 'error');
      }
    });
  };

  const reportIssue = async (labelCode: string, issue: string, priority: 'high' | 'medium' | 'low') => {
    if (!currentUser?.companyId) return;
    
    // Find the label to get its branch and product context
    const label = labels.find(l => l.labelId === labelCode);
    if (!label) {
      openLabelNotice('Not Found', 'Could not locate that hardware tag.', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'issue_reports'), {
        labelId: labelCode,
        productId: label.productId,
        issue,
        status: 'open',
        reportedAt: Timestamp.now(),
        priority,
        branchId: label.branchId,
        companyId: currentUser.companyId,
        reportedBy: currentUser.id,
        reportedByName: currentUser.name || 'System User'
      });

      // Create notification
      await createNotification({
        companyId: currentUser.companyId,
        branchId: label.branchId,
        title: 'Hardware Issue Flagged',
        message: `${currentUser.name || 'Manager'} reported: ${issue} on ${labelCode}`,
        type: priority === 'high' ? 'alert' : 'warning'
      });

      // Update label status to reflect error
      await updateDoc(fsDoc(db, 'labels', label.id), { status: 'error' });
      
      openLabelNotice('Report Sent', 'Maintenance log updated successfully.', 'success');
      setShowReportIssue(false);
    } catch (error) {
      console.error('Report error:', error);
      openLabelNotice('Error', 'Failed to submit report.', 'error');
    }
  };

  return {
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
    promotions,
    issues,
    selectedBranchId, setSelectedBranchId,
    selectedFilterCategory, setSelectedFilterCategory,
    searchTerm, setSearchTerm,
    labelSyncFilter, setLabelSyncFilter,
    filteredProducts,
    filteredLabels,
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
    handleEditBranch,
    showEditStaff, setShowEditStaff,
    showResetPassword, setShowResetPassword,
    showCategoryModal, setShowCategoryModal,
    selectedCategory, setSelectedCategory,
    selectedProductForEdit, setSelectedProductForEdit,
    selectedBranchForEdit, setSelectedBranchForEdit,
    assignProductModal, setAssignProductModal,
    assignSearchQuery, setAssignSearchQuery,
    activeDiscountModal, setActiveDiscountModal,
    labelModal, setLabelModal,
    selectedLabel, setSelectedLabel,
    labelFor3D, setLabelFor3D,
    staffForm, setStaffForm,
    editStaffForm, setEditStaffForm,
    promotionForm, setPromotionForm,
    resetPasswordData, setResetPasswordData,
    handleLogout,
    createStaff, updateStaff, handleResetPassword,
    createPromotion, updatePromotion,
    createBranch, updateBranch, handleDeleteBranch,
    handleDeleteProduct,
    handleSyncAllLabels,
    assignProductToLabel,
    executeManualDiscount,
    handleUnlinkProductFromLabel,
    handleDeleteLabel,
    handleDeleteStaff,
    handleDeletePromotion,
    handleDeleteCategory,
    handleProfileUpload,
    handleLogoUpload,
    updateProfile,
    createProductFromModal,
    updateProduct,
    getDisplayStockForProduct,
    currentUser,
    hasHydrated,
    loadVendorData,
    openLabelConfirm,
    openLabelNotice,
    showProvisionModal, setShowProvisionModal,
    provisionLabel,
    handleBulkProvision,
    updateLabelLocation,
    bulkAutoMapLocations,
    showReportIssue, setShowReportIssue,
    reportIssue,
    updateIssueStatus,
    addIssueNote,
    handleBulkImport,
    handleBulkExport,
    downloadImportTemplate
  };
}
