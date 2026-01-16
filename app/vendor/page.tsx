'use client';

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/user-store';
import { applyDiscountToLabel, clearDiscountFromLabel } from '@/lib/label-discount';
import { auth, db, logOut, secondaryAuth } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import CategoryModal from '@/components/modals/CategoryModal';
import ProductModal from '@/components/modals/ProductModal';
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
  List
} from 'lucide-react';
import { generateLabelsForBranch } from '@/lib/supermarket-setup';
import { makeProductCodeForVendor, makeSku, nextBranchSequence, nextCompanySequence } from '@/lib/id-generator';

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
  
  // States
  const [selectedTab, setSelectedTab] = useState<
    'dashboard' | 'products' | 'staff' | 'labels' | 'promotions' | 'reports' | 'settings'
  >('dashboard');
  const [loading, setLoading] = useState(true);
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
      value: 10,
      applyTo: 'all',
      selectedProducts: [],
      selectedBranches: [],
      startDate: '',
      endDate: ''
    });
    setEditingPromotion(null);
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
      alert('Please select a branch');
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

      // Refresh data
      await reloadProducts();
      await reloadBranchProducts();
      
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

      alert(`Staff "${staffForm.name}" created successfully!`);

    } catch (error: any) {
      console.error('Error creating staff:', error);
      alert(`Error: ${error.message}`);
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

      // Refresh data
      await reloadProducts();
      await reloadBranchProducts();
      alert('Price updated successfully!');

    } catch (error) {
      console.error('Error updating price:', error);
      alert('Error updating price');
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
        .map((label) => label.productId)
        .filter(Boolean) as string[]
    );
    const availableProducts = branchProductsList.filter(
      (product) => !usedProductIds.has(product.id)
    );

    if (availableProducts.length === 0) {
      openLabelNotice('No available products', 'All products are already assigned.', 'info');
      return;
    }

    const assignments = unassignedLabels.slice(0, availableProducts.length).map(
      (label, index) => ({
        label,
        product: availableProducts[index],
      })
    );

    try {
      const now = Timestamp.now();
      await Promise.all(
        assignments.map(({ label, product }) => {
          const basePrice = getBranchPriceForProduct(product.id, selectedBranchId);

          return updateDoc(fsDoc(db, 'labels', label.id), {
            labelId: label.labelId ?? label.labelCode ?? label.id,
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            basePrice,
            currentPrice: basePrice,
            finalPrice: basePrice,
            lastSync: now,
            status: 'syncing',
          });
        })
      );

      setLabels((prev) =>
        prev.map((label) => {
          const assignment = assignments.find((item) => item.label.id === label.id);
          if (!assignment) return label;
          const basePrice = getBranchPriceForProduct(assignment.product.id, selectedBranchId);
          return {
            ...label,
            labelId: label.labelId ?? label.labelCode ?? label.id,
            productId: assignment.product.id,
            productName: assignment.product.name,
            productSku: assignment.product.sku,
            basePrice,
            currentPrice: basePrice,
            finalPrice: basePrice,
            lastSync: now,
            status: 'syncing',
          };
        })
      );
      openLabelNotice(
        'Auto-assign complete',
        `Assigned ${assignments.length} products to labels.`,
        'success'
      );
    } catch (error) {
      console.error('Error auto-assigning labels:', error);
      openLabelNotice('Auto-assign failed', 'Could not assign products.', 'error');
    }
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
          alert('Product code already exists for this branch.');
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
          alert('SKU already exists for this branch.');
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
          alert('Product code already exists for this vendor.');
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
          alert('SKU already exists for this vendor.');
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

    // Refresh data
    await reloadProducts();
    await reloadBranchProducts();
    alert(`Product "${productData.name}" updated successfully!`);

  } catch (error: any) {
    console.error('Error updating product:', error);
    alert(`Error: ${error.message}`);
  }
};

