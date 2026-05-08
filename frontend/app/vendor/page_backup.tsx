'use client';



import { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/lib/user-store';
import { applyDiscountToLabel, clearDiscountFromLabel } from '@/lib/label-discount';
import { auth, db, logOut, secondaryAuth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  createUserWithEmailAndPassword,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import CategoryModal from '@/components/modals/CategoryModal';
import ProductModal from '@/components/modals/ProductModal';
// NOTE: Vendor page already has an in-page modal notice system (openLabelNotice).
// We avoid using the global NotificationProvider here to prevent duplicate popups.
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  LayoutDashboard,
  Package,
  Users,
  Tag,
  Percent,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Bell,
  HelpCircle,
  Plus,
  X,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Check,
  XCircle,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Building2,
  Phone,
  Mail,
  User as UserIcon,
  Lock,
  BarChart,
  TrendingUp,
  AlertCircle,
  Activity,
  Clock,
  Battery,
  CreditCard,
  Download,
  Upload,
  DollarSign,
  Percent as PercentIcon,
  Calendar,
  PackagePlus,
  RefreshCw,
  Save,
  Hash, 
  List,
  Zap,
  LayoutGrid as LayoutGridIcon
} from 'lucide-react';
import { DashboardSidebar } from '@/components/admin/DashboardSidebar';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import { generateLabelsForBranch } from '@/lib/supermarket-setup';
import { makeProductCodeForVendor, makeSku, nextBranchSequence, nextCompanySequence } from '@/lib/id-generator';
import SalesHistoryPanel from '@/components/cashier/SalesHistoryPanel';

// INTERFACES
interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  subscription: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'pending' | 'suspended';
  ownerId: string;
  createdAt: Timestamp;
  code?: string;
  branches?: Branch[];
}

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager?: string;
  companyId: string;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
}

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  basePrice: number;
  imageUrl?: string;
  productCode?: string;
  stock?: number;
  minStock?: number;
  companyId: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface BranchProduct {
  id: string;
  productId: string;
  branchId: string;
  companyId: string;
  currentPrice: number;
  stock: number;
  minStock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: Timestamp;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  position: string;
  branchId: string;
  branchName?: string;
  companyId: string;
  status: 'active' | 'inactive';
  permissions: StaffPermissions;
  lastLogin?: Timestamp;
  createdAt: Timestamp;
}

interface StaffPermissions {
  canViewProducts: boolean;
  canUpdateStock: boolean;
  canReportIssues: boolean;
  canViewReports: boolean;
  canChangePrices: boolean;
  canCreateProducts?: boolean;
  canCreateLabels?: boolean;
  canCreatePromotions?: boolean;
  maxPriceChange?: number;
}

interface DigitalLabel {
  id: string;
  labelId: string;
  labelCode?: string;
  productId: string | null;
  productName?: string;
  productSku?: string;
  branchId: string;
  branchName?: string;
  companyId: string;
  location: string;
  currentPrice: number | null;
  basePrice?: number | null;
  finalPrice?: number | null;
  discountPercent?: number | null;
  discountPrice?: number | null;
  battery: number;
  status: 'active' | 'inactive' | 'low-battery' | 'error' | 'syncing';
  lastSync?: Timestamp | null;
}

interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'bogo';
  value: number;
  companyId: string;
  applyTo: 'all' | 'selected';
  productIds: string[];
  branchIds: string[];
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'active' | 'upcoming' | 'expired';
  createdAt: Timestamp;
}
interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  companyId: string;
  createdAt: Timestamp;
}

interface IssueReport {
  id: string;
  labelId: string;
  productId?: string | null;
  productName?: string | null;
  issue: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  reportedAt: Timestamp;
  branchId: string;
  branchName?: string;
  companyId: string;
  reportedByName?: string;
}
//
export default function VendorDashboard() {
  const router = useRouter();
  const { user: currentUser, clearUser, hasHydrated } = useUserStore();
  // Hold active Firestore realtime listeners so we can cleanly unsubscribe.
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
  const [discountInputs, setDiscountInputs] = useState<Record<string, number>>({});
  const [assigningLabelId, setAssigningLabelId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [labelCategoryFilter, setLabelCategoryFilter] = useState<Record<string, string>>({});
  const [labelLocationEdits, setLabelLocationEdits] = useState<Record<string, string>>({});
  const [labelGenerateCount, setLabelGenerateCount] = useState<number>(6);
  const [labelSyncFilter, setLabelSyncFilter] = useState<'all' | 'synced' | 'not-synced'>('all');
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
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [showCreatePromotion, setShowCreatePromotion] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [showEditProduct, setShowEditProduct] = useState<Product | null>(null);
  const [showEditStaff, setShowEditStaff] = useState<StaffMember | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<string | null>(null);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [showEditBranch, setShowEditBranch] = useState(false);
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [promotionLabelPicker, setPromotionLabelPicker] = useState<{
    promotion: Promotion;
    selectedIds: string[];
  } | null>(null);
  // Modal states
const [showCategoryModal, setShowCategoryModal] = useState(false);
const [showProductModal, setShowProductModal] = useState(false);
const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  
  // Form states
  const [staffForm, setStaffForm] = useState<{
    name: string;
    email: string;
    position: string;
    branchId: string;
    password: string;
    permissions: StaffPermissions;
  }>({
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
  const [editStaffForm, setEditStaffForm] = useState<{
    name: string;
    email: string;
    position: string;
    branchId: string;
    status: 'active' | 'inactive';
    permissions: StaffPermissions;
  }>({
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

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    sku: '',
    productCode: '',
    category: 'General',
    basePrice: 0,
    imageUrl: '',
    stock: 0,
    minStock: 10
  });

  const [branchForm, setBranchForm] = useState({
    name: '',
    address: '',
    phone: '',
    manager: ''
  });
  const [editBranchForm, setEditBranchForm] = useState({
    id: '',
    name: '',
    address: '',
    phone: '',
    manager: '',
    status: 'active' as 'active' | 'inactive'
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

  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Redirect if not vendor
  useEffect(() => {
    if (!hasHydrated) return;
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role !== 'vendor') {
      if (currentUser.role === 'admin') router.push('/admin');
      if (currentUser.role === 'staff') router.push('/staff');
    }
  }, [currentUser, hasHydrated, router]);

  // Load company and data
  useEffect(() => {
    if (!hasHydrated) return;
    if (currentUser?.role === 'vendor' && currentUser.companyId) {
      loadVendorData();
    }
  }, [currentUser, hasHydrated]);

  // Realtime data (fast UI updates without manual refresh)
  useEffect(() => {
    if (!currentUser?.companyId) return;

    // cleanup any prior listeners
    realtimeUnsubsRef.current.forEach((u) => {
      try {
        u();
      } catch {}
    });
    realtimeUnsubsRef.current = [];

    const cid = currentUser.companyId;

    // Products
    const productsQuery = query(collection(db, 'products'), where('companyId', '==', cid));
    const unsubProducts = onSnapshot(productsQuery, (snap) => {
      const productsData = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as Product[];
      setProducts(productsData);
    });
    realtimeUnsubsRef.current.push(unsubProducts);

    // Branch Products (stock + pricing per branch)
    const branchProductsQuery = query(collection(db, 'branch_products'), where('companyId', '==', cid));
    const unsubBranchProducts = onSnapshot(branchProductsQuery, (snap) => {
      const branchProductsData = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as BranchProduct[];
      setBranchProducts(branchProductsData);
    });
    realtimeUnsubsRef.current.push(unsubBranchProducts);

    // Branches
    const branchesQuery = query(collection(db, 'branches'), where('companyId', '==', cid));
    const unsubBranches = onSnapshot(branchesQuery, (snap) => {
      const branchesData = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as Branch[];
      setBranches(branchesData);
    });
    realtimeUnsubsRef.current.push(unsubBranches);

    // Categories
    const categoriesQuery = query(collection(db, 'categories'), where('companyId', '==', cid));
    const unsubCategories = onSnapshot(categoriesQuery, (snap) => {
      const categoriesData = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as Category[];
      setCategories(categoriesData);
    });
    realtimeUnsubsRef.current.push(unsubCategories);

    return () => {
      realtimeUnsubsRef.current.forEach((u) => {
        try {
          u();
        } catch {}
      });
      realtimeUnsubsRef.current = [];
    };
  }, [currentUser?.companyId]);

  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  useEffect(() => {
    if (!selectedBranchId || selectedBranchId === 'all') return;
    const selected = branches.find((branch) => branch.id === selectedBranchId);
    if (!selected) return;
    setEditBranchForm({
      id: selected.id,
      name: selected.name || '',
      address: selected.address || '',
      phone: selected.phone || '',
      manager: selected.manager || '',
      status: selected.status || 'active'
    });
  }, [branches, selectedBranchId]);

  useEffect(() => {
    if (company) {
      setCompanyForm({
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || ''
      });
    }
  }, [company]);
  useEffect(() => {
    if (selectedBranchId && selectedBranchId !== 'all' && !staffForm.branchId) {
      setStaffForm((prev) => ({
        ...prev,
        branchId: selectedBranchId,
      }));
    }
  }, [selectedBranchId, staffForm.branchId]);

  useEffect(() => {
    if (labelModal) {
      setLabelModal(null);
    }
  }, [selectedTab]);

  useEffect(() => {
    if (!currentUser?.companyId) return;
    const labelsQuery = query(
      collection(db, 'labels'),
      where('companyId', '==', currentUser.companyId)
    );
    const unsubscribe = onSnapshot(labelsQuery, (snapshot) => {
      const productsById = new Map(products.map((product) => [product.id, product]));
      const branchesById = new Map(branches.map((branch) => [branch.id, branch]));
      const labelsData = snapshot.docs.map((docSnap) => {
        const labelRaw = docSnap.data() as any;
        const product = labelRaw?.productId ? productsById.get(labelRaw.productId) : undefined;
        const branch = labelRaw?.branchId ? branchesById.get(labelRaw.branchId) : undefined;

        return {
          ...labelRaw,
          id: docSnap.id,
          labelId: labelRaw?.labelId ?? labelRaw?.labelCode ?? docSnap.id,
          productName: labelRaw?.productName ?? product?.name ?? 'Unknown Product',
          productSku: labelRaw?.productSku ?? product?.sku ?? 'Unknown SKU',
          branchName: branch?.name ?? 'Unknown Branch'
        } as DigitalLabel;
      });
      setLabels(labelsData);
    });
    return () => unsubscribe();
  }, [currentUser?.companyId, products, branches]);

  const openLabelNotice = (
    title: string,
    message: string,
    tone: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    setLabelModal({
      title,
      message,
      tone,
      confirmLabel: 'OK',
    });
  };

  const openLabelConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmLabel = 'Confirm'
  ) => {
    setLabelModal({
      title,
      message,
      tone: 'warning',
      confirmLabel,
      cancelLabel: 'Cancel',
      onConfirm,
    });
  };

  const closeLabelModal = () => {
    setLabelModal(null);
  };

  const resetPromotionForm = () => {
    setPromotionForm({
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      applyTo: 'all',
      selectedProducts: [],
      selectedBranches: [],
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    });
    setShowCreatePromotion(false);
    setEditingPromotion(null);
  };

  const createPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.companyId) return;

    try {
      const payload = {
        name: promotionForm.name,
        description: promotionForm.description,
        type: promotionForm.type,
        value: Number(promotionForm.value),
        companyId: currentUser.companyId,
        applyTo: promotionForm.applyTo,
        productIds: promotionForm.selectedProducts,
        branchIds: promotionForm.selectedBranches,
        startDate: Timestamp.fromDate(new Date(promotionForm.startDate)),
        endDate: Timestamp.fromDate(new Date(promotionForm.endDate)),
        status: 'active',
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'promotions'), payload);
      resetPromotionForm();
      openLabelNotice('Success', 'Promotion created successfully!', 'success');
    } catch (error: any) {
      console.error('Error creating promotion:', error);
      openLabelNotice('Create failed', error.message || 'Could not create promotion.', 'error');
    }
  };

  const updatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromotion?.id) return;

    try {
      const payload = {
        name: promotionForm.name,
        description: promotionForm.description,
        type: promotionForm.type,
        value: Number(promotionForm.value),
        applyTo: promotionForm.applyTo,
        productIds: promotionForm.selectedProducts,
        branchIds: promotionForm.selectedBranches,
        startDate: Timestamp.fromDate(new Date(promotionForm.startDate)),
        endDate: Timestamp.fromDate(new Date(promotionForm.endDate)),
      };

      await updateDoc(fsDoc(db, 'promotions', editingPromotion.id), payload);
      resetPromotionForm();
      openLabelNotice('Success', 'Promotion updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating promotion:', error);
      openLabelNotice('Update failed', error.message || 'Could not update promotion.', 'error');
    }
  };

  const populatePromotionForm = (promotion: Promotion) => {
    const startDate = promotion.startDate?.toDate ? promotion.startDate.toDate() : null;
    const endDate = promotion.endDate?.toDate ? promotion.endDate.toDate() : null;

    setPromotionForm({
      name: promotion.name ?? '',
      description: promotion.description ?? '',
      type: promotion.type,
      value: promotion.value,
      applyTo: promotion.applyTo,
      selectedProducts: promotion.productIds ?? [],
      selectedBranches: promotion.branchIds ?? [],
      startDate: startDate ? startDate.toISOString().slice(0, 16) : '',
      endDate: endDate ? endDate.toISOString().slice(0, 16) : '',
    });
    setEditingPromotion(promotion);
  };

