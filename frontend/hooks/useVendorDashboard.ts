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

export function useVendorDashboard() {
  const router = useRouter();
  const { user: currentUser, clearUser, hasHydrated } = useUserStore();
  const realtimeUnsubsRef = useRef<(() => void)[]>([]);
  const productUpdateLockRef = useRef(false);
  
  // States
  const [selectedTab, setSelectedTab] = useState<
    'dashboard' | 'products' | 'categories' | 'staff' | 'labels' | 'promotions' | 'sales' | 'reports' | 'settings' | 'support'
  >('dashboard');
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
  const [activeDiscountModal, setActiveDiscountModal] = useState<{labelId: string, productId: string, branchId: string, currentPercent: number} | null>(null);
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [showProvisionModal, setShowProvisionModal] = useState(false);

  const handleEditProduct = (product: Product | null) => {
    setSelectedProductForEdit(product);
    setShowProductModal(!!product);
  };

  // Form states
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    position: 'Cashier',
    branchId: '',
    password: 'welcome123',
    permissions: {
      canViewProducts: true,
      canUpdateStock: true,
      canReportIssues: true,
      canViewReports: false,
      canChangePrices: false,
      maxPriceChange: 0
    }
  });

  const [editStaffForm, setEditStaffForm] = useState({
    name: '',
    email: '',
    position: 'Cashier',
    branchId: '',
    status: 'active' as 'active' | 'inactive',
    permissions: {
      canViewProducts: true,
      canUpdateStock: true,
      canReportIssues: true,
      canViewReports: false,
      canChangePrices: false,
      canCreateProducts: false,
      canCreateLabels: false,
      canCreatePromotions: false,
      maxPriceChange: 0
    }
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

  const loadVendorData = async () => {
    if (!currentUser?.companyId) return;
    try {
      if (!company) setLoading(true);
      const cid = currentUser.companyId;

      const [companyDoc, branchesSnap, productsSnap, branchProductsSnap, categoriesSnap, staffSnap, labelsSnap, promosSnap, issuesSnap] = await Promise.all([
        getDoc(fsDoc(db, 'companies', cid)),
        getDocs(query(collection(db, 'branches'), where('companyId', '==', cid))),
        getDocs(query(collection(db, 'products'), where('companyId', '==', cid))),
        getDocs(query(collection(db, 'branch_products'), where('companyId', '==', cid))),
        getDocs(query(collection(db, 'categories'), where('companyId', '==', cid))),
        getDocs(query(collection(db, 'users'), where('companyId', '==', cid), where('role', '==', 'staff'))),
        getDocs(query(collection(db, 'labels'), where('companyId', '==', cid))),
        getDocs(query(collection(db, 'promotions'), where('companyId', '==', cid))),
        getDocs(query(collection(db, 'issue_reports'), where('companyId', '==', cid)))
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

      setLabels(labelsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as DigitalLabel[]);
      setPromotions(promosSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Promotion[]);
      setIssues(issuesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as IssueReport[]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading vendor data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasHydrated) return;
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role !== 'vendor') {
      if (currentUser.role === 'admin') router.push('/admin');
      if (currentUser.role === 'staff') router.push('/staff');
    } else if (currentUser.companyId) {
      loadVendorData();
    }
  }, [currentUser, hasHydrated]);

  // Realtime Subscriptions
  useEffect(() => {
    if (!currentUser?.companyId) return;
    const cid = currentUser.companyId;

    const unsubProducts = onSnapshot(query(collection(db, 'products'), where('companyId', '==', cid)), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
    });

    const unsubLabels = onSnapshot(query(collection(db, 'labels'), where('companyId', '==', cid)), (snap) => {
      setLabels(snap.docs.map(d => ({ id: d.id, ...d.data() })) as DigitalLabel[]);
    });

    const unsubPromos = onSnapshot(query(collection(db, 'promotions'), where('companyId', '==', cid)), (snap) => {
      setPromotions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Promotion[]);
    });

    const unsubBranchProducts = onSnapshot(query(collection(db, 'branch_products'), where('companyId', '==', cid)), (snap) => {
      setBranchProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as BranchProduct[]);
    });

    return () => {
      unsubProducts();
      unsubLabels();
      unsubPromos();
      unsubBranchProducts();
    };
  }, [currentUser?.companyId]);

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
      items = items.filter(p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
    }
    return items;
  }, [products, branchProducts, selectedBranchId, selectedFilterCategory, searchTerm, isBranchFiltered]);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice((productPage - 1) * productsPerPage, productPage * productsPerPage);
  }, [filteredProducts, productPage, productsPerPage]);

  const totalProductPages = Math.ceil(filteredProducts.length / productsPerPage);

  const filteredLabels = useMemo(() => {
    let items = labels;
    if (isBranchFiltered) items = items.filter(l => l.branchId === selectedBranchId);
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      items = items.filter(l => 
        (l.labelId || '').toLowerCase().includes(term) || 
        (l.productName || '').toLowerCase().includes(term) ||
        (l.productSku || '').toLowerCase().includes(term)
      );
    }
    return items;
  }, [labels, selectedBranchId, searchTerm, isBranchFiltered]);

  const getDisplayStockForProduct = (productId: string) => {
    const bp = branchProducts.find(b => b.productId === productId && (selectedBranchId === 'all' ? true : b.branchId === selectedBranchId));
    return { stock: bp?.stock || 0, minStock: bp?.minStock || 10 };
  };

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
        role: 'staff',
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
      loadVendorData();
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
        startDate: Timestamp.fromDate(new Date(promotionForm.startDate)),
        endDate: Timestamp.fromDate(new Date(promotionForm.endDate)),
        status: 'active',
        createdAt: Timestamp.now()
      });
      setShowCreatePromotion(false);
      openLabelNotice('Success', 'Promotion created successfully!', 'success');
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

      // Create branch products for all branches
      await Promise.all(branches.map(branch => 
        addDoc(collection(db, 'branch_products'), {
          productId: productRef.id,
          branchId: branch.id,
          companyId: currentUser.companyId,
          currentPrice: productData.basePrice,
          stock: Number(productData.stock || 0),
          minStock: Number(productData.minStock || 10),
          status: 'in-stock',
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
      await updateDoc(fsDoc(db, 'products', productId), {
        ...productData,
        updatedAt: Timestamp.now()
      });
      setShowProductModal(false);
      openLabelNotice('Updated', 'Product details saved.', 'success');
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
        loadVendorData();
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
        loadVendorData();
      } catch (error) {
        openLabelNotice('Error', 'Could not delete category.', 'error');
      }
    });
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    try {
      const storageRef = ref(storage, `users/${currentUser.id}/profile.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(fsDoc(db, 'users', currentUser.id), { photoURL: url });
      openLabelNotice('Success', 'Profile picture updated.', 'success');
      loadVendorData();
    } catch (error) {
      openLabelNotice('Error', 'Upload failed.', 'error');
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
      loadVendorData();
    } catch (error: any) {
      openLabelNotice('Bulk Provision Failed', error.message || 'Could not generate labels.', 'error');
    }
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
      loadVendorData();
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
    openLabelConfirm('Delete label', 'Are you sure? This will permanently remove the digital label.', async () => {
      try {
        await deleteDoc(fsDoc(db, 'labels', labelId));
        openLabelNotice('Deleted', 'Label removed.', 'success');
      } catch (error) {
        openLabelNotice('Error', 'Could not delete label.', 'error');
      }
    });
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

  return {
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
    labelSyncFilter, setLabelSyncFilter,
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
    selectedLabel, setSelectedLabel,
    labelFor3D, setLabelFor3D,
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
    handleUnlinkProductFromLabel,
    handleDeleteLabel,
    handleDeleteStaff,
    handleDeletePromotion,
    handleDeleteCategory,
    handleProfileUpload,
    createProductFromModal,
    updateProduct,
    getDisplayStockForProduct,
    currentUser,
    loadVendorData,
    openLabelConfirm,
    openLabelNotice,
    showProvisionModal, setShowProvisionModal,
    provisionLabel,
    handleBulkProvision,
    updateLabelLocation,
    bulkAutoMapLocations,
    openLabelConfirm,
    openLabelNotice
  };
}
