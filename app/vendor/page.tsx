'use client';

import { useState, useEffect } from 'react';
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
import { 
  doc as fsDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
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
  permissions: {
    canViewProducts: boolean;
    canUpdateStock: boolean;
    canReportIssues: boolean;
    canViewReports: boolean;
    canChangePrices: boolean;
    maxPriceChange?: number;
  };
  lastLogin?: Timestamp;
  createdAt: Timestamp;
}

interface DigitalLabel {
  id: string;
  labelId: string;
  productId: string;
  productName?: string;
  branchId: string;
  branchName?: string;
  companyId: string;
  location: string;
  currentPrice: number;
  battery: number;
  status: 'active' | 'inactive' | 'low-battery' | 'error' | 'syncing';
  lastSync: Timestamp;
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

export default function VendorDashboard() {
  const router = useRouter();
  const { user: currentUser, clearUser } = useUserStore();
  
  // States
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'products' | 'staff' | 'labels' | 'promotions' | 'reports'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branchProducts, setBranchProducts] = useState<BranchProduct[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [labels, setLabels] = useState<DigitalLabel[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [discountInputs, setDiscountInputs] = useState<Record<string, number>>({});
  const [assigningLabelId, setAssigningLabelId] = useState<string | null>(null);
  
  // Modal states
  const [showCreateStaff, setShowCreateStaff] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [showCreatePromotion, setShowCreatePromotion] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState<Product | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<string | null>(null);
  
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

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    sku: '',
    category: 'General',
    basePrice: 0,
    imageUrl: ''
  });