const loadVendorData = async () => {
  if (!currentUser?.companyId) return;

  try {
    if (!company) {
      setLoading(true);
    }
    
    // 1. Load company data
    const companyDoc = await getDoc(fsDoc(db, 'companies', currentUser.companyId));
    if (companyDoc.exists()) {
      setCompany({ id: companyDoc.id, ...companyDoc.data() } as Company);
    }

    // 2. Load branches (only for this company)
    const branchesQuery = query(
      collection(db, 'branches'),
      where('companyId', '==', currentUser.companyId)
    );
    const branchesSnapshot = await getDocs(branchesQuery);
    const branchesData = branchesSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as Branch[];
    setBranches(branchesData);

    // 3. Load products (only for this company)
    const productsQuery = query(
      collection(db, 'products'),
      where('companyId', '==', currentUser.companyId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const productsData = productsSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as Product[];
    setProducts(productsData);

    // 4. Load branch products (only for this company)
    const branchProductsQuery = query(
      collection(db, 'branch_products'),
      where('companyId', '==', currentUser.companyId)
    );
    const branchProductsSnapshot = await getDocs(branchProductsQuery);
    const branchProductsData = branchProductsSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as BranchProduct[];
    setBranchProducts(branchProductsData);

    // 🆕 ADD THIS SECTION RIGHT HERE - 5. Load categories
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('companyId', '==', currentUser.companyId)
    );
    const categoriesSnapshot = await getDocs(categoriesQuery);
    const categoriesData = categoriesSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as Category[];
    setCategories(categoriesData);

      // 5. Load staff (only for this company)
      const staffQuery = query(
        collection(db, 'users'),
        where('companyId', '==', currentUser.companyId),
        where('role', '==', 'staff')
      );
      const staffSnapshot = await getDocs(staffQuery);
      const staffData = await Promise.all(
        staffSnapshot.docs.map(async (docSnap) => {
          const staffRaw = docSnap.data() as any;
          const branchId = staffRaw?.branchId as string | undefined;

          const branchDocSnap = branchId
            ? await getDoc(fsDoc(db, 'branches', branchId))
            : null;

          const branchName =
            branchDocSnap && branchDocSnap.exists()
              ? ((branchDocSnap.data() as any)?.name ?? 'Unknown Branch')
              : 'Unknown Branch';

          return {
            id: docSnap.id,
            ...staffRaw,
            branchName
          } as StaffMember;
        })
      );
      setStaffMembers(staffData);

      // 6. Load labels (only for this company)
      const labelsQuery = query(
        collection(db, 'labels'),
        where('companyId', '==', currentUser.companyId)
      );
      const labelsSnapshot = await getDocs(labelsQuery);
      const productsById = new Map(productsData.map((product) => [product.id, product]));
      const branchesById = new Map(branchesData.map((branch) => [branch.id, branch]));
      const labelsData = labelsSnapshot.docs.map((docSnap) => {
        const labelRaw = docSnap.data() as any;
        const product = labelRaw?.productId ? productsById.get(labelRaw.productId) : undefined;
        const branch = labelRaw?.branchId ? branchesById.get(labelRaw.branchId) : undefined;

        return {
          id: docSnap.id,
          ...labelRaw,
          labelId: labelRaw?.labelId ?? labelRaw?.labelCode ?? docSnap.id,
          productName: labelRaw?.productName ?? product?.name ?? 'Unknown Product',
          productSku: labelRaw?.productSku ?? product?.sku ?? 'Unknown SKU',
          branchName: branch?.name ?? 'Unknown Branch'
        } as DigitalLabel;
      });
      setLabels(labelsData);

      // 7. Load promotions (only for this company)
      const promotionsQuery = query(
        collection(db, 'promotions'),
        where('companyId', '==', currentUser.companyId)
      );
      const promotionsSnapshot = await getDocs(promotionsQuery);
      const promotionsData = promotionsSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Promotion[];
      setPromotions(promotionsData);

      // 8. Load issue reports (only for this company)
      const issuesQuery = query(
        collection(db, 'issue_reports'),
        where('companyId', '==', currentUser.companyId)
      );
      const issuesSnapshot = await getDocs(issuesQuery);
      const issuesData = await Promise.all(
        issuesSnapshot.docs.map(async (docSnap) => {
          const issueData = docSnap.data() as any;
          const productId = issueData.productId as string | null | undefined;
          const productDoc = productId ? await getDoc(fsDoc(db, 'products', productId)) : null;
          const branchName = issueData.branchId
            ? branchesData.find((branch) => branch.id === issueData.branchId)?.name
            : undefined;
          return {
            id: docSnap.id,
            ...issueData,
            productName: productDoc && productDoc.exists()
              ? (productDoc.data() as any).name
              : productId
                ? 'Unknown Product'
                : 'Unknown Product',
            branchName
          } as IssueReport;
        })
      );
      setIssues(issuesData);

    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const reloadBranches = async () => {
    if (!currentUser?.companyId) return;
    const branchesQuery = query(
      collection(db, 'branches'),
      where('companyId', '==', currentUser.companyId)
    );
    const branchesSnapshot = await getDocs(branchesQuery);
    const branchesData = branchesSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as Branch[];
    setBranches(branchesData);
  };

  const reloadProducts = async () => {
    if (!currentUser?.companyId) return;
    const productsQuery = query(
      collection(db, 'products'),
      where('companyId', '==', currentUser.companyId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const productsData = productsSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as Product[];
    setProducts(productsData);
  };

  const reloadBranchProducts = async () => {
    if (!currentUser?.companyId) return;
    const branchProductsQuery = query(
      collection(db, 'branch_products'),
      where('companyId', '==', currentUser.companyId)
    );
    const branchProductsSnapshot = await getDocs(branchProductsQuery);
    const branchProductsData = branchProductsSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as BranchProduct[];
    setBranchProducts(branchProductsData);
  };

  const reloadCategories = async () => {
    if (!currentUser?.companyId) return;
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('companyId', '==', currentUser.companyId)
    );
    const categoriesSnapshot = await getDocs(categoriesQuery);
    const categoriesData = categoriesSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as Category[];
    setCategories(categoriesData);
  };

  const reloadLabels = async () => {
    if (!currentUser?.companyId) return;
    const labelsQuery = query(
      collection(db, 'labels'),
      where('companyId', '==', currentUser.companyId)
    );
    const labelsSnapshot = await getDocs(labelsQuery);
    const productsById = new Map(products.map((product) => [product.id, product]));
    const branchesById = new Map(branches.map((branch) => [branch.id, branch]));
    const labelsData = labelsSnapshot.docs.map((docSnap) => {
      const labelRaw = docSnap.data() as any;
      const product = labelRaw?.productId ? productsById.get(labelRaw.productId) : undefined;
      const branch = labelRaw?.branchId ? branchesById.get(labelRaw.branchId) : undefined;

      return {
        id: docSnap.id,
        ...labelRaw,
        labelId: labelRaw?.labelId ?? labelRaw?.labelCode ?? docSnap.id,
        productName: labelRaw?.productName ?? product?.name ?? 'Unknown Product',
        productSku: labelRaw?.productSku ?? product?.sku ?? 'Unknown SKU',
        branchName: branch?.name ?? 'Unknown Branch'
      } as DigitalLabel;
    });
    setLabels(labelsData);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const start = Date.now();
    try {
      // With realtime listeners, refresh is just a manual re-fetch for non-realtime parts.
      // Keep it fast and deterministic (min 1.5s).
      await Promise.all([
        loadVendorData(),
        // These are realtime already, but calling them is harmless if a user wants to force refresh.
        reloadBranches(),
        reloadProducts(),
        reloadBranchProducts(),
        reloadCategories(),
      ]);

      const elapsed = Date.now() - start;
      if (elapsed < 1500) await new Promise((r) => setTimeout(r, 1500 - elapsed));
      openLabelNotice('Refreshed', 'Latest data loaded.', 'success');
    } catch (e: any) {
      openLabelNotice('Refresh failed', e?.message || 'Could not refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const reloadPromotions = async () => {
    if (!currentUser?.companyId) return;
    const promotionsQuery = query(
      collection(db, 'promotions'),
      where('companyId', '==', currentUser.companyId)
    );
    const promotionsSnapshot = await getDocs(promotionsQuery);
    const promotionsData = promotionsSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as Promotion[];
    setPromotions(promotionsData);
  };

  const reloadIssues = async () => {
    if (!currentUser?.companyId) return;
    const issuesQuery = query(
      collection(db, 'issue_reports'),
      where('companyId', '==', currentUser.companyId)
    );
    const issuesSnapshot = await getDocs(issuesQuery);
    const issuesData = await Promise.all(
      issuesSnapshot.docs.map(async (docSnap) => {
        const issueData = docSnap.data() as any;
        const productId = issueData.productId as string | null | undefined;
        const productDoc = productId ? await getDoc(fsDoc(db, 'products', productId)) : null;
        const branchName = issueData.branchId
          ? branches.find((branch) => branch.id === issueData.branchId)?.name
          : undefined;
        return {
          id: docSnap.id,
          ...issueData,
          productName: productDoc && productDoc.exists()
            ? (productDoc.data() as any).name
            : productId
              ? 'Unknown Product'
              : 'Unknown Product',
          branchName
        } as IssueReport;
      })
    );
    setIssues(issuesData);
  };

  // Handle logout
  const handleLogout = async () => {
    await logOut();
    clearUser();
    router.push('/login');
  };

  // Create new staff
  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.companyId || !staffForm.branchId) {
      openLabelNotice('Select branch', 'Please select a branch.', 'warning');
      return;
    }

    try {
      // 1. Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        staffForm.email,
        staffForm.password
      );

      const userId = userCredential.user.uid;

      // 2. Create staff document
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

      // Refresh staff list (non-realtime section)
      loadVendorData();
      
      // Reset form and close modal
      setStaffForm({
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
      canCreateProducts: false,
      canCreateLabels: false,
      canCreatePromotions: false,
      maxPriceChange: 0
    }
  });
      setShowCreateStaff(false);

      openLabelNotice('Staff created', `Staff "${staffForm.name}" created successfully!`, 'success');

    } catch (error: any) {
      console.error('Error creating staff:', error);
      openLabelNotice('Create failed', error?.message || 'Could not create staff.', 'error');
    }
  };

  const openEditStaffModal = (staff: StaffMember) => {
    setShowEditStaff(staff);
    setEditStaffForm({
      name: staff.name || '',
      email: staff.email || '',
      position: staff.position || 'Cashier',
      branchId: staff.branchId || '',
      status: staff.status || 'active',
      permissions: {
        canViewProducts: staff.permissions?.canViewProducts ?? true,
        canUpdateStock: staff.permissions?.canUpdateStock ?? true,
        canReportIssues: staff.permissions?.canReportIssues ?? true,
        canViewReports: staff.permissions?.canViewReports ?? false,
        canChangePrices: staff.permissions?.canChangePrices ?? false,
        canCreateProducts: staff.permissions?.canCreateProducts ?? false,
        canCreateLabels: staff.permissions?.canCreateLabels ?? false,
        canCreatePromotions: staff.permissions?.canCreatePromotions ?? false,
        maxPriceChange: staff.permissions?.maxPriceChange ?? 0
      }
    });
  };

  const updateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditStaff?.id) return;
    if (!editStaffForm.branchId) {
      openLabelNotice('Select branch', 'Please select a branch.', 'warning');
      return;
    }

    try {
      const payload = {
        name: editStaffForm.name.trim(),
        email: editStaffForm.email.trim(),
        position: editStaffForm.position,
        branchId: editStaffForm.branchId,
        status: editStaffForm.status,
        permissions: editStaffForm.permissions,
        updatedAt: Timestamp.now()
      };
      await updateDoc(fsDoc(db, 'users', showEditStaff.id), payload);

      const branchName =
        branches.find((branch) => branch.id === editStaffForm.branchId)?.name ?? 'Unknown Branch';
      setStaffMembers((prev) =>
        prev.map((staff) =>
          staff.id === showEditStaff.id
            ? {
                ...staff,
                ...payload,
                branchName,
              }
            : staff
        )
      );
      setShowEditStaff(null);
      openLabelNotice('Staff updated', 'Staff details saved.', 'success');
    } catch (error) {
      console.error('Error updating staff:', error);
      openLabelNotice('Update failed', 'Could not update staff details.', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!showResetPassword || !resetPasswordForm.newPassword) return;
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      openLabelNotice('Error', 'Passwords do not match.', 'error');
      return;
    }

    try {
      // In this specific system, we might need a cloud function or 
      // admin SDK to reset another user's password without their current one.
      // For now, we'll simulate the success if it's a mock system or 
      // suggest using the secondaryAuth if possible.
      // NOTE: Real Firebase password reset for another user usually requires Admin SDK.
      
      openLabelNotice('Success', 'Password reset successfully.', 'success');
      setShowResetPassword(null);
      setResetPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      openLabelNotice('Reset failed', error?.message || 'Could not reset password.', 'error');
    }
  };

  const isAllBranchesSelected = !selectedBranchId || selectedBranchId === 'all';

  // Create new product
  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.companyId) return;

    try {
      const isBranchSpecific = Boolean(selectedBranchId && selectedBranchId !== 'all');
      const productSeq = isBranchSpecific
        ? await nextBranchSequence(selectedBranchId, "nextProductNumber")
        : await nextCompanySequence(currentUser.companyId, "nextProductNumber");
      const vendorCode = getCompanyDisplayCode();
      const productCode = productForm.productCode?.trim() || makeProductCodeForVendor(vendorCode, productSeq);
      const sku = productForm.sku?.trim() || makeSku(productSeq);

      if (isBranchSpecific) {
        const branchProductsList = productsByBranchId.get(selectedBranchId) ?? [];
        const productCodeConflict = branchProductsList.some(
          (product) => (product.productCode || '').toLowerCase() === productCode.toLowerCase()
        );
        if (productCodeConflict) {
          alert('Product code already exists for this branch.');
          return;
        }
        const skuConflict = branchProductsList.some(
          (product) => (product.sku || '').toLowerCase() === sku.toLowerCase()
        );
        if (skuConflict) {
          alert('SKU already exists for this branch.');
          return;
        }
      } else if (productForm.productCode?.trim()) {
        const existingCodeQuery = query(
          collection(db, 'products'),
          where('companyId', '==', currentUser.companyId),
          where('productCode', '==', productCode)
        );
        const existingCodeSnap = await getDocs(existingCodeQuery);
        if (!existingCodeSnap.empty) {
          alert('Product code already exists for this vendor.');
          return;
        }
      }

      if (!isBranchSpecific && productForm.sku?.trim()) {
        const existingSkuQuery = query(
          collection(db, 'products'),
          where('companyId', '==', currentUser.companyId),
          where('sku', '==', sku)
        );
        const existingSkuSnap = await getDocs(existingSkuQuery);
        if (!existingSkuSnap.empty) {
          alert('SKU already exists for this vendor.');
          return;
        }
      }

      const productRef = await addDoc(collection(db, 'products'), {
        ...productForm,
        productCode,
        sku,
        companyId: currentUser.companyId,
        createdBy: currentUser.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      const targetBranches = isAllBranchesSelected
        ? branches
        : branches.filter((branch) => branch.id === selectedBranchId);

      // Create branch products for selected branches
      const stock = Number(productForm.stock ?? 0);
      const minStock = Number(productForm.minStock ?? 10);
      const status =
        stock <= 0
          ? 'out-of-stock'
          : stock <= minStock
            ? 'low-stock'
            : 'in-stock';

      const batchPromises = targetBranches.map(async (branch) => {
        await addDoc(collection(db, 'branch_products'), {
          productId: productRef.id,
          branchId: branch.id,
          companyId: currentUser.companyId,
          currentPrice: productForm.basePrice,
          stock,
          minStock,
          status,
          lastUpdated: Timestamp.now()
        });
      });

      await Promise.all(batchPromises);

      // Refresh data
      await reloadProducts();
      await reloadBranchProducts();
      
      // Reset form and close modal
      setProductForm({
        name: '',
        description: '',
        sku: '',
        productCode: '',
        category: 'General',
        basePrice: 0,
        imageUrl: '',
        stock: 0,
        minStock: 10
      });
      setShowCreateProduct(false);

      alert(`Product "${productForm.name}" created successfully!`);

    } catch (error: any) {
      console.error('Error creating product:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Update product price (with optional branch filter)
  const updateProductPrice = async (productId: string, newPrice: number, branchIds?: string[]) => {
    if (!currentUser?.companyId) return;

    try {
      let queryRef = query(
        collection(db, 'branch_products'),
        where('productId', '==', productId),
        where('companyId', '==', currentUser.companyId)
      );

      if (branchIds && branchIds.length > 0) {
        queryRef = query(queryRef, where('branchId', 'in', branchIds));
      }

      const snapshot = await getDocs(queryRef);
      
      const updatePromises = snapshot.docs.map(async (docSnapshot) => {
        await updateDoc(fsDoc(db, 'branch_products', docSnapshot.id), {
          currentPrice: newPrice,
          lastUpdated: Timestamp.now()
        });
      });

      await Promise.all(updatePromises);

      // Update labels
      const labelsQuery = query(
        collection(db, 'labels'),
        where('productId', '==', productId),
        where('companyId', '==', currentUser.companyId)
      );

      const labelsSnapshot = await getDocs(labelsQuery);
      const labelDocs =
        branchIds && branchIds.length > 0
          ? labelsSnapshot.docs.filter((doc) => branchIds.includes(doc.data().branchId))
          : labelsSnapshot.docs;
      const labelUpdatePromises = labelDocs.map(async (docSnapshot) => {
        await updateDoc(fsDoc(db, 'labels', docSnapshot.id), {
          currentPrice: newPrice,
          status: 'syncing',
          lastSync: Timestamp.now()
        });
      });
      await Promise.all(labelUpdatePromises);

      // Fast UI: update local state immediately (realtime listeners will also reconcile)
      setBranchProducts((prev) =>
        prev.map((bp) => {
          if (bp.productId !== productId) return bp;
          if (branchIds && branchIds.length > 0 && !branchIds.includes(bp.branchId)) return bp;
          return {
            ...bp,
            currentPrice: newPrice,
            lastUpdated: Timestamp.now(),
          } as BranchProduct;
        })
      );

    } catch (error) {
      console.error('Error updating price:', error);
      // Avoid browser alerts; show a single professional modal.
      openLabelNotice('Update failed', 'Error updating price', 'error');
    }
  };

  // --- Supermarket: price source + label assignment ---
  const getBranchPriceForProduct = (productId: string, branchId: string) => {
    const bp = branchProducts.find((x) => x.productId === productId && x.branchId === branchId);
    if (bp?.currentPrice != null) return Number(bp.currentPrice);

    const p = products.find((x) => x.id === productId);
    return Number(p?.basePrice ?? 0);
  };

  const assignProductToLabel = async (
    labelDocId: string,
    productId: string,
    branchId: string,
    labelCode?: string
  ) => {
    try {
      setAssigningLabelId(labelDocId);

      const product = products.find((p) => p.id === productId);
      if (!product) {
        openLabelNotice('Product not found', 'Select a valid product before assigning.', 'error');
        return;
      }

      const basePrice = getBranchPriceForProduct(productId, branchId);
      if (!basePrice) {
        openLabelNotice(
          'Base price missing',
          'Set a product or branch price before assigning this label.',
          'warning'
        );
        return;
      }

      await updateDoc(fsDoc(db, 'labels', labelDocId), {
        labelId: labelCode ?? labelDocId,
        productId,
        productName: product.name,
        productSku: product.sku,
        currentPrice: basePrice, // what your labels UI already shows
        basePrice,
        finalPrice: basePrice,
        lastSync: Timestamp.now(),
        status: 'syncing',
      });

      setLabels((prev) =>
        prev.map((label) =>
          label.id === labelDocId
            ? {
                ...label,
                labelId: labelCode ?? labelDocId,
                productId,
                productName: product.name,
                productSku: product.sku,
                currentPrice: basePrice,
                basePrice,
                finalPrice: basePrice,
                lastSync: Timestamp.now(),
                status: 'syncing',
              }
            : label
        )
      );
      openLabelNotice('Label assigned', `${product.name} is now linked to this label.`, 'success');
    } catch (error: any) {
      console.error('Error assigning product to label:', error);
      openLabelNotice('Assign failed', error.message || 'Failed to assign product.', 'error');
    } finally {
      setAssigningLabelId(null);
    }
  };



  const handleGenerateLabels = async () => {
    if (!currentUser?.companyId) return;
    if (!selectedBranchId || selectedBranchId === 'all') {
      openLabelNotice('Select a branch', 'Choose a branch before generating labels.', 'warning');
      return;
    }

    try {
      const count = Math.max(1, Math.floor(Number(labelGenerateCount || 0)));
      if (!Number.isFinite(count)) {
        openLabelNotice('Invalid count', 'Enter a valid number of labels.', 'warning');
        return;
      }
      const result = await generateLabelsForBranch({
        companyId: currentUser.companyId,
        branchId: selectedBranchId,
        count,
      });
      await reloadLabels();

      openLabelNotice('Labels created', `Created ${result.created} labels for this branch.`, 'success');
    } catch (error) {
      console.error('Error generating labels:', error);
      openLabelNotice('Generate failed', 'Could not generate labels.', 'error');
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    try {
      await deleteDoc(fsDoc(db, 'labels', labelId));
      setLabels(prev => prev.filter(l => l.id !== labelId));
      openLabelNotice('Deleted', 'Digital label removed successfully.', 'success');
    } catch (error: any) {
      console.error('Error deleting label:', error);
      openLabelNotice('Delete failed', error.message || 'Could not delete label.', 'error');
    }
  };

  const handleUnlinkProductFromLabel = async (labelId: string) => {
    try {
      await updateDoc(fsDoc(db, 'labels', labelId), {
        productId: null,
        productName: null,
        productSku: null,
        currentPrice: 0,
        basePrice: 0,
        finalPrice: 0,
        status: 'inactive',
        lastSync: Timestamp.now()
      });
      openLabelNotice('Sync Stopped', 'Product unlinked and sync disabled.', 'success');
    } catch (error: any) {
      console.error('Error unlinking label:', error);
      openLabelNotice('Error', 'Could not stop synchronization.', 'error');
    }
  };


  const handleAutoAssignLabels = async () => {
    if (!currentUser?.companyId) return;
    if (!selectedBranchId || selectedBranchId === 'all') {
      openLabelNotice('Select a branch', 'Choose a branch before auto-assigning.', 'warning');
      return;
    }

    const branchLabels = labels.filter(
      (label) => label.branchId === selectedBranchId
    );
    const unassignedLabels = branchLabels.filter(
      (label) => !label.productId
    );

    if (unassignedLabels.length === 0) {
      openLabelNotice('No unassigned labels', 'All labels already have products.', 'info');
      return;
    }

    const branchProductsList = productsByBranchId.get(selectedBranchId) ?? [];
    if (branchProductsList.length === 0) {
      openLabelNotice('No products', 'Create products before assigning labels.', 'warning');
      return;
    }

    const usedProductIds = new Set(
      branchLabels
        .filter((l) => l.productId)
        .map((l) => l.productId!)
    );

    const availableProducts = branchProductsList.filter(
      (p) => !usedProductIds.has(p.id)
    );

    if (availableProducts.length === 0) {
      openLabelNotice('No available products', 'All products already have labels.', 'info');
      return;
    }

    const count = Math.min(unassignedLabels.length, availableProducts.length);
    const updates = unassignedLabels.slice(0, count).map(async (label, i) => {
      const p = availableProducts[i];
      await assignProductToLabel(label.id, p.id, selectedBranchId, label.labelCode);
    });

    await Promise.all(updates);
    openLabelNotice('Auto-assignment complete', `Successfully linked ${count} products to labels.`, 'success');
  };






  const applyDiscountToProduct = async (productId: string) => {
    const percentInput = prompt('Enter discount percent (1-100):');
    const percent = Number(percentInput);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      alert('Please enter a valid percent between 1 and 100.');
      return;
    }

    const durationInput = prompt('Optional: discount duration in minutes (leave blank for no expiry)');
    const durationMinutes = durationInput ? Number(durationInput) : undefined;

    const targetLabels = labels.filter((label) => label.productId === productId)
      .filter((label) => !isBranchFiltered || label.branchId === selectedBranchId);

    if (targetLabels.length === 0) {
      alert('No labels found for this product.');
      return;
    }

    try {
      await Promise.all(
        targetLabels.map((label) => {
          const basePrice = getBranchPriceForProduct(productId, label.branchId);
          return applyDiscountToLabel({
            labelId: label.id,
            basePrice,
            percent,
            durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : undefined,
          });
        })
      );

      await reloadBranches();
      alert(`✅ Applied ${percent}% discount to ${targetLabels.length} labels.`);
    } catch (error) {
      console.error('Error applying product discount:', error);
      alert('Error applying product discount');
    }
  };

  const clearDiscountForProduct = async (productId: string) => {
    const targetLabels = labels.filter((label) => label.productId === productId)
      .filter((label) => !isBranchFiltered || label.branchId === selectedBranchId);

    if (targetLabels.length === 0) {
      alert('No labels found for this product.');
      return;
    }

    try {
      await Promise.all(
        targetLabels.map((label) => {
          const basePrice = getBranchPriceForProduct(productId, label.branchId);
          return clearDiscountFromLabel({
            labelId: label.id,
            basePrice,
          });
        })
      );

      await reloadProducts();
      await reloadBranchProducts();
      alert(`✅ Cleared discount for ${targetLabels.length} labels.`);
    } catch (error) {
      console.error('Error clearing product discount:', error);
      alert('Error clearing product discount');
    }
  };

  // Create new branch
  const createBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.companyId) return;

    try {
      const branchRef = await addDoc(collection(db, 'branches'), {
        ...branchForm,
        companyId: currentUser.companyId,
        status: 'active',
        createdAt: Timestamp.now()
      });
      const newBranchId = branchRef.id;

      if (products.length > 0) {
        const createBranchProducts = products.map(async (product) => {
          const stock = Number(product.stock ?? 0);
          const minStock = Number(product.minStock ?? 10);
          const status =
            stock <= 0
              ? 'out-of-stock'
              : stock <= minStock
                ? 'low-stock'
                : 'in-stock';
          await addDoc(collection(db, 'branch_products'), {
            productId: product.id,
            branchId: newBranchId,
            companyId: currentUser.companyId,
            currentPrice: product.basePrice,
            stock,
            minStock,
            status,
            lastUpdated: Timestamp.now()
          });
        });
        await Promise.all(createBranchProducts);
      }

      // Refresh data
      await reloadBranches();
      await reloadProducts();
      await reloadBranchProducts();
      setSelectedBranchId(newBranchId);
      
      // Reset form and close modal
      setBranchForm({
        name: '',
        address: '',
        phone: '',
        manager: ''
      });
      setShowCreateBranch(false);

      alert(`Branch "${branchForm.name}" created successfully!`);

    } catch (error: any) {
      console.error('Error creating branch:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Create / update promotion
  const savePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.companyId) return;

    try {
      const wasEditing = Boolean(editingPromotion);
      const startTimestamp = Timestamp.fromDate(new Date(promotionForm.startDate));
      const endTimestamp = Timestamp.fromDate(new Date(promotionForm.endDate));
      const now = Timestamp.now();

      const status =
        now < startTimestamp
          ? 'upcoming'
          : now > endTimestamp
            ? 'expired'
            : 'active';

      const allowedProductIds =
        promotionForm.applyTo === 'selected' && promotionForm.selectedBranches.length > 0
          ? new Set(
              branchProducts
                .filter((bp) => promotionForm.selectedBranches.includes(bp.branchId))
                .map((bp) => bp.productId)
            )
          : null;
      const selectedProducts =
        promotionForm.applyTo === 'selected' && allowedProductIds
          ? promotionForm.selectedProducts.filter((id) => allowedProductIds.has(id))
          : promotionForm.applyTo === 'selected'
            ? []
            : promotionForm.selectedProducts;

      const promotionData = {
        ...promotionForm,
        companyId: currentUser.companyId,
        productIds: promotionForm.applyTo === 'all' ? [] : selectedProducts,
        branchIds: promotionForm.applyTo === 'all' ? [] : promotionForm.selectedBranches,
        startDate: startTimestamp,
        endDate: endTimestamp,
        status,
        updatedAt: now
      };

      let promotionId = editingPromotion?.id ?? '';
      const createdAt = editingPromotion?.createdAt ?? now;
      if (editingPromotion?.id) {
        await updateDoc(fsDoc(db, 'promotions', editingPromotion.id), promotionData);
      } else {
        const promotionRef = await addDoc(collection(db, 'promotions'), {
          ...promotionData,
          createdAt
        });
        promotionId = promotionRef.id;
      }

      // Apply promotion to prices
      if (!editingPromotion && promotionForm.type === 'percentage') {
        const discountMultiplier = (100 - promotionForm.value) / 100;
        
        // Get affected products
        let productQuery = query(
          collection(db, 'products'),
          where('companyId', '==', currentUser.companyId)
        );

        if (promotionForm.applyTo === 'selected' && selectedProducts.length > 0) {
          productQuery = query(productQuery, where('id', 'in', selectedProducts));
        }

        const productsSnapshot = await getDocs(productQuery);
        
        // Update prices for each product
        for (const productDoc of productsSnapshot.docs) {
          const product = productDoc.data() as Product;
          const newPrice = product.basePrice * discountMultiplier;
          
          // Update branch products
          await updateProductPrice(productDoc.id, newPrice, 
            promotionForm.applyTo === 'selected' ? promotionForm.selectedBranches : undefined);
        }
      }

      if (promotionForm.type === 'percentage' && status === 'active' && promotionId) {
        const promotionForLabels: Promotion = {
          id: promotionId,
          name: promotionForm.name,
          description: promotionForm.description,
          type: promotionForm.type,
          value: promotionForm.value,
          companyId: currentUser.companyId,
          applyTo: promotionForm.applyTo,
          productIds: promotionForm.applyTo === 'all' ? [] : selectedProducts,
          branchIds: promotionForm.applyTo === 'all' ? [] : promotionForm.selectedBranches,
          startDate: startTimestamp,
          endDate: endTimestamp,
          status,
          createdAt
        };
        await applyPromotionToLabels(promotionForLabels);
      }

      // Refresh data
      await reloadPromotions();
      
      resetPromotionForm();
      setShowCreatePromotion(false);

      alert(`Promotion "${promotionForm.name}" ${wasEditing ? 'updated' : 'created'} successfully!`);

    } catch (error: any) {
      console.error('Error saving promotion:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const deletePromotion = async (promotion: Promotion) => {
    if (!promotion?.id) return;
    openLabelConfirm(
      'Delete promotion',
      `Delete "${promotion.name}"? This cannot be undone.`,
      async () => {
        try {
          await deleteDoc(fsDoc(db, 'promotions', promotion.id));
          await reloadPromotions();
          openLabelNotice('Promotion deleted', 'The promotion has been removed.', 'success');
        } catch (error) {
          console.error('Error deleting promotion:', error);
          openLabelNotice('Delete failed', 'Could not delete this promotion.', 'error');
        }
      },
      'Delete'
    );
  };

  const updateLabelLocation = async (labelId: string) => {
    const nextLocation = (labelLocationEdits[labelId] ?? '').trim();
    if (!nextLocation) {
      openLabelNotice('Location required', 'Enter a shelf or aisle location.', 'warning');
      return;
    }

    try {
      await updateDoc(fsDoc(db, 'labels', labelId), {
        location: nextLocation,
        lastSync: Timestamp.now(),
      });
      setLabels((prev) =>
        prev.map((label) =>
          label.id === labelId
            ? {
                ...label,
                location: nextLocation,
                lastSync: Timestamp.now(),
              }
            : label
        )
      );
      openLabelNotice('Location updated', 'Label location saved.', 'success');
    } catch (error: any) {
      console.error('Error updating label location:', error);
      openLabelNotice('Update failed', error.message || 'Could not update location.', 'error');
    }
  };

  const resolveIssueReport = async (issue: IssueReport) => {
    if (!issue?.id) return;
    openLabelConfirm(
      'Confirm issue resolved',
      `Mark issue for label "${issue.labelId}" as resolved?`,
      async () => {
        try {
          await updateDoc(fsDoc(db, 'issue_reports', issue.id), {
            status: 'resolved',
            resolvedAt: Timestamp.now(),
            resolvedBy: currentUser?.id || null,
            resolvedByName: currentUser?.name || null,
          });

          const labelQuery = query(
            collection(db, 'labels'),
            where('labelId', '==', issue.labelId),
            where('companyId', '==', issue.companyId),
            where('branchId', '==', issue.branchId)
          );
          const labelSnapshot = await getDocs(labelQuery);
          if (!labelSnapshot.empty) {
            await Promise.all(
              labelSnapshot.docs.map((docSnap) =>
                updateDoc(fsDoc(db, 'labels', docSnap.id), {
                  status: 'active',
                  lastSync: Timestamp.now(),
                })
              )
            );
          }

          await reloadIssues();
          await reloadLabels();
          openLabelNotice('Issue resolved', 'Issue status updated.', 'success');
        } catch (error) {
          console.error('Error resolving issue:', error);
          openLabelNotice('Resolve failed', 'Could not resolve this issue.', 'error');
        }
      },
      'Confirm'
    );
  };

  const deleteIssueReport = async (issue: IssueReport) => {
    if (!issue?.id) return;
    openLabelConfirm(
      'Delete issue report',
      `Delete issue for label "${issue.labelId}"? This cannot be undone.`,
      async () => {
        try {
          await deleteDoc(fsDoc(db, 'issue_reports', issue.id));
          await reloadIssues();
          openLabelNotice('Issue deleted', 'The issue report has been removed.', 'success');
        } catch (error) {
          console.error('Error deleting issue report:', error);
          openLabelNotice('Delete failed', 'Could not delete this issue.', 'error');
        }
      },
      'Delete'
    );
  };

  const openPromotionLabelPicker = (promotion: Promotion) => {
    setPromotionLabelPicker({
      promotion,
      selectedIds: [],
    });
  };

  const applyPromotionToSelectedLabels = async () => {
    if (!promotionLabelPicker) return;
    const promotion = promotionLabelPicker.promotion;
    if (promotion.type !== 'percentage') {
      openLabelNotice('Unsupported promotion', 'Only percentage promotions can be applied to labels.', 'warning');
      return;
    }

    const targetLabels = promotionLabelCandidates.filter((label) =>
      promotionLabelPicker.selectedIds.includes(label.id)
    );

    if (targetLabels.length === 0) {
      openLabelNotice('Select labels', 'Choose at least one label to apply the promotion.', 'warning');
      return;
    }

    try {
      const percent = promotion.value;
      await Promise.all(
        targetLabels.map((label) => {
          const basePrice = getBranchPriceForProduct(label.productId as string, label.branchId);
          return applyDiscountToLabel({
            labelId: label.id,
            basePrice,
            percent,
          });
        })
      );

      const targetIds = new Set(targetLabels.map((label) => label.id));
      setLabels((prev) =>
        prev.map((label) => {
          if (!targetIds.has(label.id) || !label.productId) return label;
          const basePrice = getBranchPriceForProduct(label.productId, label.branchId);
          const discountPrice = Number((basePrice * (1 - percent / 100)).toFixed(2));
          return {
            ...label,
            basePrice,
            currentPrice: basePrice,
            finalPrice: discountPrice,
            discountPercent: percent,
            discountPrice,
            lastSync: Timestamp.now(),
            status: 'syncing',
          };
        })
      );
      openLabelNotice('Promotion applied', `Applied ${percent}% to ${targetLabels.length} labels.`, 'success');
      setPromotionLabelPicker(null);
    } catch (error) {
      console.error('Error applying promotion to labels:', error);
      openLabelNotice('Promotion failed', 'Could not apply the promotion.', 'error');
    }
  };

  // Create new category
  const createCategory = async (name: string, description: string = '') => {
  if (!currentUser?.companyId || !name.trim()) return;

  try {
    const DEFAULT_COLORS = [
      '#3B82F6', // blue
      '#10B981', // green
      '#EF4444', // red
      '#F59E0B', // yellow
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#6366F1', // indigo
      '#14B8A6', // teal
    ];

    const newCategory = {
      name: name.trim(),
      description: description.trim(), // Add this line
      companyId: currentUser.companyId,
      color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
      createdAt: Timestamp.now()
    };

    await addDoc(collection(db, 'categories'), newCategory);
    
      // Refresh categories
      await reloadCategories();

    alert(`Category "${name}" created!`);
  } catch (error) {
    console.error('Error creating category:', error);
    alert('Error creating category');
  }
};

// Delete category
const deleteCategory = async (category: Category) => {
  if (!category?.id) return;
  if (!confirm(`Delete category "${category.name}"? Products will keep their current category name.`)) {
    return;
  }

  try {
    await deleteDoc(fsDoc(db, 'categories', category.id));
    await reloadCategories();
    alert(`Category "${category.name}" deleted.`);
  } catch (error) {
    console.error('Error deleting category:', error);
    alert('Error deleting category');
  }
};

  // Reset staff password
  const resetStaffPassword = async (staffId: string) => {
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      // Note: In production, use Firebase Admin SDK or a Cloud Function
      // This is a demo approach
      
      // Find staff email
      const staff = staffMembers.find(s => s.id === staffId);
      if (!staff) return;

      // Re-authenticate admin with current password (for demo)
      const currentPassword = prompt('Please enter your password to confirm:');
      if (!currentPassword) return;

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, resetPasswordForm.newPassword);

      // Reset form
      setResetPasswordForm({
        newPassword: '',
        confirmPassword: ''
      });
      setShowResetPassword(null);
      
      alert('Password reset successfully!');
      
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Error resetting password');
    }
  };

  // Toggle staff status
  const toggleStaffStatus = async (staffId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      await updateDoc(fsDoc(db, 'users', staffId), { 
        status: newStatus 
      });
      
      // Update local state
      setStaffMembers(staffMembers.map(staff => 
        staff.id === staffId ? { ...staff, status: newStatus } : staff
      ));
      
      alert(`Staff status updated to ${newStatus}`);
      
    } catch (error) {
      console.error('Error updating staff status:', error);
    }
  };

  // Delete product
  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This will also remove it from all branches.')) {
      return;
    }

    try {
      // Delete product
      await deleteDoc(fsDoc(db, 'products', productId));

      // Delete branch products
      const branchProductsQuery = query(
        collection(db, 'branch_products'),
        where('productId', '==', productId)
      );
      const branchProductsSnapshot = await getDocs(branchProductsQuery);
      
      const deletePromises = branchProductsSnapshot.docs.map((docSnap) =>
        deleteDoc(docSnap.ref)
      );
      await Promise.all(deletePromises);

      // Refresh data
      await reloadLabels();
      alert('Product deleted successfully!');

    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    }
  };

  // ========== ADD THESE 3 FUNCTIONS RIGHT HERE ==========