// Handle edit product form submission
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditProduct?.id || !currentUser?.companyId) return;

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
          alert('Product code already exists for this branch.');
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
          alert('SKU already exists for this branch.');
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
          alert('Product code already exists for this vendor.');
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
          alert('SKU already exists for this vendor.');
          return;
        }
      }
    }

    const payload = {
      name: showEditProduct.name,
      description: showEditProduct.description,
      sku: showEditProduct.sku,
      productCode: showEditProduct.productCode,
      category: showEditProduct.category,
      basePrice: showEditProduct.basePrice,
      imageUrl: showEditProduct.imageUrl,
      updatedAt: Timestamp.now()
    };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });
    await updateDoc(fsDoc(db, 'products', showEditProduct.id), payload);

    if (showEditProduct.stock != null || showEditProduct.minStock != null) {
      const stockValue = Number(showEditProduct.stock ?? 0);
      const minStockValue = Number(showEditProduct.minStock ?? 10);
      const status =
        stockValue <= 0
          ? 'out-of-stock'
          : stockValue <= minStockValue
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
          bpSnap.docs.map((docSnap) =>
            updateDoc(fsDoc(db, 'branch_products', docSnap.id), {
              stock: stockValue,
              minStock: minStockValue,
              status,
              lastUpdated: Timestamp.now()
            })
          )
        );
      }
    }

    // If price changed, update branch products
    if (showEditProduct.basePrice) {
      await updateProductPrice(showEditProduct.id, showEditProduct.basePrice);
    }

    // Refresh data
    await reloadProducts();
    await reloadBranchProducts();
    setShowEditProduct(null);
    alert(`Product "${showEditProduct.name}" updated successfully!`);

  } catch (error: any) {
    console.error('Error updating product:', error);
    alert(`Error: ${error.message}`);
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
      minStock: first?.minStock ?? 10,
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
    { id: 'reports', label: 'Reports', icon: BarChart3 },
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


  const openDigitalLabelsScreen = () => {
    if (!currentUser?.companyId) return;
    if (!selectedBranchId || selectedBranchId === 'all') {
      openLabelNotice('Select a branch', 'Choose a branch before opening labels.', 'warning');
      return;
    }
    window.open(
      `/digital-labels?companyId=${currentUser.companyId}&branchId=${selectedBranchId}`,
      '_blank'
    );
  };

  const getProductDisplayCode = (product: Product) =>
    product.productCode || `PR-${getCompanyDisplayCode()}-${product.id.slice(0, 5).toUpperCase()}`;

  const showBlockingLoader = loading && !company;

  if (!hasHydrated) {
    return null;
  }
  if (!currentUser || currentUser.role !== 'vendor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{company?.name || 'My Company'}</p>
                  <p className="text-xs text-gray-400">{getCompanyDisplayCode()}</p>
                </div>
              </div>
              <button
                type="button"
                className="p-2 rounded-md hover:bg-gray-700"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pt-4">
                <div className="rounded-lg border border-gray-700 bg-gray-800/70 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-300">
                    Branch
                  </div>
                  <button
                    type="button"
                    className="mt-2 flex w-full items-center justify-between rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                    onClick={() => setShowBranchPicker(true)}
                    disabled={branches.length === 0}
                  >
                    <span className="truncate">
                      {selectedBranchName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedTab(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        selectedTab === item.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-900 hover:text-red-100"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar */}

      <div className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen fixed left-0 top-0">
        {/* Logo & Company Info */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{company?.name || 'My Company'}</h1>
              <p className="text-xs text-gray-400">{getCompanyDisplayCode()}</p>
              <p className="text-xs text-gray-400">Vendor Dashboard</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="font-medium">{currentUser.name?.charAt(0) || 'V'}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{currentUser.name}</p>
              <p className="text-xs text-gray-400">Company Owner</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
            </div>
            <button className="p-1 hover:bg-gray-700 rounded relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  selectedTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <div className="text-xs text-gray-400 px-2">
            {branches.length} branches • {products.length} products
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-900 hover:text-red-100"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 text-gray-900">
        {/* Top Bar */}
        <header className="bg-white/95 backdrop-blur border-b sticky top-0 z-30">
          <div className="px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full items-start gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="inline-flex lg:hidden items-center justify-center rounded-lg border border-gray-200 bg-white h-10 w-10"
                >
                  <List className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 capitalize leading-tight break-words">
                    {selectedTab === 'dashboard' && `${company?.name || 'My'} Dashboard`}
                    {selectedTab === 'products' && 'Product Management'}
                    {selectedTab === 'staff' && 'Staff Management'}
                    {selectedTab === 'labels' && 'Digital Labels'}
                    {selectedTab === 'promotions' && 'Promotions & Discounts'}
                    {selectedTab === 'reports' && 'Business Reports'}
                    {selectedTab === 'settings' && 'Settings'}
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedTab === 'dashboard' && 'Overview of your retail operations'}
                    {selectedTab === 'products' && (isBranchFiltered
                      ? `Manage ${visibleProducts.length} products for ${selectedBranchName}`
                      : `Manage ${products.length} products across ${branches.length} branches`)}
                    {selectedTab === 'staff' && `Manage ${filteredStaffMembers.length} staff members for ${selectedBranchName}`}
                    {selectedTab === 'labels' && `Monitor ${filteredLabels.length} digital price labels for ${selectedBranchName}`}
                    {selectedTab === 'promotions' && `Create and manage ${promotions.length} promotions`}
                    {selectedTab === 'reports' && 'View business analytics and reports'}
                    {selectedTab === 'settings' && 'Manage your company profile and preferences'}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 lg:w-auto">
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <div className="relative w-full min-w-[260px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-10 w-full rounded-full border border-gray-200 bg-white pl-10"
                    />
                  </div>
                  <select
                    className="hidden h-10 w-full max-w-[200px] flex-none rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-900 shadow-sm sm:block"
                    value={selectedBranchId}
                    onChange={(event) => setSelectedBranchId(event.target.value)}
                    disabled={branches.length === 0}
                  >
                    {branches.length === 0 ? (
                      <option value="">No branches</option>
                    ) : (
                      <>
                        <option value="all">All branches</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-full flex-none rounded-full px-4 sm:w-auto"
                    onClick={loadVendorData}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {showBlockingLoader && (
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              Loading data...
            </div>
          )}
          {/* Dashboard Tab */}
          {selectedTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl border p-4 sm:p-6 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">Total Products</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-2">{products.length}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {filteredBranchProducts.filter(p => p.status === 'low-stock').length} low stock
                      </p>
                    </div>
                    <Package className="h-10 w-10 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-4 sm:p-6 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">Active Staff</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-2">
                        {filteredStaffMembers.filter(s => s.status === 'active').length}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedBranchName}
                      </p>
                    </div>
                    <Users className="h-10 w-10 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-4 sm:p-6 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">Active Labels</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-2">
                        {filteredLabels.filter(l => l.status === 'active').length}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {filteredLabels.filter(l => l.status === 'low-battery').length} low battery
                      </p>
                    </div>
                    <Tag className="h-10 w-10 text-purple-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-4 sm:p-6 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">Active Promotions</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-2">
                        {promotions.filter(p => p.status === 'active').length}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        {promotions.filter(p => p.status === 'upcoming').length} upcoming
                      </p>
                    </div>
                    <PercentIcon className="h-10 w-10 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setShowCreateProduct(true)}
                    className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors group"
                  >
                    <PackagePlus className="h-6 w-6 mx-auto mb-2 text-blue-500 group-hover:scale-110" />
                    <span className="text-sm font-medium">Add Product</span>
                  </button>
                  <button 
                    onClick={() => setSelectedTab('staff')}
                    className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors group"
                  >
                    <Users className="h-6 w-6 mx-auto mb-2 text-green-500 group-hover:scale-110" />
                    <span className="text-sm font-medium">Add Staff</span>
                  </button>
                  <button 
                    onClick={() => setShowCreatePromotion(true)}
                    className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors group"
                  >
                    <Percent className="h-6 w-6 mx-auto mb-2 text-purple-500 group-hover:scale-110" />
                    <span className="text-sm font-medium">Create Promotion</span>
                  </button>
                  <button 
                    onClick={() => setShowCreateBranch(true)}
                    className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors group"
                  >
                    <Building2 className="h-6 w-6 mx-auto mb-2 text-orange-500 group-hover:scale-110" />
                    <span className="text-sm font-medium">Add Branch</span>
                  </button>
                </div>
              </div>

              {/* Recent Products */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Recent Products</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedTab('products')}
                  >
                    View All Products
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Product</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">SKU</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Base Price</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {searchedProducts.slice(0, 5).map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-blue-600" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>
                                <p className="text-xs text-gray-400">Code: {getProductDisplayCode(product)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {product.sku}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold">${product.basePrice.toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const branchStock = getDisplayStockForProduct(product.id);
                                  setShowEditProduct({
                                    ...product,
                                    stock: branchStock.stock,
                                    minStock: branchStock.minStock
                                  });
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => deleteProduct(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

          {/* Settings Tab */}
          {selectedTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Company Profile</h3>
                    <p className="text-sm text-gray-600">Update your business information.</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowEditCompany(true)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Company
                  </Button>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <p className="text-xs uppercase text-gray-500">Company Name</p>
                    <p className="mt-2 font-medium text-gray-900">{company?.name || '--'}</p>
                  </div>
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <p className="text-xs uppercase text-gray-500">Code</p>
                    <p className="mt-2 font-medium text-gray-900">{getCompanyDisplayCode()}</p>
                  </div>
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <p className="text-xs uppercase text-gray-500">Email</p>
                    <p className="mt-2 font-medium text-gray-900">{company?.email || '--'}</p>
                  </div>
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <p className="text-xs uppercase text-gray-500">Phone</p>
                    <p className="mt-2 font-medium text-gray-900">{company?.phone || '--'}</p>
                  </div>
                  <div className="rounded-lg border bg-gray-50 p-4 md:col-span-2">
                    <p className="text-xs uppercase text-gray-500">Address</p>
                    <p className="mt-2 font-medium text-gray-900">{company?.address || '--'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Branch Management</h3>
                    <p className="text-sm text-gray-600">Edit or remove branch information.</p>
                  </div>
                  <Button onClick={() => setShowCreateBranch(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Branch
                  </Button>
                </div>

                {branches.length === 0 ? (
                  <div className="mt-6 rounded-lg border border-dashed p-4 text-sm text-gray-600">
                    No branches yet. Click "Add Branch" to create one.
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {branches.map((branch) => (
                      <div key={branch.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-gray-50 p-4">
                        <div>
                          <div className="font-medium text-gray-900">{branch.name}</div>
                          <div className="text-xs text-gray-500">{branch.address}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBranchId(branch.id);
                              setShowEditBranch(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 hover:text-rose-700"
                            onClick={() => deleteBranch(branch.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Tab */}
          {selectedTab === 'products' && (
            <div className="space-y-6">
              {/* Products Header */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Product Management</h3>
                    <p className="text-gray-600">Manage products across all your branches</p>
                  </div>
                    <div className="flex gap-3">
                  <Button variant="outline" onClick={() => {
                        setSelectedCategory(null);
                        setShowCategoryModal(true);
                      }}>
                        <Tag className="h-4 w-4 mr-2" /> New Category
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" /> Export
                      </Button>
                      <Button onClick={() => {
                        setSelectedProductForEdit(null);
                        setShowProductModal(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" /> Add Product
                      </Button>
                    </div>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-6 border-b">
                  <h4 className="font-semibold">Categories ({categories.length})</h4>
                  <p className="text-sm text-gray-600 mt-1">Use categories to organize and filter products.</p>
                </div>
                <div className="divide-y">
                  {categories.length === 0 ? (
                    <div className="p-6 text-sm text-gray-600">
                      No categories yet. Click "New Category" to add your first one.
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span
                            className="h-3 w-3 rounded-full mt-1"
                            style={{ backgroundColor: cat.color || '#9CA3AF' }}
                          />
                          <div>
                            <div className="font-medium text-gray-900">{cat.name}</div>
                            {cat.description && (
                              <div className="text-sm text-gray-500">{cat.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCategory(cat);
                              setShowCategoryModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCategory(cat)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Products List */}
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">All Products ({searchedProducts.length})</h4>
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-48"
                      />
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" /> Filter
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branches</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedProducts.map((product) => {
                        const productBranches = filteredBranchProducts.filter(
                          (bp) => bp.productId === product.id
                        );
                        const avgStock = productBranches.length > 0
                          ? productBranches.reduce((sum, bp) => sum + bp.stock, 0) / productBranches.length
                          : 0;
                        const minStock = productBranches.length > 0
                          ? productBranches.reduce((min, bp) => Math.min(min, bp.stock), Infinity)
                          : 0;
                        
                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                                ) : (
                                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Package className="h-6 w-6 text-blue-600" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-gray-900">{product.name}</div>
                                  <div className="text-sm text-gray-500">{product.description}</div>
                                  <div className="text-xs text-gray-400">Code: {getProductDisplayCode(product)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {product.sku}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                                {product.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-lg font-bold text-gray-900">
                                ${product.basePrice.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {selectedBranchName}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm text-gray-700">
                                  Avg stock: <span className="font-medium">{avgStock.toFixed(0)}</span>
                                </div>
                                <div className="text-sm text-gray-700">
                                  Min stock: <span className={`font-medium ${minStock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                    {minStock}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                minStock > 10 ? 'bg-green-100 text-green-800' :
                                minStock > 0 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {minStock > 10 ? 'Good' : minStock > 0 ? 'Low' : 'Out'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    const branchStock = getDisplayStockForProduct(product.id);
                                    setShowEditProduct({
                                      ...product,
                                      stock: branchStock.stock,
                                      minStock: branchStock.minStock
                                    });
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    const newPrice = parseFloat(prompt(`Enter new price for ${product.name}:`, product.basePrice.toString()) || '0');
                                    if (newPrice > 0) {
                                      updateProductPrice(product.id, newPrice);
                                    }
                                  }}
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => deleteProduct(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="border-t px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>Rows per page</span>
                      <select
                        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm"
                        value={productsPerPage}
                        onChange={(event) => setProductsPerPage(Number(event.target.value))}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    <div>
                      {searchedProducts.length === 0
                        ? '0 of 0'
                        : `${(productPage - 1) * productsPerPage + 1}-${Math.min(
                            productPage * productsPerPage,
                            searchedProducts.length
                          )} of ${searchedProducts.length}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setProductPage((prev) => Math.max(1, prev - 1))}
                        disabled={productPage <= 1}
                      >
                        Prev
                      </Button>
                      <span className="text-xs text-gray-500">
                        Page {productPage} of {totalProductPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setProductPage((prev) => Math.min(totalProductPages, prev + 1))}
                        disabled={productPage >= totalProductPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Staff Tab */}
          {selectedTab === 'staff' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Staff Management</h3>
                    <p className="text-gray-600">Create and manage staff accounts for your branches</p>
                  </div>
                  <Button onClick={() => setShowCreateStaff(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Staff Member
                  </Button>
                </div>
              </div>

              {/* Staff List */}
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Staff Members ({filteredStaffMembers.length})</h4>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" /> Filter
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {searchedStaffMembers.map((staff) => (
                        <tr key={staff.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="font-medium text-blue-600">{staff.name.charAt(0)}</span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                                <div className="text-sm text-gray-500">{staff.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{staff.position}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{staff.branchName}</div>
                            <div className="text-xs text-gray-400" title={staff.branchId}>
                              Branch ID: {getBranchDisplayId(staff.branchId)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              staff.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {staff.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {Array.from(
                                new Set(
                                  Object.entries(staff.permissions)
                                    .filter(([key, value]) => value && key !== 'maxPriceChange')
                                    .map(([key]) => getPermissionLabel(key))
                                )
                              ).map((label) => (
                                <span key={label} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {label}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => openEditStaffModal(staff)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setShowResetPassword(staff.id)}
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => toggleStaffStatus(staff.id, staff.status)}
                              >
                                {staff.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
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

          {/* Promotions Tab */}
          {selectedTab === 'promotions' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Promotion Management</h3>
                    <p className="text-gray-600">Create discounts and sales for your products</p>
                  </div>
                  <Button
                    onClick={() => {
                      resetPromotionForm();
                      setShowCreatePromotion(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Create Promotion
                  </Button>
                </div>
              </div>

              {/* Promotions List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchedPromotions.map((promotion) => (
                  <div key={promotion.id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{promotion.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{promotion.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        promotion.status === 'active' ? 'bg-green-100 text-green-800' :
                        promotion.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {promotion.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Type:</span>
                        <span className="font-medium">
                          {promotion.type === 'percentage' ? `${promotion.value}% OFF` :
                           promotion.type === 'fixed' ? `$${promotion.value} OFF` :
                           'Buy One Get One'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Applied to:</span>
                        <span className="font-medium">
                          {promotion.applyTo === 'all' ? 'All Products' : `${promotion.productIds.length} products`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Branches:</span>
                        <span className="font-medium">
                          {promotion.applyTo === 'all' ? 'All Branches' : `${promotion.branchIds.length} branches`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Duration:</span>
                        <span className="font-medium">
                          {promotion.startDate.toDate().toLocaleDateString()} - {promotion.endDate.toDate().toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 flex gap-2 pt-4 border-t">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          populatePromotionForm(promotion);
                          setShowCreatePromotion(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openPromotionLabelPicker(promotion)}
                      >
                        <Tag className="h-4 w-4 mr-2" /> Apply to Labels
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-1 text-rose-600 hover:text-rose-700"
                        onClick={() => deletePromotion(promotion)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other tabs */}
          {selectedTab === 'labels' && (
            <div className="bg-white rounded-xl border p-6 text-gray-900">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Digital Label Management</h3>
                  <p className="text-gray-600">Monitor and manage your digital price labels</p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                    <span className="text-xs font-medium text-slate-600">New labels</span>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={labelGenerateCount}
                      onChange={(e) => setLabelGenerateCount(Number(e.target.value || 1))}
                      className="h-8 w-20 bg-white text-sm"
                    />
                  </div>
                  <Button variant="outline" onClick={handleGenerateLabels}>
                    Generate
                  </Button>
                  <Button variant="outline" onClick={handleAutoAssignLabels}>
                    Auto-Assign Products
                  </Button>
                  <Button variant="outline" onClick={clearAllLabelsForBranch}>
                    Clear All Labels (Branch)
                  </Button>
                  <Button variant="outline" onClick={deleteAllLabelsForBranch}>
                    Delete All Labels (Branch)
                  </Button>
                  <Button onClick={openDigitalLabelsScreen}>
                    Open Digital Labels Screen
                  </Button>
                </div>
              </div>
              
              {filteredLabels.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed p-6 text-sm text-gray-600">
                  No labels yet for this branch. Select a branch and click "Generate Labels".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {sortedFilteredLabels.map((label) => (
                    <div
                      key={label.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-slate-500">Label</div>
                          <div className="text-lg font-semibold text-slate-900">
                            {getLabelDisplayId(label)}
                          </div>
                          <div className="mt-1 text-sm text-slate-700">
                            {label.productName || 'Unassigned'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {label.branchName || selectedBranchName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {label.location ? `Shelf/Aisle: ${label.location}` : 'Shelf/Aisle: Not set'}
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${labelStatusStyles[label.status]}`}>
                          {label.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                        <div>
                          <div className="text-xs text-slate-500">Price</div>
                          {label.discountPercent != null && label.finalPrice != null ? (
                            <>
                              <div className="text-xs text-slate-400 line-through">
                                {label.basePrice != null ? `$${Number(label.basePrice).toFixed(2)}` : '--'}
                              </div>
                              <div className="font-semibold text-slate-900">
                                {`$${Number(label.finalPrice).toFixed(2)}`}
                              </div>
                              <div className="text-xs text-emerald-600">
                                {label.discountPercent}% OFF
                              </div>
                            </>
                          ) : (
                            <div className="font-semibold text-slate-900">
                              {label.currentPrice != null
                                ? `$${Number(label.currentPrice).toFixed(2)}`
                                : '--'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Battery</div>
                          <div className={`font-semibold ${label.battery < 20 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {label.battery}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Last Sync</div>
                          <div className="text-xs text-slate-600">
                            {label.lastSync?.toDate ? label.lastSync.toDate().toLocaleString() : '--'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4">
                        <div className="grid gap-2">
                          <div className="text-xs font-medium text-slate-600">Shelf / Aisle</div>
                          <div className="flex gap-2">
                            <Input
                              value={labelLocationEdits[label.id] ?? label.location ?? ''}
                              onChange={(e) =>
                                setLabelLocationEdits((prev) => ({
                                  ...prev,
                                  [label.id]: e.target.value,
                                }))
                              }
                              className="bg-white text-slate-900 placeholder-slate-400"
                              placeholder="e.g., Aisle 3 • Shelf B2"
                            />
                            <Button
                              variant="outline"
                              onClick={() => updateLabelLocation(label.id)}
                            >
                              Save
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <div className="text-xs font-medium text-slate-600">Assign</div>
                          <select
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white"
                            value={labelCategoryFilter[label.id] || ''}
                            onChange={(e) =>
                              setLabelCategoryFilter((prev) => ({
                                ...prev,
                                [label.id]: e.target.value
                              }))
                            }
                          >
                            <option value="">All categories</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          <select
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white"
                            value={label.productId || ''}
                            onChange={(e) => {
                              const newProductId = e.target.value;
                              if (!newProductId) return;
                              assignProductToLabel(
                                label.id,
                                newProductId,
                                label.branchId,
                                label.labelId ?? label.labelCode
                              );
                            }}
                            disabled={assigningLabelId === label.id}
                          >
                            <option value="">Select product...</option>
                            {(labelCategoryFilter[label.id]
                              ? (productsByBranchId.get(label.branchId) ?? []).filter(
                                  (p) => p.category === labelCategoryFilter[label.id]
                                )
                              : productsByBranchId.get(label.branchId) ?? []
                            ).map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          {assigningLabelId === label.id && (
                            <div className="text-xs text-slate-500">Assigning...</div>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <div className="text-xs font-medium text-slate-600">Discount</div>
                          <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr_90px] gap-2 items-center">
                            <Input
                              type="number"
                              placeholder="Percent"
                              value={discountInputs[label.id] ?? ''}
                              onChange={(e) =>
                                setDiscountInputs((prev) => ({
                                  ...prev,
                                  [label.id]: Number(e.target.value),
                                }))
                              }
                              className="text-slate-900 placeholder-slate-400 bg-white"
                            />

                            <Button
                              onClick={async () => {
                                const percent = discountInputs[label.id];
                                if (!percent || percent <= 0 || percent > 100) {
                                  openLabelNotice('Invalid discount', 'Enter a value between 1 and 100.', 'warning');
                                  return;
                                }

                                if (!label.productId) {
                                  openLabelNotice('Assign product', 'Assign a product before discounting.', 'warning');
                                  return;
                                }

                                const basePrice = getBranchPriceForProduct(label.productId, label.branchId);
                                if (!basePrice) {
                                  openLabelNotice('Base price missing', 'Set a base price first.', 'warning');
                                  return;
                                }

                                try {
                                  await applyDiscountToLabel({
                                    labelId: label.id,
                                    basePrice,
                                    percent,
                                  });

                                  const discountPrice = Math.round(basePrice * (1 - percent / 100) * 100) / 100;
                                  setLabels((prev) =>
                                    prev.map((item) =>
                                      item.id === label.id
                                        ? {
                                            ...item,
                                            basePrice,
                                            currentPrice: basePrice,
                                            finalPrice: discountPrice,
                                            discountPercent: percent,
                                            discountPrice,
                                            lastSync: Timestamp.now(),
                                            status: 'syncing',
                                          }
                                        : item
                                    )
                                  );
                                  openLabelNotice('Discount applied', 'Label price updated.', 'success');
                                } catch (error: any) {
                                  console.error('Error applying label discount:', error);
                                  openLabelNotice('Discount failed', error.message || 'Could not apply discount.', 'error');
                                }
                              }}
                              className="flex-1"
                            >
                              Apply
                            </Button>

                            <Button
                              variant="outline"
                              onClick={async () => {
                                if (!label.productId) {
                                  openLabelNotice('Assign product', 'Assign a product before clearing.', 'warning');
                                  return;
                                }

                                const basePrice = getBranchPriceForProduct(label.productId, label.branchId);
                                if (!basePrice) {
                                  openLabelNotice('Base price missing', 'Set a base price first.', 'warning');
                                  return;
                                }

                                try {
                                  await clearDiscountFromLabel({
                                    labelId: label.id,
                                    basePrice,
                                  });

                                  setLabels((prev) =>
                                    prev.map((item) =>
                                      item.id === label.id
                                        ? {
                                            ...item,
                                            basePrice,
                                            currentPrice: basePrice,
                                            finalPrice: basePrice,
                                            discountPercent: null,
                                            discountPrice: null,
                                            lastSync: Timestamp.now(),
                                            status: 'syncing',
                                          }
                                        : item
                                    )
                                  );
                                  openLabelNotice('Discount cleared', 'Label price restored.', 'success');
                                } catch (error: any) {
                                  console.error('Error clearing label discount:', error);
                                  openLabelNotice('Clear failed', error.message || 'Could not clear discount.', 'error');
                                }
                              }}
                            >
                              Clear
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => clearLabelAssignment(label.id)}
                          >
                            Clear Label
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => deleteLabel(label.id)}
                          >
                            Delete Label
                          </Button>
                        </div>

                        <a
                          className="text-xs text-blue-600 underline"
                          href={`/digital-labels/${label.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Label Screen
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'reports' && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4">Business Reports</h3>
              <p className="text-gray-600">Analytics and insights for your retail business</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="border rounded-xl p-6">
                  <h4 className="font-semibold mb-4">Sales Summary</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Total Products:</span>
                      <span className="font-bold">{products.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Branches:</span>
                      <span className="font-bold">{branches.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Staff:</span>
                      <span className="font-bold">{filteredStaffMembers.filter(s => s.status === 'active').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Labels:</span>
                      <span className="font-bold">{filteredLabels.filter(l => l.status === 'active').length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-xl p-6">
                  <h4 className="font-semibold mb-4">Stock Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>In Stock:</span>
                      <span className="font-bold text-green-600">
                        {filteredBranchProducts.filter(p => p.status === 'in-stock').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Low Stock:</span>
                      <span className="font-bold text-yellow-600">
                        {filteredBranchProducts.filter(p => p.status === 'low-stock').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Out of Stock:</span>
                      <span className="font-bold text-red-600">
                        {filteredBranchProducts.filter(p => p.status === 'out-of-stock').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-xl border bg-white p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Issue Reports</h4>
                    <p className="text-sm text-gray-600">
                      Staff-reported label issues across your branches
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {searchedIssues.length} total
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Label ID</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Issue</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Branch</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Priority</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Reported</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {searchedIssues.length === 0 ? (
                        <tr>
                          <td className="px-4 py-4 text-sm text-gray-500" colSpan={8}>
                            No issues reported yet.
                          </td>
                        </tr>
                      ) : (
                        searchedIssues.map((issue) => (
                          <tr key={issue.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {issue.labelId}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {issue.productName || 'Unknown Product'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {issue.issue}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {issue.branchName || issue.branchId}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                issue.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {issue.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                issue.priority === 'high' ? 'bg-red-100 text-red-800' :
                                issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {issue.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {issue.reportedAt?.toDate ? issue.reportedAt.toDate().toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={issue.status === 'resolved'}
                                  onClick={() => resolveIssueReport(issue)}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-rose-600 hover:text-rose-700"
                                  onClick={() => deleteIssueReport(issue)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Product Modal */}
      {showCreateProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PackagePlus className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
                </div>
                <button onClick={() => setShowCreateProduct(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Add a new product to your catalog</p>
            </div>

            <form onSubmit={createProduct} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Product Name *</label>
                  <Input
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    placeholder="e.g., Organic Milk 1L"
                    required
                  />
                </div>

                {/* SKU */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">SKU (auto if empty)</label>
                  <Input
                    value={productForm.sku}
                    onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                    placeholder="PR-00001"
                  />
                </div>

                {/* Product Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Product Code (auto if empty)</label>
                  <Input
                    value={productForm.productCode}
                    onChange={(e) => setProductForm({...productForm, productCode: e.target.value})}
                    placeholder="PR-VE001-00001"
                  />
                </div>

               {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category *</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      className="flex-1 border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="">Select a category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                      {categories.length === 0 && (
                        <option value="General">General (no categories yet)</option>
                      )}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(null);
                        setShowCategoryModal(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                

                {/* Base Price */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Base Price ($) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={productForm.basePrice}
                      onChange={(e) => setProductForm({...productForm, basePrice: parseFloat(e.target.value) || 0})}
                      className="pl-8"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Stock (selected branch)</label>
                  <Input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: parseInt(e.target.value, 10) || 0})}
                  />
                </div>

                {/* Min Stock */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Min Stock</label>
                  <Input
                    type="number"
                    min="0"
                    value={productForm.minStock}
                    onChange={(e) => setProductForm({...productForm, minStock: parseInt(e.target.value, 10) || 0})}
                  />
                </div>

                {/* Image URL */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Product Image URL</label>
                  <Input
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 h-24"
                    placeholder="Product description..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowCreateProduct(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Edit className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
                </div>
                <button onClick={() => setShowEditProduct(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Update product information</p>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Product Name *</label>
                  <Input
                    value={showEditProduct.name}
                    onChange={(e) => setShowEditProduct({...showEditProduct, name: e.target.value})}
                    required
                  />
                </div>

                {/* SKU */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">SKU *</label>
                  <Input
                    value={showEditProduct.sku}
                    onChange={(e) => setShowEditProduct({...showEditProduct, sku: e.target.value})}
                    required
                  />
                </div>

                {/* Product Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Product Code</label>
                  <Input
                    value={showEditProduct.productCode || ''}
                    onChange={(e) => setShowEditProduct({...showEditProduct, productCode: e.target.value})}
                    placeholder="PR-VE001-00001"
                  />
                </div>

                {/* Category */}
<div className="space-y-2">
  <label className="text-sm font-medium text-gray-700">Category</label>
  <div className="flex items-center gap-2">
    <select
      value={showEditProduct.category}
      onChange={(e) => setShowEditProduct({...showEditProduct, category: e.target.value})}
      className="flex-1 border rounded-lg px-3 py-2"
    >
      <option value="">Select a category...</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.name}>
          {cat.name}
        </option>
      ))}
    </select>
    <Button
  type="button"
  variant="outline"
  size="sm"
  onClick={() => {
    const newCategoryName = prompt("Enter new category name:");
    if (newCategoryName) {
      const description = prompt("Enter category description (optional):") || '';
      createCategory(newCategoryName, description);
    }
  }}
>
  <Plus className="h-4 w-4" />
</Button>
  </div>
</div>

                {/* Base Price */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Base Price ($) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={showEditProduct.basePrice}
                      onChange={(e) => setShowEditProduct({...showEditProduct, basePrice: parseFloat(e.target.value) || 0})}
                      className="pl-8"
                      required
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Stock (selected branch)</label>
                  <Input
                    type="number"
                    min="0"
                    value={showEditProduct.stock ?? 0}
                    onChange={(e) => setShowEditProduct({...showEditProduct, stock: parseInt(e.target.value, 10) || 0})}
                  />
                </div>

                {/* Min Stock */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Min Stock</label>
                  <Input
                    type="number"
                    min="0"
                    value={showEditProduct.minStock ?? 10}
                    onChange={(e) => setShowEditProduct({...showEditProduct, minStock: parseInt(e.target.value, 10) || 0})}
                  />
                </div>

                {/* Image URL */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Product Image URL</label>
                  <Input
                    value={showEditProduct.imageUrl}
                    onChange={(e) => setShowEditProduct({...showEditProduct, imageUrl: e.target.value})}
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={showEditProduct.description}
                    onChange={(e) => setShowEditProduct({...showEditProduct, description: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 h-24"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowEditProduct(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {showCreateStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-900">Add Staff Member</h2>
                </div>
                <button onClick={() => setShowCreateStaff(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Create a new staff account for your branch</p>
            </div>

            <form onSubmit={createStaff} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Staff Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name *</label>
                  <Input
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address *</label>
                  <Input
                    type="email"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Position *</label>
                  <select
                    value={staffForm.position}
                    onChange={(e) => setStaffForm({...staffForm, position: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option>Cashier</option>
                    <option>Manager</option>
                    <option>Stock Clerk</option>
                    <option>Sales Associate</option>
                    <option>Supervisor</option>
                  </select>
                </div>

                {/* Branch */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Branch *</label>
                  <select
                    value={staffForm.branchId}
                    onChange={(e) => setStaffForm({...staffForm, branchId: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select a branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Temporary Password *</label>
                  <Input
                    type="text"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({...staffForm, password: e.target.value})}
                    placeholder="Temporary password"
                    required
                  />
                </div>

                {/* Permissions */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Permissions</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={staffForm.permissions.canViewProducts}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          permissions: {...staffForm.permissions, canViewProducts: e.target.checked}
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">View Products</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={staffForm.permissions.canUpdateStock}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          permissions: {...staffForm.permissions, canUpdateStock: e.target.checked}
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Update Stock</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={staffForm.permissions.canReportIssues}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          permissions: {...staffForm.permissions, canReportIssues: e.target.checked}
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Report Issues</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={staffForm.permissions.canViewReports}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          permissions: {...staffForm.permissions, canViewReports: e.target.checked}
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">View Reports</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={staffForm.permissions.canChangePrices}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          permissions: {...staffForm.permissions, canChangePrices: e.target.checked}
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Change Prices</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={staffForm.permissions.canCreateProducts}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          permissions: {...staffForm.permissions, canCreateProducts: e.target.checked}
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Manage Products</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={staffForm.permissions.canCreateLabels}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          permissions: {...staffForm.permissions, canCreateLabels: e.target.checked}
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Manage Labels</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={staffForm.permissions.canCreatePromotions}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          permissions: {...staffForm.permissions, canCreatePromotions: e.target.checked}
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Manage Promotions</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowCreateStaff(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Staff
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Edit Staff Member</h2>
                </div>
                <button onClick={() => setShowEditStaff(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Update staff information</p>
            </div>

            <form onSubmit={updateStaff} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name *</label>
                  <Input
                    value={editStaffForm.name}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address *</label>
                  <Input
                    type="email"
                    value={editStaffForm.email}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Position *</label>
                  <select
                    value={editStaffForm.position}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, position: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option>Cashier</option>
                    <option>Manager</option>
                    <option>Stock Clerk</option>
                    <option>Sales Associate</option>
                    <option>Supervisor</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Branch *</label>
                  <select
                    value={editStaffForm.branchId}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, branchId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select a branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editStaffForm.status}
                    onChange={(e) =>
                      setEditStaffForm({ ...editStaffForm, status: e.target.value as 'active' | 'inactive' })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Permissions</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editStaffForm.permissions.canViewProducts}
                        onChange={(e) =>
                          setEditStaffForm({
                            ...editStaffForm,
                            permissions: { ...editStaffForm.permissions, canViewProducts: e.target.checked }
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">View Products</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editStaffForm.permissions.canUpdateStock}
                        onChange={(e) =>
                          setEditStaffForm({
                            ...editStaffForm,
                            permissions: { ...editStaffForm.permissions, canUpdateStock: e.target.checked }
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Update Stock</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editStaffForm.permissions.canReportIssues}
                        onChange={(e) =>
                          setEditStaffForm({
                            ...editStaffForm,
                            permissions: { ...editStaffForm.permissions, canReportIssues: e.target.checked }
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Report Issues</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editStaffForm.permissions.canViewReports}
                        onChange={(e) =>
                          setEditStaffForm({
                            ...editStaffForm,
                            permissions: { ...editStaffForm.permissions, canViewReports: e.target.checked }
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">View Reports</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editStaffForm.permissions.canChangePrices}
                        onChange={(e) =>
                          setEditStaffForm({
                            ...editStaffForm,
                            permissions: { ...editStaffForm.permissions, canChangePrices: e.target.checked }
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Change Prices</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editStaffForm.permissions.canCreateProducts}
                        onChange={(e) =>
                          setEditStaffForm({
                            ...editStaffForm,
                            permissions: { ...editStaffForm.permissions, canCreateProducts: e.target.checked }
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Manage Products</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editStaffForm.permissions.canCreateLabels}
                        onChange={(e) =>
                          setEditStaffForm({
                            ...editStaffForm,
                            permissions: { ...editStaffForm.permissions, canCreateLabels: e.target.checked }
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Manage Labels</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editStaffForm.permissions.canCreatePromotions}
                        onChange={(e) =>
                          setEditStaffForm({
                            ...editStaffForm,
                            permissions: { ...editStaffForm.permissions, canCreatePromotions: e.target.checked }
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Manage Promotions</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowEditStaff(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Promotion Modal */}
      {showCreatePromotion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Percent className="h-6 w-6 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingPromotion ? 'Edit Promotion' : 'Create Promotion'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    resetPromotionForm();
                    setShowCreatePromotion(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">
                {editingPromotion ? 'Update promotion details' : 'Create a discount or sale for your products'}
              </p>
            </div>

            <form onSubmit={savePromotion} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Promotion Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Promotion Name *</label>
                  <Input
                    value={promotionForm.name}
                    onChange={(e) => setPromotionForm({...promotionForm, name: e.target.value})}
                    placeholder="e.g., Summer Sale, Weekend Discount"
                    required
                  />
                </div>

                {/* Promotion Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Promotion Type *</label>
                  <select
                    value={promotionForm.type}
                    onChange={(e) => setPromotionForm({...promotionForm, type: e.target.value as any})}
                    className="w-full border rounded-lg px-3 py-2 bg-white text-gray-900"
                  >
                    <option value="percentage">Percentage Off</option>
                    <option value="fixed">Fixed Amount Off</option>
                    <option value="bogo">Buy One Get One</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {promotionForm.type === 'percentage' ? 'Discount Percentage *' : 
                     promotionForm.type === 'fixed' ? 'Discount Amount ($) *' : 
                     'BOGO Details'}
                  </label>
                  <div className="relative">
                    {promotionForm.type === 'percentage' && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    )}
                    {promotionForm.type === 'fixed' && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    )}
                    <Input
                      type="number"
                      min="0"
                      max={promotionForm.type === 'percentage' ? "100" : undefined}
                      value={promotionForm.value}
                      onChange={(e) => setPromotionForm({...promotionForm, value: parseFloat(e.target.value) || 0})}
                      className={promotionForm.type !== 'bogo' ? 'pl-8' : ''}
                      placeholder={promotionForm.type === 'percentage' ? "10" : 
                                 promotionForm.type === 'fixed' ? "5" : ""}
                      required={promotionForm.type !== 'bogo'}
                      disabled={promotionForm.type === 'bogo'}
                    />
                  </div>
                  {promotionForm.type === 'bogo' && (
                    <p className="text-sm text-gray-500">Buy One, Get One Free</p>
                  )}
                </div>

                {/* Apply To */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Apply To *</label>
                  <select
                    value={promotionForm.applyTo}
                    onChange={(e) => setPromotionForm({...promotionForm, applyTo: e.target.value as any})}
                    className="w-full border rounded-lg px-3 py-2 bg-white text-gray-900"
                  >
                    <option value="all">All Products & Branches</option>
                    <option value="selected">Selected Products/Branches Only</option>
                  </select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Start Date *</label>
                  <Input
                    type="datetime-local"
                    value={promotionForm.startDate}
                    onChange={(e) => setPromotionForm({...promotionForm, startDate: e.target.value})}
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">End Date *</label>
                  <Input
                    type="datetime-local"
                    value={promotionForm.endDate}
                    onChange={(e) => setPromotionForm({...promotionForm, endDate: e.target.value})}
                    required
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={promotionForm.description}
                    onChange={(e) => setPromotionForm({...promotionForm, description: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 h-24"
                    placeholder="Promotion details..."
                  />
                </div>

                {/* Selected Branches (if applyTo is 'selected') */}
                {promotionForm.applyTo === 'selected' && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select Branches</label>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                      {branches.map(branch => (
                        <label key={branch.id} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={promotionForm.selectedBranches.includes(branch.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPromotionForm({
                                  ...promotionForm,
                                  selectedBranches: [...promotionForm.selectedBranches, branch.id]
                                });
                              } else {
                                setPromotionForm({
                                  ...promotionForm,
                                  selectedBranches: promotionForm.selectedBranches.filter(id => id !== branch.id)
                                });
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{branch.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Products (if applyTo is 'selected') */}
                {promotionForm.applyTo === 'selected' && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select Products</label>
                    {promotionForm.selectedBranches.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Select branches to see products available in those branches.
                      </p>
                    ) : promotionVisibleProducts.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No products found for the selected branches.
                      </p>
                    ) : (
                      <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                        {promotionVisibleProducts.map((product) => (
                          <label key={product.id} className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={promotionForm.selectedProducts.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPromotionForm({
                                    ...promotionForm,
                                    selectedProducts: [...promotionForm.selectedProducts, product.id]
                                  });
                                } else {
                                  setPromotionForm({
                                    ...promotionForm,
                                    selectedProducts: promotionForm.selectedProducts.filter(
                                      (id) => id !== product.id
                                    )
                                  });
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">
                              {product.name} - ${product.basePrice.toFixed(2)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetPromotionForm();
                    setShowCreatePromotion(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPromotion ? 'Save Changes' : 'Create Promotion'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Branch Modal */}
      {showCreateBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-orange-600" />
                  <h2 className="text-xl font-bold text-gray-900">Add New Branch</h2>
                </div>
                <button onClick={() => setShowCreateBranch(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Add a new store location to your company</p>
            </div>

            <form onSubmit={createBranch} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Branch Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Branch Name *</label>
                  <Input
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({...branchForm, name: e.target.value})}
                    placeholder="e.g., Downtown Store, Mall Branch"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={branchForm.phone}
                      onChange={(e) => setBranchForm({...branchForm, phone: e.target.value})}
                      className="pl-10"
                      placeholder="(123) 456-7890"
                    />
                  </div>
                </div>

                {/* Manager */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Manager Name</label>
                  <Input
                    value={branchForm.manager}
                    onChange={(e) => setBranchForm({...branchForm, manager: e.target.value})}
                    placeholder="e.g., John Doe"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Address *</label>
                  <textarea
                    value={branchForm.address}
                    onChange={(e) => setBranchForm({...branchForm, address: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 h-24"
                    placeholder="123 Main St, City, State, ZIP Code"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowCreateBranch(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Branch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {showEditBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-orange-600" />
                  <h2 className="text-xl font-bold text-gray-900">Edit Branch</h2>
                </div>
                <button onClick={() => setShowEditBranch(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Update branch information</p>
            </div>

            <form onSubmit={updateBranch} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Branch Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Branch Name *</label>
                  <Input
                    value={editBranchForm.name}
                    onChange={(e) => setEditBranchForm({ ...editBranchForm, name: e.target.value })}
                    placeholder="e.g., Downtown Store, Mall Branch"
                    required
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={editBranchForm.status}
                    onChange={(e) =>
                      setEditBranchForm({
                        ...editBranchForm,
                        status: e.target.value as 'active' | 'inactive'
                      })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={editBranchForm.phone}
                      onChange={(e) => setEditBranchForm({ ...editBranchForm, phone: e.target.value })}
                      className="pl-10"
                      placeholder="(123) 456-7890"
                    />
                  </div>
                </div>

                {/* Manager */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Manager Name</label>
                  <Input
                    value={editBranchForm.manager}
                    onChange={(e) => setEditBranchForm({ ...editBranchForm, manager: e.target.value })}
                    placeholder="e.g., John Doe"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Address *</label>
                  <textarea
                    value={editBranchForm.address}
                    onChange={(e) => setEditBranchForm({ ...editBranchForm, address: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 h-24"
                    placeholder="123 Main St, City, State, ZIP Code"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowEditBranch(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
                </div>
                <button onClick={() => setShowResetPassword(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Set new password for staff member</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              resetStaffPassword(showResetPassword);
            }} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="password"
                      value={resetPasswordForm.newPassword}
                      onChange={(e) => setResetPasswordForm({
                        ...resetPasswordForm,
                        newPassword: e.target.value
                      })}
                      className="pl-10"
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="password"
                      value={resetPasswordForm.confirmPassword}
                      onChange={(e) => setResetPasswordForm({
                        ...resetPasswordForm,
                        confirmPassword: e.target.value
                      })}
                      className="pl-10"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowResetPassword(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Reset Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Store className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Edit Company</h2>
                </div>
                <button onClick={() => setShowEditCompany(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Update your shop information</p>
            </div>

            <form onSubmit={updateCompanyInfo} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Company Name *</label>
                <Input
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  disabled
                />
                <p className="text-xs text-gray-500">Contact admin to update email.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <Input
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <textarea
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 h-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowEditCompany(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {labelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={closeLabelModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3 border-b px-6 py-5">
              <div className={`rounded-full p-2 ${labelModalToneStyles[labelModal.tone]}`}>
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{labelModal.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{labelModal.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4">
              {labelModal.cancelLabel && (
                <Button
                  variant="outline"
                  onClick={closeLabelModal}
                >
                  {labelModal.cancelLabel}
                </Button>
              )}
              <Button
                onClick={async () => {
                  const action = labelModal.onConfirm;
                  closeLabelModal();
                  if (action) {
                    await action();
                  }
                }}
              >
                {labelModal.confirmLabel || 'OK'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {promotionLabelPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Apply Promotion to Labels</h2>
                  <p className="text-sm text-gray-600">
                    {promotionLabelPicker.promotion.name} ({promotionLabelPicker.promotion.value}% OFF)
                  </p>
                </div>
                <button
                  onClick={() => setPromotionLabelPicker(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {promotionLabelCandidates.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No matching labels. Assign products to labels for the selected branches, then try again.
                </p>
              ) : (
                <div className="border rounded-lg p-4 max-h-72 overflow-y-auto space-y-2">
                  {promotionLabelCandidates.map((label) => (
                    <label key={label.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={promotionLabelPicker.selectedIds.includes(label.id)}
                        onChange={(e) => {
                          setPromotionLabelPicker((prev) => {
                            if (!prev) return prev;
                            const next = e.target.checked
                              ? [...prev.selectedIds, label.id]
                              : prev.selectedIds.filter((id) => id !== label.id);
                            return { ...prev, selectedIds: next };
                          });
                        }}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {label.productName || 'Unassigned'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Label: {label.labelId || label.labelCode || label.id} • Branch: {label.branchName || label.branchId}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setPromotionLabelPicker(null)}>
                Cancel
              </Button>
              <Button onClick={applyPromotionToSelectedLabels} disabled={promotionLabelCandidates.length === 0}>
                Apply Promotion
              </Button>
            </div>
          </div>
        </div>
      )}

      {showBranchPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">Select Branch</h3>
              <button
                type="button"
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                onClick={() => setShowBranchPicker(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-4 space-y-2">
              <button
                type="button"
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  selectedBranchId === 'all'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => {
                  setSelectedBranchId('all');
                  setShowBranchPicker(false);
                }}
              >
                All branches
              </button>
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    selectedBranchId === branch.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedBranchId(branch.id);
                    setShowBranchPicker(false);
                  }}
                >
                  {branch.name}
                </button>
              ))}
            </div>
            <div className="border-t px-5 py-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowBranchPicker(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        companyId={currentUser?.companyId || ''}
        category={selectedCategory}
        onCategoryChange={reloadCategories}
      />

      {/* Product Modal */}
      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={selectedProductForEdit}
        categories={categories}
        onSubmit={async (productData) => {
          if (selectedProductForEdit) {
            // Update existing product
            await updateProduct(selectedProductForEdit.id, productData);
          } else {
            // Create new product
            await createProductFromModal(productData);
          }
        }}
      />

    </div>  
  );
}