  const [branchForm, setBranchForm] = useState({
    name: '',
    address: '',
    phone: '',
    manager: ''
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

  // Redirect if not vendor
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role !== 'vendor') {
      if (currentUser.role === 'admin') router.push('/admin');
      if (currentUser.role === 'staff') router.push('/staff');
    }
  }, [currentUser, router]);

  // Load company and data
  useEffect(() => {
    if (currentUser?.role === 'vendor' && currentUser.companyId) {
      loadVendorData();
    }
  }, [currentUser]);

  const loadVendorData = async () => {
    if (!currentUser?.companyId) return;
    
    try {
      setLoading(true);
      
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
      const labelsData = await Promise.all(
        labelsSnapshot.docs.map(async (docSnap) => {
          const labelRaw = docSnap.data() as any;
          const productId = labelRaw?.productId as string | undefined;
          const branchId = labelRaw?.branchId as string | undefined;

          const productDocSnap = productId
            ? await getDoc(fsDoc(db, 'products', productId))
            : null;

          const branchDocSnap = branchId
            ? await getDoc(fsDoc(db, 'branches', branchId))
            : null;

          const productName =
            productDocSnap && productDocSnap.exists()
              ? ((productDocSnap.data() as any)?.name ?? 'Unknown Product')
              : 'Unknown Product';

          const branchName =
            branchDocSnap && branchDocSnap.exists()
              ? ((branchDocSnap.data() as any)?.name ?? 'Unknown Branch')
              : 'Unknown Branch';

          return {
            id: docSnap.id,
            ...labelRaw,
            productName,
            branchName
          } as DigitalLabel;
        })
      );
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

    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setLoading(false);
    }
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
      await loadVendorData();
      
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

  // Create new product
  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.companyId) return;

    try {
      const productRef = await addDoc(collection(db, 'products'), {
        ...productForm,
        companyId: currentUser.companyId,
        createdBy: currentUser.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Create branch products for all branches
      const batchPromises = branches.map(async (branch) => {
        await addDoc(collection(db, 'branch_products'), {
          productId: productRef.id,
          branchId: branch.id,
          companyId: currentUser.companyId,
          currentPrice: productForm.basePrice,
          stock: 0,
          minStock: 10,
          status: 'out-of-stock',
          lastUpdated: Timestamp.now()
        });
      });

      await Promise.all(batchPromises);

      // Refresh data
      await loadVendorData();
      
      // Reset form and close modal
      setProductForm({
        name: '',
        description: '',
        sku: '',
        category: 'General',
        basePrice: 0,
        imageUrl: ''
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
      
      if (branchIds && branchIds.length > 0) {
        const labelsSnapshot = await getDocs(labelsQuery);
        const labelUpdatePromises = labelsSnapshot.docs
          .filter(doc => branchIds.includes(doc.data().branchId))
          .map(async (docSnapshot) => {
            await updateDoc(fsDoc(db, 'labels', docSnapshot.id), {
              currentPrice: newPrice,
              status: 'syncing',
              lastSync: Timestamp.now()
            });
          });
        await Promise.all(labelUpdatePromises);
      }

      // Refresh data
      await loadVendorData();
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

const assignProductToLabel = async (labelDocId: string, productId: string, branchId: string) => {
  try {
    setAssigningLabelId(labelDocId);

    const product = products.find((p) => p.id === productId);
    if (!product) return alert('Product not found');

    const basePrice = getBranchPriceForProduct(productId, branchId);
    if (!basePrice) return alert('Base price is 0. Please set product/branch price first.');

    await updateDoc(fsDoc(db, 'labels', labelDocId), {
      productId,
      productName: product.name,
      currentPrice: basePrice, // what your labels UI already shows
      basePrice,
      finalPrice: basePrice,
      lastSync: Timestamp.now(),
      status: 'syncing',
    });

    await loadVendorData();
    alert('✅ Product assigned to label!');
  } catch (error: any) {
    console.error('Error assigning product to label:', error);
    alert(`❌ Error: ${error.message || 'Failed to assign product'}`);
  } finally {
    setAssigningLabelId(null);
  }
};
  // Create new branch
  const createBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.companyId) return;

    try {
      await addDoc(collection(db, 'branches'), {
        ...branchForm,
        companyId: currentUser.companyId,
        status: 'active',
        createdAt: Timestamp.now()
      });

      // Refresh data
      await loadVendorData();
      
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

  // Create promotion
  const createPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.companyId) return;

    try {
      const startTimestamp = Timestamp.fromDate(new Date(promotionForm.startDate));
      const endTimestamp = Timestamp.fromDate(new Date(promotionForm.endDate));
      const now = Timestamp.now();

      const promotionData = {
        ...promotionForm,
        companyId: currentUser.companyId,
        productIds: promotionForm.applyTo === 'all' ? [] : promotionForm.selectedProducts,
        branchIds: promotionForm.applyTo === 'all' ? [] : promotionForm.selectedBranches,
        startDate: startTimestamp,
        endDate: endTimestamp,
        status: now < startTimestamp ? 'upcoming' : 'active',
        createdAt: now
      };

      const promotionRef = await addDoc(collection(db, 'promotions'), promotionData);

      // Apply promotion to prices
      if (promotionForm.type === 'percentage') {
        const discountMultiplier = (100 - promotionForm.value) / 100;
        
        // Get affected products
        let productQuery = query(
          collection(db, 'products'),
          where('companyId', '==', currentUser.companyId)
        );

        if (promotionForm.applyTo === 'selected' && promotionForm.selectedProducts.length > 0) {
          productQuery = query(productQuery, where('id', 'in', promotionForm.selectedProducts));
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

      // Refresh data
      await loadVendorData();
      
      // Reset form and close modal
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
      setShowCreatePromotion(false);

      alert(`Promotion "${promotionForm.name}" created successfully!`);

    } catch (error: any) {
      console.error('Error creating promotion:', error);
      alert(`Error: ${error.message}`);
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
      const staff = staffMembers.find(s => s.id === staffId);
      if (!staff) {
        alert('Staff not found');
        return;
      }

      // Get the current user (vendor) to reauthenticate
      const vendorUser = auth.currentUser;
      if (!vendorUser || !vendorUser.email) {
        alert('You need to be logged in');
        return;
      }

      // For demo: Show what would happen
      alert(`Password reset for ${staff.name}\nNew password would be set to: ${resetPasswordForm.newPassword}\n\nIn production, this would use Firebase Admin SDK.`);
      
      setResetPasswordForm({
        newPassword: '',
        confirmPassword: ''
      });
      setShowResetPassword(null);
      
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
      await loadVendorData();
      alert('Product deleted successfully!');

    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'vendor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setSelectedTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              selectedTab === 'dashboard' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setSelectedTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              selectedTab === 'products' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Package className="h-5 w-5" />
            <span>Products ({products.length})</span>
          </button>

          <button
            onClick={() => setSelectedTab('staff')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              selectedTab === 'staff' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Staff ({staffMembers.length})</span>
          </button>

          <button
            onClick={() => setSelectedTab('labels')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              selectedTab === 'labels' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Tag className="h-5 w-5" />
            <span>Labels ({labels.length})</span>
          </button>

          <button
            onClick={() => setSelectedTab('promotions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              selectedTab === 'promotions' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Percent className="h-5 w-5" />
            <span>Promotions ({promotions.length})</span>
          </button>

          <button
            onClick={() => setSelectedTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              selectedTab === 'reports' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span>Reports</span>
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <div className="text-xs text-gray-400 px-2">
            {branches.length} branches • {products.length} products
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
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
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {selectedTab === 'dashboard' && `${company?.name || 'My'} Dashboard`}
                  {selectedTab === 'products' && 'Product Management'}
                  {selectedTab === 'staff' && 'Staff Management'}
                  {selectedTab === 'labels' && 'Digital Labels'}
                  {selectedTab === 'promotions' && 'Promotions & Discounts'}
                  {selectedTab === 'reports' && 'Business Reports'}
                </h1>
                <p className="text-gray-600">
                  {selectedTab === 'dashboard' && 'Overview of your retail operations'}
                  {selectedTab === 'products' && `Manage ${products.length} products across ${branches.length} branches`}
                  {selectedTab === 'staff' && `Manage ${staffMembers.length} staff members`}
                  {selectedTab === 'labels' && `Monitor ${labels.length} digital price labels`}
                  {selectedTab === 'promotions' && `Create and manage ${promotions.length} promotions`}
                  {selectedTab === 'reports' && 'View business analytics and reports'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadVendorData}
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Dashboard Tab */}
          {selectedTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Products</p>
                      <p className="text-3xl font-bold mt-2">{products.length}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {branchProducts.filter(p => p.status === 'low-stock').length} low stock
                      </p>
                    </div>
                    <Package className="h-10 w-10 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Staff</p>
                      <p className="text-3xl font-bold mt-2">
                        {staffMembers.filter(s => s.status === 'active').length}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Across {branches.length} branches
                      </p>
                    </div>
                    <Users className="h-10 w-10 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Labels</p>
                      <p className="text-3xl font-bold mt-2">
                        {labels.filter(l => l.status === 'active').length}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {labels.filter(l => l.status === 'low-battery').length} low battery
                      </p>
                    </div>
                    <Tag className="h-10 w-10 text-purple-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Promotions</p>
                      <p className="text-3xl font-bold mt-2">
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
                      {products.slice(0, 5).map((product) => (
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
                                onClick={() => setShowEditProduct(product)}
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
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                    <Button onClick={() => setShowCreateProduct(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Add Product
                    </Button>
                  </div>
                </div>
              </div>

              {/* Products List */}
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">All Products ({products.length})</h4>
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="Search products..."
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
                      {products.map((product) => {
                        const productBranches = branchProducts.filter(bp => bp.productId === product.id);
                        const avgStock = productBranches.reduce((sum, bp) => sum + bp.stock, 0) / productBranches.length;
                        const minStock = productBranches.reduce((min, bp) => Math.min(min, bp.stock), Infinity);
                        
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
                                {productBranches.length} branches
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm">
                                  Avg stock: <span className="font-medium">{avgStock.toFixed(0)}</span>
                                </div>
                                <div className="text-sm">
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
                                  onClick={() => setShowEditProduct(product)}
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
                    <h4 className="font-semibold">Staff Members ({staffMembers.length})</h4>
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
                      {staffMembers.map((staff) => (
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
                            <span className="text-sm text-gray-900">{staff.branchName}</span>
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
                              {Object.entries(staff.permissions)
                                .filter(([key, value]) => value && key !== 'maxPriceChange')
                                .map(([key]) => (
                                  <span key={key} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                    {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  // Edit staff - you can implement this
                                  const newPosition = prompt(`Edit position for ${staff.name}:`, staff.position);
                                  if (newPosition) {
                                    // Update position logic
                                  }
                                }}
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
                  <Button onClick={() => setShowCreatePromotion(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create Promotion
                  </Button>
                </div>
              </div>

              {/* Promotions List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promotion) => (
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

                    <div className="flex gap-2 pt-4 border-t">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other tabs */}
          {selectedTab === 'labels' && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4">Digital Label Management</h3>
              <p className="text-gray-600">Monitor and manage your digital price labels</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {labels.map((label) => (
                  <div key={label.id} className="border rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{label.labelId}</h4>
                        <p className="text-sm text-gray-600">{label.productName}</p>
                        <p className="text-sm text-gray-500">{label.branchName}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        label.status === 'active' ? 'bg-green-100 text-green-800' :
                        label.status === 'low-battery' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {label.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Current Price:</span>
                        <span className="font-bold">${label.currentPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Battery:</span>
                        <span className={`font-medium ${label.battery < 20 ? 'text-red-600' : 'text-green-600'}`}>
                          {label.battery}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Last Sync:</span>
                        <span className="text-sm text-gray-500">
                          {label.lastSync.toDate().toLocaleString()}
                        </span>
                      </div>
                    </div>

<div className="mt-4 pt-4 border-t space-y-3">
  {/* Assign Product */}
  <div>
    <div className="text-xs font-medium text-gray-600 mb-1">Assign Product</div>
    <select
      className="w-full border rounded-lg px-3 py-2 text-sm"
      value={label.productId || ''}
      onChange={(e) => {
        const newProductId = e.target.value;
        if (!newProductId) return;
        assignProductToLabel(label.id, newProductId, label.branchId);
      }}
      disabled={assigningLabelId === label.id}
    >
      <option value="">Select product...</option>
      {products.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
    {assigningLabelId === label.id && (
      <div className="text-xs text-gray-500 mt-1">Assigning...</div>
    )}
  </div>

  {/* Discount */}
  <div className="flex gap-2 items-center">
    <Input
      type="number"
      placeholder="Discount %"
      value={discountInputs[label.id] ?? ''}
      onChange={(e) =>
        setDiscountInputs((prev) => ({
          ...prev,
          [label.id]: Number(e.target.value),
        }))
      }
      className="w-32"
    />

    <Button
      onClick={async () => {
        const percent = discountInputs[label.id];
        if (!percent || percent <= 0 || percent > 100) return alert('Enter 1 - 100%');

        if (!label.productId) return alert('Assign product first');

        const basePrice = getBranchPriceForProduct(label.productId, label.branchId);
        if (!basePrice) return alert('Base price is 0');

        await applyDiscountToLabel({
          labelId: label.id,
          basePrice,
          percent,
        });

        await loadVendorData();
        alert('✅ Discount applied!');
      }}
      className="flex-1"
    >
      Apply Discount
    </Button>

    <Button
      variant="outline"
      onClick={async () => {
        if (!label.productId) return alert('Assign product first');

        const basePrice = getBranchPriceForProduct(label.productId, label.branchId);
        if (!basePrice) return alert('Base price is 0');

        await clearDiscountFromLabel({
          labelId: label.id,
          basePrice,
        });

        await loadVendorData();
        alert('✅ Discount cleared!');
      }}
    >
      Clear
    </Button>
  </div>

  <a
    className="text-xs text-blue-600 underline"
    href={`/digital-labels?companyId=${label.companyId}&branchId=${label.branchId}`}
    target="_blank"
    rel="noreferrer"
  >
    Open Digital Labels Screen for this branch
  </a>
</div>

                  </div>
                ))}
              </div>
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
                      <span className="font-bold">{staffMembers.filter(s => s.status === 'active').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Labels:</span>
                      <span className="font-bold">{labels.filter(l => l.status === 'active').length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-xl p-6">
                  <h4 className="font-semibold mb-4">Stock Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>In Stock:</span>
                      <span className="font-bold text-green-600">
                        {branchProducts.filter(p => p.status === 'in-stock').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Low Stock:</span>
                      <span className="font-bold text-yellow-600">
                        {branchProducts.filter(p => p.status === 'low-stock').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Out of Stock:</span>
                      <span className="font-bold text-red-600">
                        {branchProducts.filter(p => p.status === 'out-of-stock').length}
                      </span>
                    </div>
                  </div>
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
                  <label className="text-sm font-medium text-gray-700">SKU *</label>
                  <Input
                    value={productForm.sku}
                    onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                    placeholder="e.g., MILK-ORG-001"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="General">General</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Produce">Produce</option>
                    <option value="Meat">Meat</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Frozen">Frozen</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>

                {/* Base Price */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Base Price ($) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.basePrice}
                      onChange={(e) => setProductForm({...productForm, basePrice: parseFloat(e.target.value) || 0})}
                      className="pl-8"
                      placeholder="0.00"
                      required
                    />
                  </div>
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

                {/* Image URL */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Image URL (optional)</label>
                  <Input
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowCreateProduct(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" /> Create Product
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
                  <Users className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Create Staff Member</h2>
                </div>
                <button onClick={() => setShowCreateStaff(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Add new employee to your store</p>
            </div>

            <form onSubmit={createStaff} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                      className="pl-10"
                      placeholder="John Smith"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="email"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                      className="pl-10"
                      placeholder="john@store.com"
                      required
                    />
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Position *</label>
                  <select
                    value={staffForm.position}
                    onChange={(e) => setStaffForm({...staffForm, position: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Store Manager">Store Manager</option>
                    <option value="Stock Clerk">Stock Clerk</option>
                    <option value="Assistant Manager">Assistant Manager</option>
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
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Initial Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({...staffForm, password: e.target.value})}
                      className="pl-10"
                      placeholder="welcome123"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">Staff should change this on first login</p>
                </div>

                {/* Permissions */}
                <div className="md:col-span-2 space-y-4">
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
                      <span className="text-sm">View Products</span>
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
                      <span className="text-sm">Update Stock</span>
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
                      <span className="text-sm">Report Issues</span>
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
                      <span className="text-sm">View Reports</span>
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
                      <span className="text-sm">Change Prices</span>
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

      {/* Create Promotion Modal */}
      {showCreatePromotion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Percent className="h-6 w-6 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900">Create Promotion</h2>
                </div>
                <button onClick={() => setShowCreatePromotion(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Create a discount or sale for your products</p>
            </div>

            <form onSubmit={createPromotion} className="p-6 space-y-6">
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
                    className="w-full border rounded-lg px-3 py-2"
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
                    className="w-full border rounded-lg px-3 py-2"
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

                {/* Selected Products (if applyTo is 'selected') */}
                {promotionForm.applyTo === 'selected' && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select Products</label>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                      {products.map(product => (
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
                                  selectedProducts: promotionForm.selectedProducts.filter(id => id !== product.id)
                                });
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{product.name} - ${product.basePrice.toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

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
                          <span className="text-sm">{branch.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowCreatePromotion(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Promotion
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
    </div>
  );
}