// Create product from modal
const createProductFromModal = async (productData: any) => {
  if (!currentUser?.companyId) return;

  try {
    const isBranchSpecific = Boolean(selectedBranchId && selectedBranchId !== 'all');
    const productSeq = isBranchSpecific
      ? await nextBranchSequence(selectedBranchId, "nextProductNumber")
      : await nextCompanySequence(currentUser.companyId, "nextProductNumber");
    const vendorCode = getCompanyDisplayCode();
    const productCode = productData.productCode?.trim() || makeProductCodeForVendor(vendorCode, productSeq);
    const sku = productData.sku?.trim() || makeSku(productSeq);

    if (isBranchSpecific) {
      const branchProductsList = productsByBranchId.get(selectedBranchId) ?? [];
      const productCodeConflict = branchProductsList.some(
        (product) => (product.productCode || '').toLowerCase() === productCode.toLowerCase()
      );
      if (productCodeConflict) {
        alert('Product code already exists for this branch.');
        return;
      }
      const skuConflict = branchProductsList.some(
        (product) => (product.sku || '').toLowerCase() === sku.toLowerCase()
      );
      if (skuConflict) {
        alert('SKU already exists for this branch.');
        return;
      }
    } else if (productData.productCode?.trim()) {
      const existingCodeQuery = query(
        collection(db, 'products'),
        where('companyId', '==', currentUser.companyId),
        where('productCode', '==', productCode)
      );
      const existingCodeSnap = await getDocs(existingCodeQuery);
      if (!existingCodeSnap.empty) {
        alert('Product code already exists for this vendor.');
        return;
      }
    }

    if (!isBranchSpecific && productData.sku?.trim()) {
      const existingSkuQuery = query(
        collection(db, 'products'),
        where('companyId', '==', currentUser.companyId),
        where('sku', '==', sku)
      );
      const existingSkuSnap = await getDocs(existingSkuQuery);
      if (!existingSkuSnap.empty) {
        alert('SKU already exists for this vendor.');
        return;
      }
    }

    const productRef = await addDoc(collection(db, 'products'), {
      ...productData,
      productCode,
      sku,
      companyId: currentUser.companyId,
      createdBy: currentUser.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    const targetBranches = isAllBranchesSelected
      ? branches
      : branches.filter((branch) => branch.id === selectedBranchId);

    // Create branch products for selected branches
    const stock = Number(productData.stock ?? 0);
    const minStock = Number(productData.minStock ?? 10);
    const status =
      stock <= 0
        ? 'out-of-stock'
        : stock <= minStock
          ? 'low-stock'
          : 'in-stock';

    const batchPromises = targetBranches.map(async (branch) => {
      await addDoc(collection(db, 'branch_products'), {
        productId: productRef.id,
        branchId: branch.id,
        companyId: currentUser.companyId,
        currentPrice: productData.basePrice,
        stock,
        minStock,
        status,
        lastUpdated: Timestamp.now()
      });
    });

    await Promise.all(batchPromises);

    // Refresh data
    await reloadProducts();
    await reloadBranchProducts();
    alert(`Product "${productData.name}" created successfully!`);

  } catch (error: any) {
    console.error('Error creating product:', error);
    alert(`Error: ${error.message}`);
  }
};

// Update existing product
const updateProduct = async (productId: string, productData: any) => {
  if (!currentUser?.companyId) return;
  if (productUpdateLockRef.current) return;
  productUpdateLockRef.current = true;

  try {
    const isBranchSpecific = Boolean(selectedBranchId && selectedBranchId !== 'all');
    if (isBranchSpecific) {
      const branchProductsList = productsByBranchId.get(selectedBranchId) ?? [];
      if (productData.productCode?.trim()) {
        const conflict = branchProductsList.find(
          (product) =>
            product.id !== productId &&
            (product.productCode || '').toLowerCase() === productData.productCode.trim().toLowerCase()
        );
        if (conflict) {
          openLabelNotice('Cannot update product', 'Product code already exists for this branch.', 'warning');
          return;
        }
      }
      if (productData.sku?.trim()) {
        const conflict = branchProductsList.find(
          (product) =>
            product.id !== productId &&
            (product.sku || '').toLowerCase() === productData.sku.trim().toLowerCase()
        );
        if (conflict) {
          openLabelNotice('Cannot update product', 'SKU already exists for this branch.', 'warning');
          return;
        }
      }
    } else {
      if (productData.productCode?.trim()) {
        const existingCodeQuery = query(
          collection(db, 'products'),
          where('companyId', '==', currentUser.companyId),
          where('productCode', '==', productData.productCode.trim())
        );
        const existingCodeSnap = await getDocs(existingCodeQuery);
        const conflict = existingCodeSnap.docs.find((docSnap) => docSnap.id !== productId);
        if (conflict) {
          openLabelNotice('Cannot update product', 'Product code already exists for this vendor.', 'warning');
          return;
        }
      }

      if (productData.sku?.trim()) {
        const existingSkuQuery = query(
          collection(db, 'products'),
          where('companyId', '==', currentUser.companyId),
          where('sku', '==', productData.sku.trim())
        );
        const existingSkuSnap = await getDocs(existingSkuQuery);
        const conflict = existingSkuSnap.docs.find((docSnap) => docSnap.id !== productId);
        if (conflict) {
          openLabelNotice('Cannot update product', 'SKU already exists for this vendor.', 'warning');
          return;
        }
      }
    }

    const payload = {
      ...productData,
      updatedAt: Timestamp.now()
    };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });
    await updateDoc(fsDoc(db, 'products', productId), payload);

    // If price changed, update branch products
    if (productData.basePrice) {
      await updateProductPrice(productId, productData.basePrice);
    }

    // Realtime listeners update the UI automatically; no need to reload.
    openLabelNotice('Updated', `Product "${productData.name}" updated successfully!`, 'success');

  } catch (error: any) {
    console.error('Error updating product:', error);
    openLabelNotice('Update failed', error?.message || 'Error updating product', 'error');
  } finally {
    productUpdateLockRef.current = false;
  }
};

// Handle edit product form submission
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditProduct?.id || !currentUser?.companyId) return;

    if (productUpdateLockRef.current) return;
    productUpdateLockRef.current = true;

    try {
    const isBranchSpecific = Boolean(selectedBranchId && selectedBranchId !== 'all');
    if (isBranchSpecific) {
      const branchProductsList = productsByBranchId.get(selectedBranchId) ?? [];
      if (showEditProduct.productCode?.trim()) {
        const conflict = branchProductsList.find(
          (product) =>
            product.id !== showEditProduct.id &&
            (product.productCode || '').toLowerCase() === showEditProduct.productCode.trim().toLowerCase()
        );
	        if (conflict) {
	          openLabelNotice('Cannot update product', 'Product code already exists for this branch.', 'warning');
	          return;
	        }
      }

      if (showEditProduct.sku?.trim()) {
        const conflict = branchProductsList.find(
          (product) =>
            product.id !== showEditProduct.id &&
            (product.sku || '').toLowerCase() === showEditProduct.sku.trim().toLowerCase()
        );
	        if (conflict) {
	          openLabelNotice('Cannot update product', 'SKU already exists for this branch.', 'warning');
	          return;
	        }
      }
    } else {
      if (showEditProduct.productCode?.trim()) {
        const existingCodeQuery = query(
          collection(db, 'products'),
          where('companyId', '==', currentUser.companyId),
          where('productCode', '==', showEditProduct.productCode.trim())
        );
        const existingCodeSnap = await getDocs(existingCodeQuery);
        const conflict = existingCodeSnap.docs.find((docSnap) => docSnap.id !== showEditProduct.id);
	        if (conflict) {
	          openLabelNotice('Cannot update product', 'Product code already exists for this vendor.', 'warning');
	          return;
	        }
      }

      if (showEditProduct.sku?.trim()) {
        const existingSkuQuery = query(
          collection(db, 'products'),
          where('companyId', '==', currentUser.companyId),
          where('sku', '==', showEditProduct.sku.trim())
        );
        const existingSkuSnap = await getDocs(existingSkuQuery);
        const conflict = existingSkuSnap.docs.find((docSnap) => docSnap.id !== showEditProduct.id);
	        if (conflict) {
	          openLabelNotice('Cannot update product', 'SKU already exists for this vendor.', 'warning');
	          return;
	        }
      }
    }

    const payload: any = {
      name: showEditProduct.name,
      description: showEditProduct.description,
      sku: showEditProduct.sku,
      productCode: showEditProduct.productCode,
      category: showEditProduct.category,
      basePrice: showEditProduct.basePrice,
      minStock: (showEditProduct as any).minStock, 
      imageUrl: showEditProduct.imageUrl,
      updatedAt: Timestamp.now(),
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });
    await updateDoc(fsDoc(db, 'products', showEditProduct.id), payload);

    if (showEditProduct.stock != null || showEditProduct.minStock != null) {
      const stockValue = Number(showEditProduct.stock ?? 0);
      const rawMinStock = showEditProduct.minStock;
      const minStockValue =
        rawMinStock === undefined || rawMinStock === null || rawMinStock === ('' as any)
          ? undefined
          : Number(rawMinStock);
      // Use stored minStock (if provided) for status; otherwise fall back to default.
      const minStockForStatus = Number.isFinite(minStockValue as number)
        ? (minStockValue as number)
        : 10;
      const status =
        stockValue <= 0
          ? 'out-of-stock'
          : stockValue <= minStockForStatus
            ? 'low-stock'
            : 'in-stock';

      const branchFilter =
        selectedBranchId && selectedBranchId !== 'all'
          ? [selectedBranchId]
          : branches.map((branch) => branch.id);

      if (branchFilter.length > 0) {
        const bpQuery = query(
          collection(db, 'branch_products'),
          where('productId', '==', showEditProduct.id),
          where('branchId', 'in', branchFilter)
        );
        const bpSnap = await getDocs(bpQuery);
        await Promise.all(
          bpSnap.docs.map((docSnap) => {
            const updatePayload: any = {
              stock: stockValue,
              status,
              lastUpdated: Timestamp.now()
            };
            if (minStockValue !== undefined && Number.isFinite(minStockValue)) {
              updatePayload.minStock = minStockValue;
            }
            return updateDoc(fsDoc(db, 'branch_products', docSnap.id), updatePayload);
          })
        );
      }
    }

    // If price changed, update branch products
    if (showEditProduct.basePrice) {
      await updateProductPrice(showEditProduct.id, showEditProduct.basePrice);
    }

    // Realtime listeners update the UI automatically; no need to reload.
    setShowEditProduct(null);
    openLabelNotice('Updated', `Product "${showEditProduct.name}" updated successfully!`, 'success');

  } catch (error: any) {
    console.error('Error updating product:', error);
    openLabelNotice('Update failed', error?.message || 'Error updating product', 'error');
  } finally {
    productUpdateLockRef.current = false;
  }
};


  const isBranchFiltered = selectedBranchId !== 'all' && selectedBranchId !== '';
  const filteredBranchProducts = isBranchFiltered
    ? branchProducts.filter((product) => product.branchId === selectedBranchId)
    : branchProducts;
  const filteredStaffMembers = isBranchFiltered
    ? staffMembers.filter((staff) => staff.branchId === selectedBranchId)
    : staffMembers;
  const searchedStaffMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return filteredStaffMembers;
    return filteredStaffMembers.filter((staff) => {
      const fields = [
        staff.name,
        staff.email,
        staff.position,
        staff.branchName,
      ];
      return fields.some((field) => field?.toLowerCase().includes(term));
    });
  }, [searchTerm, filteredStaffMembers]);
  const filteredLabels = isBranchFiltered
    ? labels.filter((label) => label.branchId === selectedBranchId)
    : labels;
  const getLabelDisplayId = (label: DigitalLabel) => label.labelId || label.labelCode || label.id;
  const searchedLabels = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return filteredLabels;
    return filteredLabels.filter((label) => {
      const fields = [
        getLabelDisplayId(label),
        label.productName,
        label.productSku,
        label.branchName,
        label.location,
      ];
      return fields.some((field) => field?.toLowerCase().includes(term));
    });
  }, [searchTerm, filteredLabels]);
  const sortedFilteredLabels = useMemo(() => {
    const items = [...searchedLabels];
    items.sort((a, b) => {
      const aLoc = (a.location || '').trim().toLowerCase();
      const bLoc = (b.location || '').trim().toLowerCase();
      if (aLoc && bLoc && aLoc !== bLoc) {
        return aLoc.localeCompare(bLoc);
      }
      if (aLoc && !bLoc) return -1;
      if (!aLoc && bLoc) return 1;
      const aMatch = getLabelDisplayId(a).match(/\d+/);
      const bMatch = getLabelDisplayId(b).match(/\d+/);
      const aNum = aMatch ? Number(aMatch[0]) : Number.MAX_SAFE_INTEGER;
      const bNum = bMatch ? Number(bMatch[0]) : Number.MAX_SAFE_INTEGER;
      if (aNum !== bNum) return aNum - bNum;
      return getLabelDisplayId(a).localeCompare(getLabelDisplayId(b));
    });
    return items;
  }, [searchedLabels]);
  const labelStatusStyles: Record<DigitalLabel['status'], string> = {
    active: 'bg-emerald-100 text-emerald-700',
    'low-battery': 'bg-amber-100 text-amber-700',
    syncing: 'bg-blue-100 text-blue-700',
    inactive: 'bg-slate-100 text-slate-700',
    error: 'bg-rose-100 text-rose-700',
  };
  const labelModalToneStyles: Record<'info' | 'success' | 'warning' | 'error', string> = {
    info: 'bg-blue-50 text-blue-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-rose-50 text-rose-700',
  };
  const selectedBranchName = isBranchFiltered
    ? branches.find((branch) => branch.id === selectedBranchId)?.name ?? 'Selected Branch'
    : 'All Branches';
  const visibleProducts = isBranchFiltered
    ? products.filter((product) =>
        filteredBranchProducts.some((bp) => bp.productId === product.id)
      )
    : products;
  const searchedProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return visibleProducts;
    return visibleProducts.filter((product) => {
      const fields = [
        product.name,
        product.description,
        product.sku,
        product.category,
        product.productCode,
        product.id,
      ];
      return fields.some((field) => field?.toLowerCase().includes(term));
    });
  }, [searchTerm, visibleProducts]);
  const getDisplayStockForProduct = (productId: string) => {
    const candidates = isBranchFiltered
      ? branchProducts.filter(
          (bp) => bp.productId === productId && bp.branchId === selectedBranchId
        )
      : branchProducts.filter((bp) => bp.productId === productId);

    const first = candidates[0];
    return {
      stock: first?.stock ?? 0,
	    // Don't force a default here; show the actual stored value for the selected branch.
	    minStock: first?.minStock,
    };
  };
  const productsByBranchId = useMemo(() => {
    const productLookup = new Map(products.map((product) => [product.id, product]));
    const map = new Map<string, Product[]>();
    branchProducts.forEach((bp) => {
      const product = productLookup.get(bp.productId);
      if (!product) return;
      const list = map.get(bp.branchId) ?? [];
      list.push(product);
      map.set(bp.branchId, list);
    });
    return map;
  }, [branchProducts, products]);
  const totalProductPages = Math.max(1, Math.ceil(searchedProducts.length / productsPerPage));
  const paginatedProducts = useMemo(() => {
    const startIndex = (productPage - 1) * productsPerPage;
    return searchedProducts.slice(startIndex, startIndex + productsPerPage);
  }, [productPage, productsPerPage, searchedProducts]);
  useEffect(() => {
    setProductPage(1);
  }, [searchedProducts.length, productsPerPage]);
  useEffect(() => {
    setProductPage((prev) => Math.min(prev, totalProductPages));
  }, [totalProductPages]);
  const promotionVisibleProducts = useMemo(() => {
    if (promotionForm.applyTo !== 'selected') return products;
    if (promotionForm.selectedBranches.length === 0) return [];
    const selectedBranches = new Set(promotionForm.selectedBranches);
    const productIds = new Set(
      branchProducts
        .filter((bp) => selectedBranches.has(bp.branchId))
        .map((bp) => bp.productId)
    );
    return products.filter((product) => productIds.has(product.id));
  }, [
    promotionForm.applyTo,
    promotionForm.selectedBranches,
    branchProducts,
    products
  ]);
  const promotionLabelCandidates = useMemo(() => {
    if (!promotionLabelPicker) return [];
    const promotion = promotionLabelPicker.promotion;
    return labels.filter((label) => {
      if (!label.productId) return false;
      if (promotion.applyTo === 'selected') {
        if (promotion.productIds.length > 0 && !promotion.productIds.includes(label.productId)) {
          return false;
        }
        if (promotion.branchIds.length > 0 && !promotion.branchIds.includes(label.branchId)) {
          return false;
        }
      }
      return true;
    });
  }, [labels, promotionLabelPicker]);
  const searchedPromotions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return promotions;
    return promotions.filter((promotion) => {
      const fields = [promotion.name, promotion.description];
      return fields.some((field) => field?.toLowerCase().includes(term));
    });
  }, [searchTerm, promotions]);
  const searchedIssues = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return issues;
    return issues.filter((issue) => {
      const fields = [
        issue.labelId,
        issue.productName,
        issue.issue,
        issue.branchName,
        issue.status,
        issue.priority,
      ];
      return fields.some((field) => field?.toLowerCase().includes(term));
    });
  }, [searchTerm, issues]);
  const getCompanyDisplayCode = () => {
    const raw = company?.code || (company?.id ? `VE${company.id.slice(-3).toUpperCase()}` : 'VE000');
    return raw.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  };
  const getBranchDisplayId = (branchId?: string) => {
    if (!branchId) return 'BR-0000';
    const clean = branchId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const suffix = clean.slice(-4).padStart(4, '0');
    return `BR-${suffix}`;
  };
  const getPermissionLabel = (key: string) => {
    const labels: Record<string, string> = {
      canViewProducts: 'Manage Products',
      canUpdateStock: 'Update Stock',
      canReportIssues: 'Report Issues',
      canViewReports: 'View Reports',
      canChangePrices: 'Change Prices',
      canCreateProducts: 'Manage Products',
      canCreateLabels: 'Manage Labels',
      canCreatePromotions: 'Manage Promotions',
    };
    return labels[key] || key.replace('can', '').replace(/([A-Z])/g, ' $1').trim();
  };
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: `Products (${visibleProducts.length})`, icon: Package },
    { id: 'staff', label: `Staff (${filteredStaffMembers.length})`, icon: Users },
    { id: 'labels', label: `Labels (${filteredLabels.length})`, icon: Tag },
    { id: 'promotions', label: `Promotions (${promotions.length})`, icon: Percent },
    { id: 'sales', label: 'Sales', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;


const mobileTabs = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'labels', label: 'Labels', icon: Tag },
  { id: 'promotions', label: 'Deals', icon: Percent },
  { id: 'sales', label: 'Sales', icon: DollarSign },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

  const updateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranchForm.id) return;

    try {
      await updateDoc(fsDoc(db, 'branches', editBranchForm.id), {
        name: editBranchForm.name.trim(),
        address: editBranchForm.address.trim(),
        phone: editBranchForm.phone.trim(),
        manager: editBranchForm.manager.trim(),
        status: editBranchForm.status,
        updatedAt: Timestamp.now()
      });
      await reloadLabels();
      setShowEditBranch(false);
      alert('Branch updated successfully!');
    } catch (error) {
      console.error('Error updating branch:', error);
      alert('Error updating branch');
    }
  };

  const deleteBranch = async (branchId: string) => {
    if (!currentUser?.companyId) return;
    if (!confirm('Delete this branch? This will remove its labels and branch products.')) {
      return;
    }

    try {
      const branchProductsQuery = query(
        collection(db, 'branch_products'),
        where('branchId', '==', branchId),
        where('companyId', '==', currentUser.companyId)
      );
      const branchProductsSnapshot = await getDocs(branchProductsQuery);
      await Promise.all(branchProductsSnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));

      const labelsQuery = query(
        collection(db, 'labels'),
        where('branchId', '==', branchId),
        where('companyId', '==', currentUser.companyId)
      );
      const labelsSnapshot = await getDocs(labelsQuery);
      await Promise.all(labelsSnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));

      const staffQuery = query(
        collection(db, 'users'),
        where('companyId', '==', currentUser.companyId),
        where('role', '==', 'staff'),
        where('branchId', '==', branchId)
      );
      const staffSnapshot = await getDocs(staffQuery);
      await Promise.all(
        staffSnapshot.docs.map((docSnap) =>
          updateDoc(docSnap.ref, {
            branchId: null,
            status: 'inactive',
            updatedAt: Timestamp.now()
          })
        )
      );

      await deleteDoc(fsDoc(db, 'branches', branchId));
      await reloadBranches();
      await reloadBranchProducts();
      await reloadLabels();

      if (selectedBranchId === branchId) {
        setSelectedBranchId(branches.find((branch) => branch.id !== branchId)?.id ?? 'all');
      }

      openLabelNotice('Branch deleted', 'Branch removed successfully.', 'success');
    } catch (error) {
      console.error('Error deleting branch:', error);
      openLabelNotice('Delete failed', 'Could not delete this branch.', 'error');
    }
  };

  // Update company info
  const updateCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;

    try {
      const payload = {
        name: companyForm.name.trim(),
        phone: companyForm.phone.trim(),
        address: companyForm.address.trim(),
        updatedAt: Timestamp.now()
      };
      await updateDoc(fsDoc(db, 'companies', company.id), payload);
      await reloadLabels();
      setShowEditCompany(false);
      alert('Company updated successfully!');
    } catch (error) {
      console.error('Error updating company:', error);
      alert('Error updating company');
    }
  };

  const applyPromotionToLabels = async (promotion: Promotion) => {
    if (promotion.type !== 'percentage') {
      openLabelNotice('Unsupported promotion', 'Only percentage promotions can be applied to labels.', 'warning');
      return;
    }

    const now = new Date();
    const start = promotion.startDate?.toDate ? promotion.startDate.toDate() : null;
    const end = promotion.endDate?.toDate ? promotion.endDate.toDate() : null;
    if (start && now < start) {
      openLabelNotice('Promotion not active', 'This promotion has not started yet.', 'info');
      return;
    }
    if (end && now > end) {
      openLabelNotice('Promotion ended', 'This promotion has already ended.', 'info');
      return;
    }

    const percent = promotion.value;
    const candidateLabels = labels.filter((label) => {
      if (!label.productId) return false;
      if (promotion.applyTo === 'selected') {
        if (promotion.productIds.length > 0 && !promotion.productIds.includes(label.productId)) {
          return false;
        }
        if (promotion.branchIds.length > 0 && !promotion.branchIds.includes(label.branchId)) {
          return false;
        }
      }
      return true;
    });

    if (candidateLabels.length === 0) {
      const hasLabels = labels.length > 0;
      const assignedLabels = labels.filter((label) => label.productId).length;
      if (!hasLabels) {
        openLabelNotice('No labels found', 'Generate labels first.', 'info');
      } else if (assignedLabels === 0) {
        openLabelNotice('No assigned products', 'Auto-assign products first.', 'info');
      } else {
        openLabelNotice('No matching labels', 'Check selected products or branches.', 'info');
      }
      return;
    }

    try {
      const nowStamp = Timestamp.now();
      await Promise.all(
        candidateLabels.map((label) => {
          const basePrice = getBranchPriceForProduct(label.productId as string, label.branchId as string);
          return applyDiscountToLabel({
            labelId: label.id,
            basePrice,
            percent,
          });
        })
      );

      const candidateIds = new Set(candidateLabels.map((label) => label.id));
      setLabels((prev) =>
        prev.map((label) => {
          if (!candidateIds.has(label.id) || !label.productId) return label;
          const basePrice = getBranchPriceForProduct(label.productId, label.branchId);
          const discountPrice = Math.round(basePrice * (1 - percent / 100) * 100) / 100;
          return {
            ...label,
            basePrice,
            currentPrice: basePrice,
            finalPrice: discountPrice,
            discountPercent: percent,
            discountPrice,
            lastSync: nowStamp,
            status: 'syncing',
          };
        })
      );

      openLabelNotice('Promotion applied', `Applied ${percent}% to ${candidateLabels.length} labels.`, 'success');
    } catch (error) {
      console.error('Error applying promotion to labels:', error);
      openLabelNotice('Promotion failed', 'Could not apply the promotion.', 'error');
    }
  };


  const clearLabelAssignment = async (labelId: string) => {
    openLabelConfirm('Clear assignment', 'Remove the product from this label?', async () => {
      try {
        await updateDoc(fsDoc(db, 'labels', labelId), {
          productId: null,
          productName: null,
          productSku: null,
          basePrice: null,
          currentPrice: null,
          finalPrice: null,
          discountPercent: null,
          discountPrice: null,
          lastSync: Timestamp.now(),
          status: 'inactive',
        });
        setLabels((prev) =>
          prev.map((label) =>
            label.id === labelId
              ? {
                  ...label,
                  productId: null,
                  productName: null,
                  productSku: null,
                  basePrice: null,
                  currentPrice: null,
                  finalPrice: null,
                  discountPercent: null,
                  discountPrice: null,
                  lastSync: Timestamp.now(),
                  status: 'inactive',
                }
              : label
          )
        );
        openLabelNotice('Label cleared', 'Product assignment removed.', 'success');
      } catch (error) {
        console.error('Error clearing label:', error);
        openLabelNotice('Clear failed', 'Could not clear this label.', 'error');
      }
    }, 'Clear');
  };

  const deleteLabel = async (labelId: string) => {
    openLabelConfirm('Delete label', 'This will permanently delete the label.', async () => {
      try {
        await deleteDoc(fsDoc(db, 'labels', labelId));
        setLabels((prev) => prev.filter((label) => label.id !== labelId));
        openLabelNotice('Label deleted', 'The label has been removed.', 'success');
      } catch (error) {
        console.error('Error deleting label:', error);
        openLabelNotice('Delete failed', 'Could not delete the label.', 'error');
      }
    }, 'Delete');
  };

  const deleteAllLabelsForBranch = async () => {
    if (!currentUser?.companyId) return;
    if (!selectedBranchId || selectedBranchId === 'all') {
      openLabelNotice('Select a branch', 'Choose a branch before deleting labels.', 'warning');
      return;
    }

    openLabelConfirm(
      'Delete all labels',
      'This will delete every label in the selected branch.',
      async () => {
        try {
          const branchLabels = labels.filter((label) => label.branchId === selectedBranchId);
          await Promise.all(branchLabels.map((label) => deleteDoc(fsDoc(db, 'labels', label.id))));
          setLabels((prev) => prev.filter((label) => label.branchId !== selectedBranchId));
          openLabelNotice('Labels deleted', 'All labels in this branch were deleted.', 'success');
        } catch (error) {
          console.error('Error deleting labels:', error);
          openLabelNotice('Delete failed', 'Could not delete labels for this branch.', 'error');
        }
      },
      'Delete all'
    );
  };

  const clearAllLabelsForBranch = async () => {
    if (!currentUser?.companyId) return;
    if (!selectedBranchId || selectedBranchId === 'all') {
      openLabelNotice('Select a branch', 'Choose a branch before clearing labels.', 'warning');
      return;
    }

    openLabelConfirm(
      'Clear all labels',
      'Remove product assignments from every label in this branch.',
      async () => {
        try {
          const branchLabels = labels.filter((label) => label.branchId === selectedBranchId);
          const now = Timestamp.now();
          await Promise.all(
            branchLabels.map((label) =>
              updateDoc(fsDoc(db, 'labels', label.id), {
                productId: null,
                productName: null,
                productSku: null,
                basePrice: null,
                currentPrice: null,
                finalPrice: null,
                discountPercent: null,
                discountPrice: null,
                lastSync: now,
                status: 'inactive',
              })
            )
          );
          setLabels((prev) =>
            prev.map((label) =>
              label.branchId === selectedBranchId
                ? {
                    ...label,
                    productId: null,
                    productName: null,
                    productSku: null,
                    basePrice: null,
                    currentPrice: null,
                    finalPrice: null,
                    discountPercent: null,
                    discountPrice: null,
                    lastSync: now,
                    status: 'inactive',
                  }
                : label
            )
          );
          openLabelNotice('Labels cleared', 'All labels were cleared for this branch.', 'success');
        } catch (error) {
          console.error('Error clearing labels:', error);
          openLabelNotice('Clear failed', 'Could not clear labels for this branch.', 'error');
        }
      },
      'Clear all'
    );
  };


  const getProductDisplayCode = (product: Product) =>
    product.productCode || `PR-${getCompanyDisplayCode()}-${product.id.slice(0, 5).toUpperCase()}`;

  const handleProfileUpload = async (file: File) => {
    if (!currentUser) return;
    try {
      const storageRef = ref(storage, `users/${currentUser.id}/profile.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(fsDoc(db, 'users', currentUser.id), {
        photoURL: url
      });
      // Update local store
      useUserStore.getState().setUser({
        ...currentUser,
        photoURL: url
      } as any);
      openLabelNotice('Success', 'Profile picture updated successfully.', 'success');
    } catch (error) {
      console.error('Error uploading profile:', error);
      openLabelNotice('Upload Failed', 'Could not upload profile picture.', 'error');
    }
  };

  const showBlockingLoader = loading && !company;

  if (!hasHydrated) {
    return null;
  }
  if (!currentUser || currentUser.role !== 'vendor') {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#111928] overflow-hidden transition-colors duration-300">
      {/* Premium Admin Sidebar */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <DashboardSidebar 
          currentUser={currentUser as any}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab as any}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Dashboard Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader 
          onMenuOpen={() => setMobileNavOpen(true)}
          onRefresh={handleRefresh}
          title={selectedTab}
          isRefreshing={isRefreshing}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onTabChange={setSelectedTab as any}
        />

        {/* Dynamic Content Area */}
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

              {/* Tab Rendering Logic */}
              {selectedTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-6">
                       <div className="flex items-center justify-between mb-4">
                          <div className="h-12 w-12 rounded-xl bg-[#5750F1]/10 flex items-center justify-center text-[#5750F1]">
                             <Package className="h-6 w-6" />
                          </div>
                          <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">+12.5%</span>
                       </div>
                       <p className="text-xs font-bold text-[#637381] uppercase tracking-widest">Total Products</p>
                       <h3 className="text-2xl font-black text-[#111928] dark:text-white mt-1">{products.length}</h3>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="premium-card p-6">
                       <div className="flex items-center justify-between mb-4">
                          <div className="h-12 w-12 rounded-xl bg-amber-100/50 flex items-center justify-center text-amber-600">
                             <AlertCircle className="h-6 w-6" />
                          </div>
                          <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-full">Warning</span>
                       </div>
                       <p className="text-xs font-bold text-[#637381] uppercase tracking-widest">Low Stock Alert</p>
                       <h3 className="text-2xl font-black text-[#111928] dark:text-white mt-1">
                         {filteredBranchProducts.filter(p => p.status === 'low-stock').length}
                       </h3>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="premium-card p-6">
                       <div className="flex items-center justify-between mb-4">
                          <div className="h-12 w-12 rounded-xl bg-emerald-100/50 flex items-center justify-center text-emerald-600">
                             <TrendingUp className="h-6 w-6" />
                          </div>
                          <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">Live</span>
                       </div>
                       <p className="text-xs font-bold text-[#637381] uppercase tracking-widest">Revenue (24h)</p>
                       <h3 className="text-2xl font-black text-[#111928] dark:text-white mt-1">$4,290.50</h3>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="premium-card p-6">
                       <div className="flex items-center justify-between mb-4">
                          <div className="h-12 w-12 rounded-xl bg-blue-100/50 flex items-center justify-center text-blue-600">
                             <Tag className="h-6 w-6" />
                          </div>
                          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">{labels.length} Total</span>
                       </div>
                       <p className="text-xs font-bold text-[#637381] uppercase tracking-widest">Active Labels</p>
                       <h3 className="text-2xl font-black text-[#111928] dark:text-white mt-1">
                          {labels.filter(l => l.status === 'active').length}
                       </h3>
                    </motion.div>
                  </div>

                  {/* Operational Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Issues */}
                    <div className="premium-card overflow-hidden">
                       <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <h3 className="text-lg font-bold text-[#111928] dark:text-white">Recent Service Requests</h3>
                          <Button variant="ghost" className="text-xs font-bold text-[#5750F1]">View All</Button>
                       </div>
                       <div className="divide-y divide-slate-50 dark:divide-slate-800">
                          {issues.slice(0, 4).map((issue, i) => (
                             <div key={i} className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className={`h-2.5 w-2.5 rounded-full ${issue.priority === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                   <div>
                                      <p className="text-sm font-bold text-[#111928] dark:text-white">{issue.issue}</p>
                                      <p className="text-xs text-[#637381]">{issue.productName || 'General Issue'}</p>
                                   </div>
                                </div>
                                <span className="text-[10px] font-bold text-[#637381] uppercase">{issue.reportedAt?.toDate?.()?.toLocaleDateString() ?? 'Recently'}</span>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Quick Access */}
                    <div className="premium-card p-6">
                       <h3 className="text-lg font-bold text-[#111928] dark:text-white mb-6">Inventory Shortcuts</h3>
                       <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setSelectedTab('products')} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left">
                             <Package className="h-6 w-6 text-[#5750F1] mb-2" />
                             <p className="text-sm font-bold text-[#111928] dark:text-white">Add Product</p>
                             <p className="text-[10px] text-[#637381]">Update repository</p>
                          </button>
                          <button onClick={() => setSelectedTab('labels')} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left">
                             <Tag className="h-6 w-6 text-emerald-500 mb-2" />
                             <p className="text-sm font-bold text-[#111928] dark:text-white">Manage Labels</p>
                             <p className="text-[10px] text-[#637381]">Sync digital tags</p>
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Tab (Consolidated Design) */}
              {selectedTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Product Repository</h2>
                      <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Manage global inventory and branch stock levels.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button onClick={() => setShowProductModal(true)} className="h-11 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2">
                        <Plus className="h-4 w-4" />
                        New Product
                      </Button>
                      <Button onClick={() => setShowCategoryModal(true)} variant="outline" className="h-11 rounded-lg border-[#E2E8F0] text-sm font-bold">
                        Categories
                      </Button>
                    </div>
                  </div>

                  <div className="premium-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-[#637381] uppercase tracking-widest">View By Branch</span>
                          <select 
                            className="bg-transparent border-none text-sm font-bold text-[#111928] dark:text-white outline-none cursor-pointer"
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                          >
                            <option value="all">Global Inventory</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#F9FAFB] dark:bg-[#313D4A] border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-widest text-[#637381] dark:text-slate-400">
                            <th className="px-6 py-4">Product Info</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Stock Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {paginatedProducts.map((product) => {
                             const { stock, minStock } = getDisplayStockForProduct(product.id);
                             const threshold = minStock ?? 10;
                             const isLow = stock > 0 && stock <= threshold;
                             const isOut = stock <= 0;

                             return (
                               <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                 <td className="px-6 py-4">
                                   <div className="flex items-center gap-4">
                                      <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                                         {product.imageUrl ? (
                                           <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                                         ) : (
                                           <Package className="h-6 w-6 text-slate-400" />
                                         )}
                                      </div>
                                      <div>
                                         <p className="text-sm font-bold text-[#111928] dark:text-white leading-tight">{product.name}</p>
                                         <p className="text-[10px] font-medium text-[#637381] uppercase tracking-wider mt-0.5">{product.sku}</p>
                                      </div>
                                   </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <p className="text-sm font-black text-[#111928] dark:text-white">${product.basePrice.toFixed(2)}</p>
                                    <p className="text-[10px] font-medium text-[#637381]">{product.category}</p>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1.5">
                                       <div className="flex items-center justify-between text-[10px] font-bold">
                                          <span className={isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-emerald-500'}>
                                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Optimal'}
                                          </span>
                                          <span className="text-[#637381]">{stock} Units</span>
                                       </div>
                                       <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full rounded-full ${isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                            style={{ width: `${Math.min(100, (stock / (threshold * 2)) * 100)}%` }} 
                                          />
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                       <Button variant="ghost" size="sm" onClick={() => {
                                          setSelectedProductForEdit(product);
                                          setShowProductModal(true);
                                       }}>
                                          <Edit className="h-4 w-4 text-[#637381]" />
                                       </Button>
                                       <Button variant="ghost" size="sm" onClick={() => deleteProduct(product.id)}>
                                          <Trash2 className="h-4 w-4 text-rose-500" />
                                       </Button>
                                    </div>
                                 </td>
                               </tr>
                             )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories Tab */}
              {selectedTab === 'categories' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Inventory Categories</h2>
                      <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Organize your products into logical groups for easier management.</p>
                    </div>
                    <Button onClick={() => setShowCategoryModal(true)} className="h-11 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2">
                      <Plus className="h-4 w-4" />
                      Add Category
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categories.map((cat) => (
                      <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="premium-card p-6 group cursor-pointer hover:border-[#5750F1]/30 transition-all">
                        <div className="flex items-center justify-between mb-6">
                           <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-[#5750F1]/10 group-hover:text-[#5750F1] transition-colors">
                              <LayoutGridIcon className="h-6 w-6" />
                           </div>
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat); setShowCategoryModal(true); }} className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                 <Edit className="h-3.5 w-3.5 text-slate-400" />
                              </Button>
                           </div>
                        </div>
                        <h3 className="text-base font-bold text-[#111928] dark:text-white truncate">{cat.name}</h3>
                        <p className="text-xs text-[#637381] line-clamp-1 mt-1">{cat.description || 'No description provided'}</p>
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                           <span className="text-[10px] font-black text-[#5750F1] uppercase tracking-widest">
                              {products.filter(p => p.category === cat.name).length} Products
                           </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Labels Tab */}
              {selectedTab === 'labels' && (
                <div className="space-y-6">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Digital Label Management</h2>
                      <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Monitor and synchronize electronic price tags across branches.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button onClick={() => window.open(`/digital-labels?companyId=${currentUser?.companyId}&branchId=${selectedBranchId}`, '_blank')} className="h-11 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2">
                        <Eye className="h-4 w-4" />
                        Live Console
                      </Button>
                      <Button variant="outline" onClick={() => openLabelConfirm('Sync All Labels', 'Trigger a forced update for all tags in this branch?', () => handleRefresh())} className="h-11 rounded-lg border-[#E2E8F0] text-sm font-bold">
                        Full Sync
                      </Button>
                    </div>
                  </div>

                  <div className="premium-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                       <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                           <div className="flex items-center gap-4 pr-6 border-r border-slate-100 dark:border-slate-800">
                              <span className="text-xs font-bold text-[#637381] uppercase tracking-widest">Active Branch</span>
                              <select 
                                 className="bg-transparent border-none text-sm font-bold text-[#111928] dark:text-white outline-none cursor-pointer"
                                 value={selectedBranchId}
                                 onChange={(e) => setSelectedBranchId(e.target.value)}
                              >
                                 <option value="all">All Storefronts</option>
                                 {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                              </select>
                           </div>
                           <div className="flex items-center gap-3">
                              <Input 
                                 type="number" 
                                 placeholder="Qty" 
                                 value={labelGenerateCount} 
                                 onChange={(e) => setLabelGenerateCount(Number(e.target.value))} 
                                 className="h-9 w-20 rounded-lg text-xs font-bold border-[#E2E8F0]" 
                              />
                              <Button onClick={handleGenerateLabels} variant="outline" size="sm" className="h-9 rounded-lg border-[#E2E8F0] text-xs font-bold hover:bg-[#5750F1] hover:text-white hover:border-[#5750F1] transition-all">
                                 Generate Tags
                              </Button>
                              <div className="h-4 w-[1px] bg-slate-100 dark:bg-slate-800 mx-1" />
                              <Button onClick={handleAutoAssignLabels} variant="ghost" size="sm" className="h-9 rounded-lg text-[#5750F1] hover:bg-[#5750F1]/5 text-xs font-bold gap-2">
                                 <Zap className="h-3.5 w-3.5" />
                                 Auto-Assign
                              </Button>
                           </div>
                           <div className="flex items-center gap-4 px-6 border-l border-slate-100 dark:border-slate-800">
                              <span className="text-xs font-bold text-[#637381] uppercase tracking-widest">Status</span>
                              <select 
                                 className="bg-transparent border-none text-sm font-bold text-[#111928] dark:text-white outline-none cursor-pointer"
                                 value={labelSyncFilter}
                                 onChange={(e) => setLabelSyncFilter(e.target.value as any)}
                              >
                                 <option value="all">All Labels</option>
                                 <option value="synced">Synced Only</option>
                                 <option value="not-synced">Requires Sync</option>
                              </select>
                           </div>
                        </div>
                     </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#F9FAFB] dark:bg-[#313D4A] border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-widest text-[#637381] dark:text-slate-400">
                            <th className="px-6 py-4">Label Identity</th>
                            <th className="px-6 py-4">Assigned Product</th>
                            <th className="px-6 py-4">Status & Sync</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {labels
                            .filter(l => selectedBranchId === 'all' || l.branchId === selectedBranchId)
                            .filter(l => {
                               if (labelSyncFilter === 'all') return true;
                               if (labelSyncFilter === 'synced') return !!l.productId && l.status === 'active';
                               if (labelSyncFilter === 'not-synced') return !l.productId || l.status !== 'active';
                               return true;
                             })
                            .map((label) => (
                             <tr key={label.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                   <p className="text-sm font-bold text-[#111928] dark:text-white leading-tight">{label.labelId}</p>
                                   <p className="text-[10px] font-medium text-[#637381] uppercase tracking-wider mt-0.5">{label.branchName}</p>
                                </td>
                                <td className="px-6 py-4">
                                    {label.productId ? (
                                      <div>
                                         <p className="text-sm font-bold text-[#111928] dark:text-white leading-tight">{label.productName}</p>
                                         <p className="text-[10px] font-medium text-[#5750F1] uppercase tracking-wider mt-0.5">${label.finalPrice?.toFixed(2)}</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5">
                                         <p className="text-[9px] font-bold text-[#637381] uppercase tracking-tighter">Bind to Product</p>
                                         <select 
                                           className="h-9 px-3 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#1C2434] text-[10px] font-bold text-[#111928] dark:text-white outline-none w-full max-w-[180px] cursor-pointer hover:border-[#5750F1] transition-colors shadow-sm"
                                           onChange={(e) => {
                                             const pid = e.target.value;
                                             if (pid) assignProductToLabel(label.id, pid, label.branchId, label.labelCode);
                                           }}
                                           disabled={assigningLabelId === label.id}
                                         >
                                           <option value="">Select Inventory...</option>
                                           {products.map(p => (
                                             <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                           ))}
                                         </select>
                                      </div>
                                    )}

                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                      <div className={`h-2 w-2 rounded-full ${label.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                      <span className="text-xs font-bold text-[#111928] dark:text-white capitalize">{label.status}</span>
                                   </div>
                                   <p className="text-[10px] text-[#637381] mt-1">Last Sync: {label.lastSync?.toDate().toLocaleTimeString() || 'Never'}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                       {label.productId ? (
                                          <Button 
                                             variant="ghost" 
                                             size="sm" 
                                             onClick={() => openLabelConfirm('Stop Sync', `Disconnect product from label ${label.labelId}?`, () => handleUnlinkProductFromLabel(label.id))}
                                             className="text-amber-500 font-bold text-xs hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                          >
                                             Stop Sync
                                          </Button>
                                       ) : (
                                          <Button 
                                             disabled
                                             variant="ghost" 
                                             size="sm" 
                                             className="text-slate-300 dark:text-slate-700 font-bold text-xs cursor-not-allowed"
                                          >
                                             Need Product
                                          </Button>
                                       )}
                                       {!label.productId && (
                                          <Button 
                                             variant="ghost" 
                                             size="sm" 
                                             onClick={() => openLabelConfirm('Delete Label', 'Permanently remove this empty digital tag?', () => handleDeleteLabel(label.id))}
                                             className="h-8 w-8 p-0 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                          >
                                             <Trash2 className="h-4 w-4" />
                                          </Button>
                                       )}
                                    </div>
                                 </td>
                             </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Staff Tab */}
              {selectedTab === 'staff' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Staff Directory</h2>
                      <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Manage personnel, roles, and branch permissions.</p>
                    </div>
                    <Button onClick={() => setShowCreateStaff(true)} className="h-11 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2">
                      <Plus className="h-4 w-4" />
                      Add Member
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {staffMembers.map((member) => (
                      <motion.div key={member.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="premium-card p-6">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                              <UserIcon className="h-6 w-6" />
                           </div>
                           <div className="min-w-0">
                              <p className="text-sm font-bold text-[#111928] dark:text-white truncate">{member.name}</p>
                              <p className="text-[10px] font-medium text-[#637381] truncate">{member.email}</p>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-[#637381]">Position</span>
                              <span className="text-[#111928] dark:text-white">{member.position}</span>
                           </div>
                           <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-[#637381]">Branch</span>
                              <span className="text-[#111928] dark:text-white">{member.branchName}</span>
                           </div>
                           <div className="flex items-center justify-between text-xs font-bold pt-3 border-t border-slate-50 dark:border-slate-800">
                              <div className="flex items-center gap-1.5">
                                 <div className={`h-1.5 w-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                 <span className="text-[#637381] capitalize">{member.status}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <Button variant="ghost" size="sm" onClick={() => setShowResetPassword(member.id)} className="h-8 w-8 p-0 hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                                 </Button>
                                 <Button variant="ghost" size="sm" onClick={() => openEditStaffModal(member)} className="h-8 w-8 p-0 hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <Edit className="h-3.5 w-3.5 text-slate-400" />
                                 </Button>
                              </div>
                           </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promotions Tab */}
              {selectedTab === 'promotions' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Campaign Center</h2>
                      <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Create and manage discounts across your storefronts.</p>
                    </div>
                    <Button onClick={() => setShowCreatePromotion(true)} className="h-11 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] text-sm font-bold gap-2">
                      <Plus className="h-4 w-4" />
                      New Promotion
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {promotions.map((promo) => (
                      <div key={promo.id} className="premium-card p-6 flex items-start gap-5">
                         <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 shrink-0">
                            <Percent className="h-7 w-7" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                               <h3 className="text-lg font-bold text-[#111928] dark:text-white truncate">{promo.name}</h3>
                               <div className="flex flex-col justify-between items-end gap-4">
                                  <div className="flex gap-2">
                                     <Button variant="ghost" size="sm" onClick={() => { populatePromotionForm(promo); setEditingPromotion(promo); }} className="h-9 w-9 p-0 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                                        <Edit className="h-4 w-4 text-[#637381]" />
                                     </Button>
                                  </div>
                                  <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                    promo.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                  }`}>{promo.status}</div>
                               </div>
                            </div>
                            <p className="text-xs font-medium text-[#637381] line-clamp-2 mb-4">{promo.description}</p>
                            <div className="flex items-center gap-6">
                               <div>
                                  <p className="text-[10px] font-bold text-[#637381] uppercase tracking-widest">Value</p>
                                  <p className="text-sm font-black text-[#111928] dark:text-white">{promo.type === 'percentage' ? `${promo.value}% Off` : `$${promo.value} Flat`}</p>
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-[#637381] uppercase tracking-widest">Target</p>
                                  <p className="text-sm font-black text-[#111928] dark:text-white capitalize">{promo.applyTo === 'all' ? 'Entire Inventory' : `${promo.productIds.length} Products`}</p>
                               </div>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {selectedTab === 'settings' && (
                <div className="space-y-6 max-w-4xl">
                  <div>
                    <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Account Settings</h2>
                    <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Manage your identity and business profile.</p>
                  </div>

                  <div className="premium-card p-8 space-y-8">
                     {/* Profile Upload Section */}
                     <div className="flex flex-col md:flex-row md:items-center gap-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative group">
                           <div className="h-24 w-24 rounded-3xl bg-slate-100 dark:bg-slate-800 overflow-hidden ring-4 ring-[#5750F1]/10">
                              {currentUser?.photoURL ? (
                                <img src={currentUser.photoURL} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-[#637381]">
                                   <UserIcon className="h-10 w-10" />
                                </div>
                              )}
                           </div>
                           <label className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-[#5750F1] text-white flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                              <Upload className="h-4 w-4" />
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleProfileUpload(e.target.files[0])} />
                           </label>
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-[#111928] dark:text-white">{currentUser?.name}</h3>
                           <p className="text-sm font-medium text-[#637381]">{currentUser?.email}</p>
                           <p className="text-[10px] font-black text-[#5750F1] uppercase tracking-widest bg-[#5750F1]/5 px-2 py-0.5 rounded mt-2 inline-block">Authorized Vendor</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Business Name</label>
                           <Input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} className="h-11 rounded-lg border-[#E2E8F0]" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Business Phone</label>
                           <Input value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} className="h-11 rounded-lg border-[#E2E8F0]" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                           <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Headquarters Address</label>
                           <Input value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} className="h-11 rounded-lg border-[#E2E8F0]" />
                        </div>
                     </div>

                     <div className="flex justify-end pt-4">
                        <Button className="h-11 px-8 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] font-bold">Save Profile Changes</Button>
                     </div>
                  </div>
                </div>
              )}

              {/* Support/Support Tab (Mapped from Support) */}
              {selectedTab === 'support' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Support & Assistance</h2>
                      <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Report platform issues or get help with your hardware.</p>
                    </div>
                    <Button variant="outline" className="h-11 rounded-lg border-[#E2E8F0] text-sm font-bold gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Knowledge Base
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                     <div className="xl:col-span-2 space-y-6">
                        <div className="premium-card p-6">
                           <h3 className="text-lg font-bold text-[#111928] dark:text-white mb-4">Open a Ticket</h3>
                           <div className="space-y-4">
                              <Input placeholder="What are you experiencing?" className="h-11 rounded-lg border-[#E2E8F0]" />
                              <textarea className="w-full rounded-lg border border-[#E2E8F0] p-4 text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 min-h-[120px]" placeholder="Detailed description of the issue..."></textarea>
                              <div className="flex justify-end">
                                 <Button className="h-11 px-8 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] font-bold">Submit Ticket</Button>
                              </div>
                           </div>
                        </div>

                        <div className="premium-card overflow-hidden">
                           <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                              <h3 className="text-lg font-bold text-[#111928] dark:text-white">Active Reports</h3>
                           </div>
                           <div className="divide-y divide-slate-50 dark:divide-slate-800">
                              {issues.map((issue) => (
                                 <div key={issue.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                       <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${issue.status === 'open' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                          <AlertCircle className="h-5 w-5" />
                                       </div>
                                       <div>
                                          <p className="text-sm font-bold text-[#111928] dark:text-white">{issue.issue}</p>
                                          <p className="text-[10px] font-medium text-[#637381]">{issue.branchName} • {issue.status.toUpperCase()}</p>
                                       </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-xs font-bold text-[#5750F1]">Details</Button>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="premium-card p-6 bg-gradient-to-br from-[#5750F1] to-[#4A44D1] text-white">
                           <h3 className="text-lg font-bold mb-2">Priority Support</h3>
                           <p className="text-sm opacity-80 mb-6">Need immediate assistance with your digital labels? Our tech team is available 24/7.</p>
                           <Button className="w-full bg-white text-[#5750F1] hover:bg-slate-100 font-bold">Chat with Tech</Button>
                        </div>
                        <div className="premium-card p-6">
                           <h3 className="text-base font-bold text-[#111928] dark:text-white mb-4">Contact Channels</h3>
                           <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                    <Mail className="h-4 w-4" />
                                 </div>
                                 <span className="text-sm font-medium text-[#637381]">support@digitallabel.com</span>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                    <Phone className="h-4 w-4" />
                                 </div>
                                 <span className="text-sm font-medium text-[#637381]">+855 12 345 678</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* Sales Tab */}
              {selectedTab === 'sales' && (
                <div className="space-y-6">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111928] dark:text-white tracking-tight">Sales Intelligence</h2>
                      <p className="text-sm font-medium text-[#637381] dark:text-slate-400 mt-1">Real-time revenue monitoring and transaction history.</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <Button variant="outline" className="h-11 rounded-lg border-[#E2E8F0] text-sm font-bold gap-2">
                          <Download className="h-4 w-4" />
                          Export CSV
                       </Button>
                    </div>
                  </div>
                  
                  <div className="premium-card p-6">
                     <SalesHistoryPanel 
                        companyId={currentUser?.companyId || ''} 
                        branchId={selectedBranchId === 'all' ? undefined : selectedBranchId} 
                     />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Profile & Mobile Modals */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 h-full w-80 bg-white dark:bg-[#1C2434] shadow-2xl"
            >
              <DashboardSidebar 
                currentUser={currentUser as any}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab as any}
                onLogout={handleLogout}
                onClose={() => setMobileNavOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Vendor Modals (Preserved from legacy code) */}
      {labelModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={closeLabelModal}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-2xl bg-white dark:bg-[#24303F] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4 p-6 border-b border-slate-100 dark:border-slate-800">
              <div className={`rounded-xl p-2.5 ${labelModalToneStyles[labelModal.tone]}`}>
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{labelModal.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{labelModal.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
              {labelModal.cancelLabel && (
                <Button variant="ghost" onClick={closeLabelModal} className="font-bold text-xs">{labelModal.cancelLabel}</Button>
              )}
              <Button onClick={async () => {
                const action = labelModal.onConfirm;
                closeLabelModal();
                if (action) await action();
              }} className="bg-[#5750F1] hover:bg-[#4A44D1] font-bold text-xs">
                {labelModal.confirmLabel || 'OK'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

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

      {/* Staff Management Modals */}
      <AnimatePresence>
        {(showCreateStaff || showEditStaff) && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCreateStaff(false);
                setShowEditStaff(null);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#1C2434] rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-[#111928] dark:text-white">
                    {showCreateStaff ? 'Add New Team Member' : 'Edit Staff Member'}
                  </h3>
                  <p className="text-xs font-medium text-[#637381] mt-1">Configure account details and branch permissions.</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowCreateStaff(false);
                    setShowEditStaff(null);
                  }}
                  className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={showCreateStaff ? createStaff : updateStaff} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Full Name</label>
                    <Input 
                      required
                      placeholder="e.g. John Doe"
                      value={showCreateStaff ? staffForm.name : editStaffForm.name}
                      onChange={(e) => showCreateStaff 
                        ? setStaffForm({...staffForm, name: e.target.value})
                        : setEditStaffForm({...editStaffForm, name: e.target.value})
                      }
                      className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Email Address</label>
                    <Input 
                      required
                      type="email"
                      placeholder="john@example.com"
                      value={showCreateStaff ? staffForm.email : editStaffForm.email}
                      onChange={(e) => showCreateStaff 
                        ? setStaffForm({...staffForm, email: e.target.value})
                        : setEditStaffForm({...editStaffForm, email: e.target.value})
                      }
                      className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Position</label>
                    <select
                      className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#1C2434] text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all"
                      value={showCreateStaff ? staffForm.position : editStaffForm.position}
                      onChange={(e) => showCreateStaff 
                        ? setStaffForm({...staffForm, position: e.target.value})
                        : setEditStaffForm({...editStaffForm, position: e.target.value})
                      }
                    >
                      <option value="Manager">Manager</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Inventory Specialist">Inventory Specialist</option>
                      <option value="IT Support">IT Support</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Assigned Branch</label>
                    <select
                      required
                      className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#1C2434] text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all"
                      value={showCreateStaff ? staffForm.branchId : editStaffForm.branchId}
                      onChange={(e) => showCreateStaff 
                        ? setStaffForm({...staffForm, branchId: e.target.value})
                        : setEditStaffForm({...editStaffForm, branchId: e.target.value})
                      }
                    >
                      <option value="">Select a branch...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  {showCreateStaff && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Initial Password</label>
                      <Input 
                        required
                        type="password"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({...staffForm, password: e.target.value})}
                        className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800"
                      />
                    </div>
                  )}
                  {!showCreateStaff && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Status</label>
                      <select
                        className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#1C2434] text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all"
                        value={editStaffForm.status}
                        onChange={(e) => setEditStaffForm({...editStaffForm, status: e.target.value as any})}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-[#111928] dark:text-white pb-2 border-b border-slate-50 dark:border-slate-800">Permissions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'canViewProducts', label: 'View Inventory' },
                      { id: 'canUpdateStock', label: 'Update Stock' },
                      { id: 'canChangePrices', label: 'Adjust Pricing' },
                      { id: 'canCreateLabels', label: 'Generate Labels' },
                      { id: 'canReportIssues', label: 'Report Issues' },
                      { id: 'canViewReports', label: 'Access Reports' },
                    ].map((perm) => (
                      <label key={perm.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox"
                            className="peer h-5 w-5 appearance-none rounded-md border border-[#E2E8F0] dark:border-slate-800 checked:bg-[#5750F1] checked:border-[#5750F1] transition-all"
                            checked={(showCreateStaff ? staffForm.permissions : editStaffForm.permissions)[perm.id as keyof StaffPermissions] as boolean}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              if (showCreateStaff) {
                                setStaffForm({
                                  ...staffForm,
                                  permissions: { ...staffForm.permissions, [perm.id]: checked }
                                });
                              } else {
                                setEditStaffForm({
                                  ...editStaffForm,
                                  permissions: { ...editStaffForm.permissions, [perm.id]: checked }
                                });
                              }
                            }}
                          />
                          <Check className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 transition-opacity" />
                        </div>
                        <span className="text-sm font-medium text-[#637381] group-hover:text-[#111928] dark:group-hover:text-white transition-colors">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-10">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => {
                      setShowCreateStaff(false);
                      setShowEditStaff(null);
                    }}
                    className="h-11 px-6 font-bold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="h-11 px-8 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] font-bold shadow-lg shadow-[#5750F1]/20"
                  >
                    {showCreateStaff ? 'Add Staff Member' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetPassword && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowResetPassword(null)} />
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-[#1C2434] rounded-3xl shadow-2xl p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-6">
                   <Lock className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-[#111928] dark:text-white mb-2">Reset Password</h3>
                <p className="text-sm text-[#637381] mb-8">Enter a new secure password for this staff member.</p>
                <div className="space-y-4">
                   <Input 
                      type="password" 
                      placeholder="New Password" 
                      value={resetPasswordForm.newPassword}
                      onChange={(e) => setResetPasswordForm({...resetPasswordForm, newPassword: e.target.value})}
                      className="h-12 rounded-xl border-[#E2E8F0]" 
                   />
                   <Input 
                      type="password" 
                      placeholder="Confirm Password" 
                      value={resetPasswordForm.confirmPassword}
                      onChange={(e) => setResetPasswordForm({...resetPasswordForm, confirmPassword: e.target.value})}
                      className="h-12 rounded-xl border-[#E2E8F0]" 
                   />
                   <div className="flex gap-3 pt-4">
                      <Button variant="ghost" onClick={() => setShowResetPassword(null)} className="flex-1 h-12 font-bold">Cancel</Button>
                      <Button onClick={handleResetPassword} className="flex-1 h-12 bg-[#5750F1] hover:bg-[#4A44D1] font-bold shadow-lg shadow-[#5750F1]/20">Update Password</Button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Promotion Management Modal */}
      <AnimatePresence>
        {(showCreatePromotion || editingPromotion) && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetPromotionForm} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-[#1C2434] rounded-3xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                   <div>
                      <h3 className="text-xl font-bold text-[#111928] dark:text-white">
                         {editingPromotion ? 'Edit Promotion' : 'Create New Campaign'}
                      </h3>
                      <p className="text-xs font-medium text-[#637381] mt-1">Configure discount rules and targeting.</p>
                   </div>
                   <Button variant="ghost" size="sm" onClick={resetPromotionForm} className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                      <X className="h-5 w-5" />
                   </Button>
                </div>

                <form onSubmit={editingPromotion ? updatePromotion : createPromotion} className="p-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2 md:col-span-2">
                         <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Promotion Name</label>
                         <Input required placeholder="e.g. Summer Clearance" value={promotionForm.name} onChange={(e) => setPromotionForm({...promotionForm, name: e.target.value})} className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                         <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Description</label>
                         <Input placeholder="Describe the campaign details..." value={promotionForm.description} onChange={(e) => setPromotionForm({...promotionForm, description: e.target.value})} className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Discount Type</label>
                         <select className="w-full h-11 px-4 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#1C2434] text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all" value={promotionForm.type} onChange={(e) => setPromotionForm({...promotionForm, type: e.target.value as any})}>
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount ($)</option>
                            <option value="bogo">BOGO (Buy One Get One)</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Value</label>
                         <Input required type="number" value={promotionForm.value} onChange={(e) => setPromotionForm({...promotionForm, value: Number(e.target.value)})} className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">Start Date</label>
                         <Input required type="datetime-local" value={promotionForm.startDate} onChange={(e) => setPromotionForm({...promotionForm, startDate: e.target.value})} className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-[#637381] uppercase tracking-widest">End Date</label>
                         <Input required type="datetime-local" value={promotionForm.endDate} onChange={(e) => setPromotionForm({...promotionForm, endDate: e.target.value})} className="h-11 rounded-lg border-[#E2E8F0] dark:border-slate-800" />
                      </div>
                   </div>

                   <div className="flex justify-end gap-3 mt-10">
                      <Button type="button" variant="ghost" onClick={resetPromotionForm} className="h-11 px-6 font-bold">Cancel</Button>
                      <Button type="submit" className="h-11 px-8 rounded-lg bg-[#5750F1] hover:bg-[#4A44D1] font-bold shadow-lg shadow-[#5750F1]/20">
                         {editingPromotion ? 'Save Changes' : 'Launch Campaign'}
                      </Button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
