'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/user-store';
import { applyDiscountToLabel, clearDiscountFromLabel } from '@/lib/label-discount';
import { db, logOut } from '@/lib/firebase';
import ProductModal from '@/components/modals/ProductModal';
import CategoryModal from '@/components/modals/CategoryModal';
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
  addDoc
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Package,
  Tag,
  AlertCircle,
  BarChart3,
  Store,
  Bell,
  Clock,
  Battery,
  RefreshCw,
  CheckCircle,
  XCircle,
  TrendingUp,
  Plus,
  Minus,
  Info,
  QrCode,
  Scan,
  Eye,
  ShoppingBag,
  User as UserIcon,
  ChevronDown,
  Download,
  Filter,
  Search,
  Upload,
  Edit,
  Trash2,
  Check,
  X,
  BarChart,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Lock,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateLabelsForBranch } from '@/lib/supermarket-setup';
import { makeProductCodeForVendor, makeSku, nextBranchSequence } from '@/lib/id-generator';

// INTERFACES
interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager?: string;
  companyId: string;
  status: 'active' | 'inactive';
}

interface Company {
  id: string;
  name: string;
  code?: string;
}

interface Product {
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
  productDetails?: Product;
}

interface DigitalLabel {
  id: string;
  labelId: string;
  labelCode?: string;
  productId: string | null;
  productName?: string;
  productSku?: string | null;
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

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  assignedBy: string;
  branchId: string;
}

interface IssueReport {
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
}

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  companyId: string;
  createdAt: Timestamp;
}

export default function StaffDashboard() {
  const router = useRouter();
  const { user: currentUser, clearUser, hasHydrated } = useUserStore();
  
  // States
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'inventory' | 'labels' | 'issues' | 'reports'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [branchProducts, setBranchProducts] = useState<BranchProduct[]>([]);
  const [labels, setLabels] = useState<DigitalLabel[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [labelGenerateCount, setLabelGenerateCount] = useState(6);
  const [promotionPercent, setPromotionPercent] = useState(10);
  const [labelCategoryFilter, setLabelCategoryFilter] = useState<Record<string, string>>({});
  const [labelLocationEdits, setLabelLocationEdits] = useState<Record<string, string>>({});
  const [discountInputs, setDiscountInputs] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [issueForm, setIssueForm] = useState({
    labelId: '',
    issue: '',
    priority: 'medium' as 'high' | 'medium' | 'low'
  });

  const [stockUpdateForm, setStockUpdateForm] = useState<{
    productId: string;
    change: number;
    reason?: string;
  } | null>(null);
  const productsForBranch = useMemo(() => {
    const map = new Map<string, Product>();
    branchProducts.forEach((bp) => {
      if (bp.productDetails) {
        map.set(bp.productDetails.id, bp.productDetails);
      }
    });
    return Array.from(map.values());
  }, [branchProducts]);
  const filteredBranchProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return branchProducts;
    return branchProducts.filter((bp) => {
      const fields = [
        bp.productDetails?.name,
        bp.productDetails?.sku,
        bp.productDetails?.category,
        bp.productDetails?.productCode,
      ];
      return fields.some((field) => field?.toLowerCase().includes(term));
    });
  }, [branchProducts, searchTerm]);
  const getLabelDisplayId = (label: DigitalLabel) => label.labelId || label.labelCode || label.id;
  const filteredLabels = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return labels;
    return labels.filter((label) => {
      const displayId = getLabelDisplayId(label);
      const fields = [
        displayId,
        label.productName,
        label.productSku,
        label.location,
      ];
      return fields.some((field) => field?.toLowerCase().includes(term));
    });
  }, [labels, searchTerm]);
  const sortedLabels = useMemo(() => {
    const items = [...filteredLabels];
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
  }, [filteredLabels]);

  // Redirect if not staff
  useEffect(() => {
    if (!hasHydrated) return;
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role !== 'staff') {
      if (currentUser.role === 'admin') router.push('/admin');
      if (currentUser.role === 'vendor') router.push('/vendor');
    }
  }, [currentUser, hasHydrated, router]);

  // Load staff data
  useEffect(() => {
    if (!hasHydrated) return;
    if (currentUser?.role === 'staff' && currentUser.branchId && currentUser.companyId) {
      loadStaffData();
    }
  }, [currentUser, hasHydrated]);

  const loadStaffData = async () => {
    if (!currentUser?.branchId || !currentUser.companyId) return;
    
    try {
      setLoading(true);
      
      // 0. Load company data
      const companyDoc = await getDoc(fsDoc(db, 'companies', currentUser.companyId));
      if (companyDoc.exists()) {
        setCompany({ id: companyDoc.id, ...companyDoc.data() } as Company);
      }

      // 1. Load branch data
      const branchDoc = await getDoc(fsDoc(db, 'branches', currentUser.branchId));
      if (branchDoc.exists()) {
        setBranch({ id: branchDoc.id, ...branchDoc.data() } as Branch);
      }

      // 2. Load branch products (only for this branch)
      const branchProductsQuery = query(
        collection(db, 'branch_products'),
        where('branchId', '==', currentUser.branchId),
        where('companyId', '==', currentUser.companyId)
      );
      const branchProductsSnapshot = await getDocs(branchProductsQuery);
      
      // Get product details for each branch product
      const branchProductsData = await Promise.all(
        branchProductsSnapshot.docs.map(async (docSnap) => {
          const bpData = docSnap.data();
          const productDoc = await getDoc(fsDoc(db, 'products', bpData.productId));
          const productDetails = productDoc.exists()
            ? ({ id: productDoc.id, ...(productDoc.data() as Product) } as Product)
            : undefined;
          
          return {
            id: docSnap.id,
            ...bpData,
            productDetails
          } as BranchProduct;
        })
      );
      setBranchProducts(branchProductsData);

      // 3. Load labels (only for this branch)
      const labelsQuery = query(
        collection(db, 'labels'),
        where('branchId', '==', currentUser.branchId),
        where('companyId', '==', currentUser.companyId)
      );
      const labelsSnapshot = await getDocs(labelsQuery);
      const labelsData = await Promise.all(
        labelsSnapshot.docs.map(async (docSnap) => {
          const labelData = docSnap.data() as any;
          const productId = labelData.productId as string | null | undefined;
          const productDoc = productId ? await getDoc(fsDoc(db, 'products', productId)) : null;
          const productData = productDoc && productDoc.exists() ? (productDoc.data() as any) : null;
          const battery = Number.isFinite(labelData.battery) ? Number(labelData.battery) : 0;
          return {
            id: docSnap.id,
            ...labelData,
            labelId: labelData.labelId ?? labelData.labelCode ?? docSnap.id,
            labelCode: labelData.labelCode ?? null,
            productId: productId ?? null,
            productName: productData?.name ?? labelData.productName ?? (productId ? 'Unknown Product' : 'Unassigned'),
            productSku: productData?.sku ?? labelData.productSku ?? null,
            branchId: labelData.branchId ?? currentUser.branchId ?? '',
            currentPrice: labelData.currentPrice ?? null,
            basePrice: labelData.basePrice ?? null,
            finalPrice: labelData.finalPrice ?? null,
            discountPercent: labelData.discountPercent ?? null,
            discountPrice: labelData.discountPrice ?? null,
            battery,
            status: labelData.status ?? 'inactive',
            lastSync: labelData.lastSync ?? null,
            location: labelData.location ?? ''
          } as DigitalLabel;
        })
      );
      setLabels(labelsData);

      // 4. Load categories (only for this company)
      const categoriesQuery = query(
        collection(db, 'categories'),
        where('companyId', '==', currentUser.companyId)
      );
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categoriesData = categoriesSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as any)
      })) as Category[];
      setCategories(categoriesData);

      // 5. Load tasks (disabled until dynamic tasks are implemented)
      setTasks([]);

      // 6. Load issues (only for this branch)
      const issuesQuery = query(
        collection(db, 'issue_reports'),
        where('branchId', '==', currentUser.branchId)
      );
      const issuesSnapshot = await getDocs(issuesQuery);
      const issuesData = await Promise.all(
        issuesSnapshot.docs.map(async (docSnap) => {
          const issueData = docSnap.data();
          const productId = issueData.productId as string | null | undefined;
          const productDoc = productId ? await getDoc(fsDoc(db, 'products', productId)) : null;
          return {
            id: docSnap.id,
            ...issueData,
            productName: productDoc && productDoc.exists()
              ? (productDoc.data() as any).name
              : productId
                ? 'Unknown Product'
                : 'Unknown Product'
          } as IssueReport;
        })
      );
      setIssues(issuesData);

    } catch (error) {
      console.error('Error loading staff data:', error);
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

  // Update stock
  const updateStock = async (
    productId: string,
    value: number,
    reason?: string,
    mode: 'adjust' | 'set' = 'adjust'
  ) => {
    if (!canUpdateStock) {
      alert('You do not have permission to update stock.');
      return;
    }
    if (!currentUser?.branchId || !currentUser.companyId) return;

    try {
      // Find the branch product
      const bpQuery = query(
        collection(db, 'branch_products'),
        where('productId', '==', productId),
        where('branchId', '==', currentUser.branchId)
      );
      const bpSnapshot = await getDocs(bpQuery);
      
      if (bpSnapshot.empty) {
        alert('Stock record not found for this product.');
        return;
      }

      const updates = bpSnapshot.docs.map((bpDoc) => {
        const bpData = bpDoc.data();
        const newStock = mode === 'set' ? value : bpData.stock + value;
        if (newStock < 0) {
          throw new Error('Stock cannot be negative.');
        }
        const change = newStock - bpData.stock;
        return {
          bpDoc,
          bpData,
          newStock,
          change,
        };
      });

      await Promise.all(
        updates.map(({ bpDoc, bpData, newStock }) =>
          updateDoc(fsDoc(db, 'branch_products', bpDoc.id), {
            stock: newStock,
            status: newStock <= 0 ? 'out-of-stock' :
              newStock <= bpData.minStock ? 'low-stock' : 'in-stock',
            lastUpdated: Timestamp.now()
          })
        )
      );

      await Promise.all(
        updates.map(({ newStock, change }) =>
          addDoc(collection(db, 'inventory_logs'), {
            productId,
            branchId: currentUser.branchId,
            companyId: currentUser.companyId,
            change,
            newStock,
            reason: reason || 'Manual adjustment',
            changedBy: currentUser.id,
            changedByName: currentUser.name,
            timestamp: Timestamp.now()
          })
        )
      );

      const updatesById = new Map(
        updates.map(({ bpDoc, bpData, newStock }) => [bpDoc.id, { bpData, newStock }])
      );
      setBranchProducts((prev) =>
        prev.map((bp) => {
          const update = updatesById.get(bp.id);
          if (!update) return bp;
          const { bpData, newStock } = update;
          return {
            ...bp,
            stock: newStock,
            status:
              newStock <= 0
                ? 'out-of-stock'
                : newStock <= bpData.minStock
                  ? 'low-stock'
                  : 'in-stock',
          };
        })
      );
      setStockUpdateForm(null);
      alert('Stock updated successfully!');
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock');
    }
  };

  const createProductFromStaff = async (productData: any) => {
    if (!canManageProducts) {
      alert('You do not have permission to create products.');
      return;
    }
    if (!currentUser?.companyId || !currentUser.branchId) return;

    try {
      const productSeq = await nextBranchSequence(currentUser.branchId, "nextProductNumber");
      const vendorCode = getCompanyDisplayCode();
      const productCode = productData.productCode?.trim() || makeProductCodeForVendor(vendorCode, productSeq);
      const sku = productData.sku?.trim() || makeSku(productSeq);

      const branchProductList = branchProducts
        .map((bp) => bp.productDetails)
        .filter(Boolean) as Product[];
      const productCodeConflict = branchProductList.some(
        (product) => (product.productCode || '').toLowerCase() === productCode.toLowerCase()
      );
      if (productCodeConflict) {
        alert('Product code already exists for this branch.');
        return;
      }
      const skuConflict = branchProductList.some(
        (product) => (product.sku || '').toLowerCase() === sku.toLowerCase()
      );
      if (skuConflict) {
        alert('SKU already exists for this branch.');
        return;
      }

      const productRef = await addDoc(collection(db, 'products'), {
        ...productData,
        productCode,
        sku,
        category: productData.category || 'General',
        companyId: currentUser.companyId,
        createdBy: currentUser.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      const stock = Number(productData.stock ?? 0);
      const minStock = Number(productData.minStock ?? 10);
      const status =
        stock <= 0
          ? 'out-of-stock'
          : stock <= minStock
            ? 'low-stock'
            : 'in-stock';

      await addDoc(collection(db, 'branch_products'), {
        productId: productRef.id,
        branchId: currentUser.branchId,
        companyId: currentUser.companyId,
        currentPrice: productData.basePrice,
        stock,
        minStock,
        status,
        lastUpdated: Timestamp.now()
      });

      await loadStaffData();
      alert(`Product "${productData.name}" created successfully!`);
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleGenerateLabels = async () => {
    if (!canManageLabels) {
      alert('You do not have permission to create labels.');
      return;
    }
    if (!currentUser?.companyId || !currentUser.branchId) return;

    try {
      const count = Math.max(1, Math.floor(Number(labelGenerateCount || 0)));
      if (!Number.isFinite(count)) {
        alert('Enter a valid number of labels.');
        return;
      }
      const result = await generateLabelsForBranch({
        companyId: currentUser.companyId,
        branchId: currentUser.branchId,
        count,
      });
      await loadStaffData();
      alert(`Created ${result.created} labels for this branch.`);
    } catch (error: any) {
      console.error('Error generating labels:', error);
      alert(error.message || 'Could not generate labels.');
    }
  };

  const getBranchPriceForProduct = (productId: string) => {
    const bp = branchProducts.find((item) => item.productId === productId);
    if (bp?.currentPrice != null) return Number(bp.currentPrice);
    const product = bp?.productDetails ?? productsForBranch.find((p) => p.id === productId);
    return Number(product?.basePrice ?? 0);
  };

  const assignProductToLabel = async (labelId: string, productId: string) => {
    if (!canManageLabels) {
      alert('You do not have permission to assign labels.');
      return;
    }
    const product = productsForBranch.find((p) => p.id === productId);
    if (!product) {
      alert('Select a valid product.');
      return;
    }
    const basePrice = getBranchPriceForProduct(productId);
    if (!basePrice) {
      alert('Set a product price before assigning this label.');
      return;
    }
    try {
      await updateDoc(fsDoc(db, 'labels', labelId), {
        productId,
        productName: product.name,
        productSku: product.sku,
        currentPrice: basePrice,
        basePrice,
        finalPrice: basePrice,
        lastSync: Timestamp.now(),
        status: 'syncing',
      });
      setLabels((prev) =>
        prev.map((label) =>
          label.id === labelId
            ? {
                ...label,
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
    } catch (error) {
      console.error('Error assigning product to label:', error);
      alert('Failed to assign product.');
    }
  };

  const updateLabelLocation = async (labelId: string) => {
    if (!canManageLabels) {
      alert('You do not have permission to update label locations.');
      return;
    }
    const nextLocation = (labelLocationEdits[labelId] ?? '').trim();
    if (!nextLocation) {
      alert('Enter a shelf or aisle location.');
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
      alert('Label location updated.');
    } catch (error) {
      console.error('Error updating label location:', error);
      alert('Failed to update location.');
    }
  };

  const clearLabelAssignment = async (labelId: string) => {
    if (!canManageLabels) return;
    if (!confirm('Clear product assignment for this label?')) return;
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
                currentPrice: null,
                basePrice: null,
                finalPrice: null,
                discountPercent: null,
                discountPrice: null,
                lastSync: Timestamp.now(),
                status: 'inactive',
              }
            : label
        )
      );
    } catch (error) {
      console.error('Error clearing label assignment:', error);
      alert('Failed to clear label.');
    }
  };

  const handleAutoAssignLabels = async () => {
    if (!canManageLabels) {
      alert('You do not have permission to assign labels.');
      return;
    }
    const unassignedLabels = labels.filter((label) => !label.productId);
    if (unassignedLabels.length === 0) {
      alert('All labels already have products.');
      return;
    }
    if (productsForBranch.length === 0) {
      alert('Create products before assigning labels.');
      return;
    }
    const usedProductIds = new Set(labels.map((label) => label.productId).filter(Boolean) as string[]);
    const availableProducts = productsForBranch.filter((product) => !usedProductIds.has(product.id));
    if (availableProducts.length === 0) {
      alert('All products are already assigned.');
      return;
    }
    const assignments = unassignedLabels.slice(0, availableProducts.length).map((label, index) => ({
      label,
      product: availableProducts[index],
    }));
    try {
      const now = Timestamp.now();
      await Promise.all(
        assignments.map(({ label, product }) => {
          const basePrice = getBranchPriceForProduct(product.id);
          return updateDoc(fsDoc(db, 'labels', label.id), {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            currentPrice: basePrice,
            basePrice,
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
          const basePrice = getBranchPriceForProduct(assignment.product.id);
          return {
            ...label,
            productId: assignment.product.id,
            productName: assignment.product.name,
            productSku: assignment.product.sku,
            currentPrice: basePrice,
            basePrice,
            finalPrice: basePrice,
            lastSync: now,
            status: 'syncing',
          };
        })
      );
      alert(`Assigned ${assignments.length} products to labels.`);
    } catch (error) {
      console.error('Error auto-assigning labels:', error);
      alert('Failed to auto-assign labels.');
    }
  };

  const deleteAllLabelsForBranch = async () => {
    if (!canManageLabels) return;
    if (!currentUser?.branchId) return;
    if (!confirm('Delete all labels for this branch?')) return;
    try {
      const branchLabels = labels.filter((label) => label.branchId === currentUser.branchId);
      await Promise.all(branchLabels.map((label) => deleteDoc(fsDoc(db, 'labels', label.id))));
      setLabels((prev) => prev.filter((label) => label.branchId !== currentUser.branchId));
    } catch (error) {
      console.error('Error deleting labels:', error);
      alert('Failed to delete labels.');
    }
  };

  const clearAllLabelsForBranch = async () => {
    if (!canManageLabels) return;
    if (!currentUser?.branchId) return;
    if (!confirm('Clear all labels for this branch?')) return;
    try {
      const branchLabels = labels.filter((label) => label.branchId === currentUser.branchId);
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
          label.branchId === currentUser.branchId
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
    } catch (error) {
      console.error('Error clearing labels:', error);
      alert('Failed to clear labels.');
    }
  };

  const openDigitalLabelsScreen = () => {
    if (!currentUser?.companyId || !currentUser.branchId) return;
    window.open(
      `/digital-labels?companyId=${currentUser.companyId}&branchId=${currentUser.branchId}`,
      '_blank'
    );
  };

  const applyPromotionToAllLabels = async () => {
    if (!canManagePromotions) {
      alert('You do not have permission to create promotions.');
      return;
    }

    const percent = Number(promotionPercent);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      alert('Enter a valid percent between 1 and 100.');
      return;
    }

    const targetLabels = labels.filter((label) => label.productId);
    if (targetLabels.length === 0) {
      alert('No labels available to apply this promotion.');
      return;
    }

    try {
      await Promise.all(
        targetLabels.map((label) => {
          const productId = label.productId as string;
          const basePrice = getBranchPriceForProduct(productId);
          return applyDiscountToLabel({
            labelId: label.id,
            basePrice,
            percent,
          });
        })
      );
      await loadStaffData();
      alert(`Applied ${percent}% promotion to ${targetLabels.length} labels.`);
    } catch (error: any) {
      console.error('Error applying promotion:', error);
      alert(error.message || 'Could not apply promotion.');
    }
  };

  const reloadCategories = async () => {
    if (!currentUser?.companyId) return;
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('companyId', '==', currentUser.companyId)
    );
    const categoriesSnapshot = await getDocs(categoriesQuery);
    const categoriesData = categoriesSnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as any)
    })) as Category[];
    setCategories(categoriesData);
  };

  const removeProductFromBranch = async (productId: string) => {
    if (!currentUser?.branchId) return;
    if (!confirm('Remove this product from your branch?')) return;

    try {
      const bpQuery = query(
        collection(db, 'branch_products'),
        where('productId', '==', productId),
        where('branchId', '==', currentUser.branchId)
      );
      const bpSnapshot = await getDocs(bpQuery);
      await Promise.all(bpSnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));

      const labelQuery = query(
        collection(db, 'labels'),
        where('branchId', '==', currentUser.branchId),
        where('productId', '==', productId)
      );
      const labelSnapshot = await getDocs(labelQuery);
      await Promise.all(
        labelSnapshot.docs.map((docSnap) =>
          updateDoc(docSnap.ref, {
            productId: null,
            productName: null,
            currentPrice: null,
            lastSync: Timestamp.now(),
            status: 'inactive'
          })
        )
      );

      await loadStaffData();
      alert('Product removed from this branch.');
    } catch (error: any) {
      console.error('Error removing product from branch:', error);
      alert(error.message || 'Could not remove product.');
    }
  };

  const deleteLabel = async (labelId: string) => {
    if (!confirm('Delete this label?')) return;
    try {
      await deleteDoc(fsDoc(db, 'labels', labelId));
      setLabels((prev) => prev.filter((label) => label.id !== labelId));
      alert('Label deleted.');
    } catch (error: any) {
      console.error('Error deleting label:', error);
      alert(error.message || 'Could not delete label.');
    }
  };

  // Report issue
  const reportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReportIssues) {
      alert('You do not have permission to report issues.');
      return;
    }
    if (!currentUser?.branchId || !currentUser.companyId) return;

    try {
      // Find the label
      const labelQuery = query(
        collection(db, 'labels'),
        where('labelId', '==', issueForm.labelId),
        where('branchId', '==', currentUser.branchId)
      );
      const labelSnapshot = await getDocs(labelQuery);
      
      if (labelSnapshot.empty) {
        alert('Label not found in this branch');
        return;
      }

      const labelDoc = labelSnapshot.docs[0];
      const labelData = labelDoc.data();

      // Create issue report
      await addDoc(collection(db, 'issue_reports'), {
        labelId: issueForm.labelId,
        productId: labelData.productId,
        issue: issueForm.issue,
        status: 'open',
        reportedAt: Timestamp.now(),
        priority: issueForm.priority,
        branchId: currentUser.branchId,
        companyId: currentUser.companyId,
        reportedBy: currentUser.id,
        reportedByName: currentUser.name
      });

      // Update label status
      await updateDoc(fsDoc(db, 'labels', labelDoc.id), {
        status: 'error'
      });

      // Refresh data
      await loadStaffData();
      setIssueForm({
        labelId: '',
        issue: '',
        priority: 'medium'
      });
      setShowReportIssue(false);
      alert('Issue reported successfully!');

    } catch (error) {
      console.error('Error reporting issue:', error);
      alert('Error reporting issue');
    }
  };

  // Complete task
  const completeTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: 'completed' } : task
    ));
  };

  const getCompanyDisplayCode = () => {
    const raw = company?.code || (company?.id ? `VE${company.id.slice(-3).toUpperCase()}` : 'VE000');
    return raw.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  };

  // Check staff permissions
  const staffPermissions = currentUser?.permissions ?? {
    canViewProducts: false,
    canUpdateStock: false,
    canReportIssues: false,
    canViewReports: false,
    canChangePrices: false,
    canCreateProducts: false,
    canCreateLabels: false,
    canCreatePromotions: false,
    maxPriceChange: 0,
  };
  const canViewProducts = staffPermissions.canViewProducts;
  const canUpdateStock = staffPermissions.canUpdateStock;
  const canReportIssues = staffPermissions.canReportIssues;
  const canViewReports = staffPermissions.canViewReports;
  const canManageProducts = Boolean(staffPermissions.canCreateProducts);
  const canManageLabels = Boolean(staffPermissions.canCreateLabels);
  const canManagePromotions = Boolean(staffPermissions.canCreatePromotions);
  const modalCategories = categories.length > 0 ? categories : [{ id: 'general', name: 'General' }];
  useEffect(() => {
    if (selectedTab === 'inventory' && !(canViewProducts || canManageProducts)) {
      setSelectedTab('dashboard');
      return;
    }
    if (selectedTab === 'labels' && !(canViewProducts || canReportIssues || canManageLabels)) {
      setSelectedTab('dashboard');
      return;
    }
    if (selectedTab === 'issues' && !canReportIssues) {
      setSelectedTab('dashboard');
      return;
    }
    if (selectedTab === 'reports' && !canViewReports) {
      setSelectedTab('dashboard');
    }
  }, [selectedTab, canViewProducts, canReportIssues, canViewReports]);

  if (!hasHydrated) {
    return null;
  }
  if (!currentUser || currentUser.role !== 'staff') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <div className="space-y-1">
                  <div className="h-0.5 w-6 bg-gray-600"></div>
                  <div className="h-0.5 w-6 bg-gray-600"></div>
                  <div className="h-0.5 w-6 bg-gray-600"></div>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{branch?.name || 'Staff Portal'}</p>
                  <p className="text-xs text-gray-500">{currentUser.position || 'Staff'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="relative p-2">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex overflow-x-auto border-t">
          <button
            onClick={() => setSelectedTab('dashboard')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              selectedTab === 'dashboard' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Dashboard
          </button>
          {canViewProducts && (
            <button
              onClick={() => setSelectedTab('inventory')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                selectedTab === 'inventory' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              Inventory
            </button>
          )}
          {(canViewProducts || canReportIssues || canManageLabels) && (
            <button
              onClick={() => setSelectedTab('labels')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                selectedTab === 'labels' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              Labels
            </button>
          )}
          {canReportIssues && (
            <button
              onClick={() => setSelectedTab('issues')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                selectedTab === 'issues' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              Issues
            </button>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen fixed left-0 top-0">
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">{branch?.name || 'Branch'}</h1>
                <p className="text-xs text-gray-400 font-medium">Staff Portal</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold">{currentUser.name?.charAt(0) || 'S'}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{currentUser.name}</p>
                <p className="text-xs text-gray-400">{currentUser.position || 'Store Staff'}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">{currentUser.email}</p>
                <p className="text-xs text-gray-400 mt-1">{branch?.name}</p>
              </div>
              <button className="p-2 hover:bg-gray-700 rounded-lg relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <button
              onClick={() => setSelectedTab('dashboard')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                selectedTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-md'
              )}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            {(canViewProducts || canManageProducts) && (
              <button
                onClick={() => setSelectedTab('inventory')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  selectedTab === 'inventory' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-md'
                )}
              >
                <Package className="h-5 w-5" />
                <span className="font-medium">Inventory</span>
              </button>
            )}

            {(canViewProducts || canReportIssues || canManageLabels) && (
              <button
                onClick={() => setSelectedTab('labels')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  selectedTab === 'labels' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-md'
                )}
              >
                <Tag className="h-5 w-5" />
                <span className="font-medium">Labels</span>
              </button>
            )}

            {canReportIssues && (
              <button
                onClick={() => setSelectedTab('issues')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  selectedTab === 'issues' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-md'
                )}
              >
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Issues</span>
              </button>
            )}

            {canViewReports && (
              <button
                onClick={() => setSelectedTab('reports')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  selectedTab === 'reports' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-md'
                )}
              >
                <BarChart className="h-5 w-5" />
                <span className="font-medium">Reports</span>
              </button>
            )}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-700 space-y-2">
            <button 
              onClick={loadStaffData}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              <span className="font-medium">Refresh Data</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-red-900/30 hover:text-red-100 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)}></div>
            <div className="absolute left-0 top-0 h-full w-64 bg-gray-900 text-white">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
                      <Store className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold">{branch?.name || 'Branch'}</h1>
                      <p className="text-xs text-gray-400">Staff Portal</p>
                    </div>
                  </div>
                  <button onClick={() => setShowMobileMenu(false)} className="p-2">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-400 mb-4">Welcome, {currentUser.name}</p>
                <div className="space-y-2">
                  <button onClick={() => { setSelectedTab('dashboard'); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 rounded-lg bg-gray-800">
                    Dashboard
                  </button>
                  <button onClick={() => { setSelectedTab('inventory'); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800">
                    Inventory
                  </button>
                  <button onClick={() => { setSelectedTab('labels'); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800">
                    Labels
                  </button>
                  <button onClick={() => { setSelectedTab('issues'); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800">
                    Issues
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          {/* Desktop Header */}
          <header className="hidden lg:block bg-white/80 backdrop-blur-sm border-b">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight capitalize">
                    {selectedTab === 'dashboard' && `${branch?.name || 'Staff'} Dashboard`}
                    {selectedTab === 'inventory' && 'Inventory Management'}
                    {selectedTab === 'labels' && 'Digital Labels'}
                    {selectedTab === 'issues' && 'Issue Reports'}
                    {selectedTab === 'reports' && 'Activity Reports'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {selectedTab === 'dashboard' && 'Overview of your tasks and store operations'}
                    {selectedTab === 'inventory' && `Manage ${branchProducts.length} products in stock`}
                    {selectedTab === 'labels' && `Monitor ${labels.length} digital labels`}
                    {selectedTab === 'issues' && `Track and resolve ${issues.length} reported issues`}
                    {selectedTab === 'reports' && 'View your activity and performance'}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search products, labels..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={loadStaffData}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 lg:p-8">
            {/* Dashboard Tab */}
            {selectedTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Dashboard Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-600">Welcome back, {currentUser.name}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-2 w-full sm:w-auto">
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                    <Button size="sm" className="flex items-center gap-2 w-full sm:w-auto">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white rounded-xl border p-4 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <span className="text-sm text-green-600 font-medium">+5%</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{branchProducts.length}</h3>
                    <p className="text-gray-600">Total Products</p>
                  </div>

                  <div className="bg-white rounded-xl border p-4 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                      <span className="text-sm text-green-600 font-medium">+2%</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {branchProducts.filter(p => p.status === 'in-stock').length}
                    </h3>
                    <p className="text-gray-600">In Stock</p>
                  </div>

                  <div className="bg-white rounded-xl border p-4 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                      </div>
                      <span className="text-sm text-red-600 font-medium">-3%</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {branchProducts.filter(p => p.status === 'low-stock').length}
                    </h3>
                    <p className="text-gray-600">Low Stock</p>
                  </div>

                  <div className="bg-white rounded-xl border p-4 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Tag className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                      </div>
                      <span className="text-sm text-green-600 font-medium">+8%</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{labels.length}</h3>
                    <p className="text-gray-600">Active Labels</p>
                  </div>
                </div>

                {/* Tasks and Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {tasks.length > 0 && (
                    <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
                    </div>
                      <div className="space-y-4">
                        {tasks.map((task) => (
                          <div key={task.id} className="flex items-start gap-4 p-4 rounded-lg border">
                            <div className={`h-3 w-3 rounded-full mt-2 ${
                              task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>Due: {task.dueDate}</span>
                                <span>By: {task.assignedBy}</span>
                              </div>
                            </div>
                            {task.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => completeTask(task.id)}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Alerts & Issues</h3>
                      <Button size="sm" variant="outline">View All</Button>
                    </div>
                    <div className="space-y-4">
                      {issues.slice(0, 3).map((issue) => (
                        <div key={issue.id} className="flex items-start gap-4 p-4 rounded-lg border">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            issue.priority === 'high' ? 'bg-red-100' :
                            issue.priority === 'medium' ? 'bg-yellow-100' :
                            'bg-green-100'
                          }`}>
                            <AlertCircle className={`h-5 w-5 ${
                              issue.priority === 'high' ? 'text-red-600' :
                              issue.priority === 'medium' ? 'text-yellow-600' :
                              'text-green-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{issue.issue}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Label: {issue.labelId} / Product: {issue.productName}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Reported: {issue.reportedAt?.toDate().toLocaleDateString()}</span>
                              <span className={`px-2 py-1 rounded-full ${
                                issue.status === 'open' ? 'bg-red-100 text-red-700' :
                                issue.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {issue.status}
                              </span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">View</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {selectedTab === 'inventory' && (canViewProducts || canManageProducts) && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Inventory Management</h3>
                      <p className="text-gray-600">Monitor and update product stock levels</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" /> Filter
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" /> Export
                      </Button>
                      {canManageProducts && (
                        <Button onClick={() => setShowProductModal(true)}>
                          <Plus className="h-4 w-4 mr-2" /> Add Product
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                  <div className="p-6 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Categories ({categories.length})</h4>
                        <p className="text-sm text-gray-600">Organize products by category.</p>
                      </div>
                      {canManageProducts && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedCategory(null);
                            setShowCategoryModal(true);
                          }}
                        >
                          <Tag className="h-4 w-4 mr-2" /> New Category
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="divide-y">
                    {categories.length === 0 ? (
                      <div className="p-6 text-sm text-gray-600">
                        No categories yet.
                      </div>
                    ) : (
                      categories.map((cat) => (
                        <div key={cat.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="h-3 w-3 rounded-full bg-gray-300" />
                            <div className="font-medium text-gray-900">{cat.name}</div>
                          </div>
                          {canManageProducts && (
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
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SKU</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Min Stock</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredBranchProducts.map((bp) => (
                          <tr key={bp.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{bp.productDetails?.name}</p>
                                  <p className="text-sm text-gray-500">{bp.productDetails?.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                {bp.productDetails?.sku}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-lg">{bp.stock}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-gray-600">{bp.minStock}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-semibold",
                                bp.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                                bp.status === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              )}>
                                {bp.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  disabled={!canUpdateStock}
                                  onClick={() => updateStock(bp.productId, 10, 'Restocked', 'adjust')}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  disabled={!canUpdateStock}
                                  onClick={() => updateStock(bp.productId, -5, 'Sold', 'adjust')}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  disabled={!canUpdateStock}
                                  onClick={() => setStockUpdateForm({
                                    productId: bp.productId,
                                    change: bp.stock,
                                    reason: ''
                                  })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {canManageProducts && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-rose-600 hover:text-rose-700"
                                    onClick={() => removeProductFromBranch(bp.productId)}
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

            {/* Labels Tab */}
            {selectedTab === 'labels' && (canViewProducts || canReportIssues || canManageLabels) && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Digital Label Status - {branch?.name}</h3>

                    {(canManageLabels || canManagePromotions) && (
                      <div className="flex flex-col lg:flex-row gap-4 mb-6">
                        {canManageLabels && (
                          <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">Create labels</p>
                              <p className="text-xs text-gray-500">Generate new labels for this branch.</p>
                            </div>
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              value={labelGenerateCount}
                              onChange={(e) => setLabelGenerateCount(Number(e.target.value || 1))}
                              className="w-24 bg-white"
                            />
                            <Button onClick={handleGenerateLabels}>
                              Generate
                            </Button>
                          </div>
                        )}
                        {canManageLabels && (
                          <div className="flex flex-1 items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Label actions</p>
                              <p className="text-xs text-gray-500">Assign or remove branch labels.</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" onClick={handleAutoAssignLabels}>
                                Auto-Assign Products
                              </Button>
                              <Button variant="outline" onClick={clearAllLabelsForBranch}>
                                Clear All Labels
                              </Button>
                              <Button variant="outline" onClick={deleteAllLabelsForBranch}>
                                Delete All Labels
                              </Button>
                            </div>
                          </div>
                        )}
                        {canManagePromotions && (
                          <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">Branch promotion</p>
                              <p className="text-xs text-gray-500">Apply a percent discount to all labels.</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                value={promotionPercent}
                                onChange={(e) => setPromotionPercent(Number(e.target.value || 0))}
                                className="w-24 bg-white"
                              />
                              <span className="text-sm text-gray-600">%</span>
                            </div>
                            <Button onClick={applyPromotionToAllLabels}>
                              Apply
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {(canManageLabels || canManagePromotions) && (
                      <div className="mb-6 flex justify-end">
                        <Button variant="outline" onClick={openDigitalLabelsScreen}>
                          Open Digital Labels Screen
                        </Button>
                      </div>
                    )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedLabels.map((label) => (
                      <div key={label.id} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{label.labelId || label.labelCode || label.id}</h4>
                            <p className="text-sm text-gray-600">{label.productName || 'Unassigned'}</p>
                            <p className="text-xs text-gray-500">
                              {label.location ? `Shelf/Aisle: ${label.location}` : 'Shelf/Aisle: Not set'}
                            </p>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold",
                            label.status === 'active' ? 'bg-green-100 text-green-800' :
                            label.status === 'low-battery' ? 'bg-yellow-100 text-yellow-800' :
                            label.status === 'syncing' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          )}>
                            {label.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Current Price:</span>
                            <div className="text-right">
                              <span className="font-bold">
                                {Number.isFinite(label.finalPrice)
                                  ? `$${Number(label.finalPrice).toFixed(2)}`
                                  : Number.isFinite(label.currentPrice)
                                    ? `$${Number(label.currentPrice).toFixed(2)}`
                                    : '--'}
                              </span>
                              {Number.isFinite(label.basePrice) &&
                                Number.isFinite(label.finalPrice) &&
                                Number(label.finalPrice) < Number(label.basePrice) && (
                                  <div className="text-xs text-gray-500 line-through">
                                    ${Number(label.basePrice).toFixed(2)}
                                  </div>
                                )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Battery:</span>
                            <span className={cn(
                              "font-medium",
                              label.battery < 20 ? 'text-red-600' :
                              label.battery < 50 ? 'text-yellow-600' :
                              'text-green-600'
                            )}>
                              {label.battery}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Last Sync:</span>
                            <span className="text-sm text-gray-500">
                              {label.lastSync?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t space-y-3">
                          {canManageLabels && (
                            <div className="space-y-3">
                              <div className="grid gap-2">
                                <div className="text-xs font-medium text-gray-600">Shelf / Aisle</div>
                                <div className="flex gap-2">
                                  <Input
                                    value={labelLocationEdits[label.id] ?? label.location ?? ''}
                                    onChange={(e) =>
                                      setLabelLocationEdits((prev) => ({
                                        ...prev,
                                        [label.id]: e.target.value,
                                      }))
                                    }
                                    className="bg-white text-gray-900 placeholder:text-gray-400"
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
                                <div className="text-xs font-medium text-gray-600">Assign product</div>
                                <select
                                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                                  value={labelCategoryFilter[label.id] || ''}
                                  onChange={(e) =>
                                    setLabelCategoryFilter((prev) => ({
                                      ...prev,
                                      [label.id]: e.target.value,
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
                                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                                  value={label.productId || ''}
                                  onChange={(e) => {
                                    const productId = e.target.value;
                                    if (!productId) return;
                                    assignProductToLabel(label.id, productId);
                                  }}
                                >
                                  <option value="">Select product...</option>
                                  {(labelCategoryFilter[label.id]
                                    ? productsForBranch.filter((p) => p.category === labelCategoryFilter[label.id])
                                    : productsForBranch
                                  ).map((product) => (
                                    <option key={product.id} value={product.id}>
                                      {product.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
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
                                  className="bg-white text-sm"
                                />
                                <Button
                                  onClick={async () => {
                                    const percent = discountInputs[label.id];
                                    if (!percent || percent <= 0 || percent > 100) {
                                      alert('Enter a value between 1 and 100.');
                                      return;
                                    }
                                    if (!label.productId) {
                                      alert('Assign a product before applying a discount.');
                                      return;
                                    }
                                    const basePrice = getBranchPriceForProduct(label.productId);
                                    if (!basePrice) {
                                      alert('Set a base price first.');
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
                                    } catch (error) {
                                      console.error('Error applying label discount:', error);
                                      alert('Failed to apply discount.');
                                    }
                                  }}
                                >
                                  Apply
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={async () => {
                                    if (!label.productId) {
                                      alert('Assign a product before clearing.');
                                      return;
                                    }
                                    const basePrice = getBranchPriceForProduct(label.productId);
                                    if (!basePrice) {
                                      alert('Set a base price first.');
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
                                    } catch (error) {
                                      console.error('Error clearing label discount:', error);
                                      alert('Failed to clear discount.');
                                    }
                                  }}
                                >
                                  Clear
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Button variant="outline" onClick={() => clearLabelAssignment(label.id)}>
                                  Clear Label
                                </Button>
                                <Button
                                  variant="outline"
                                  className="text-rose-600 hover:text-rose-700"
                                  onClick={() => deleteLabel(label.id)}
                                >
                                  Delete Label
                                </Button>
                              </div>
                              <a
                                className="block text-xs text-blue-600 underline"
                                href={`/digital-labels/${label.id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open Label Screen
                              </a>
                            </div>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            disabled={!canReportIssues}
                            onClick={() => {
                              setIssueForm({
                                labelId: label.labelId || label.labelCode || label.id,
                                issue: '',
                                priority: 'medium'
                              });
                              setShowReportIssue(true);
                            }}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" /> Report Issue
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Issues Tab */}
            {selectedTab === 'issues' && canReportIssues && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Issue Reports</h3>
                      <p className="text-gray-600">Track and resolve reported label issues</p>
                    </div>
                    <Button onClick={() => setShowReportIssue(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Report New Issue
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Label ID</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Issue</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Priority</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Reported</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {issues.map((issue) => (
                          <tr key={issue.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium text-gray-900">{issue.labelId}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{issue.productName}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700">{issue.issue}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                issue.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              )}>
                                {issue.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={cn(
                                "px-2 py-1 rounded text-xs font-medium",
                                issue.priority === 'high' ? 'bg-red-100 text-red-800' :
                                issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              )}>
                                {issue.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {issue.reportedAt?.toDate().toLocaleString() || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {selectedTab === 'reports' && canViewReports && (
              <div className="bg-white rounded-xl border p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-xl p-6">
                    <h4 className="font-semibold mb-4">Stock Summary</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Total Products:</span>
                        <span className="font-bold">{branchProducts.length}</span>
                      </div>
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
                  
                  <div className="border rounded-xl p-6">
                    <h4 className="font-semibold mb-4">Label Status</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Total Labels:</span>
                        <span className="font-bold">{labels.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Active:</span>
                        <span className="font-bold text-green-600">
                          {labels.filter(l => l.status === 'active').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Low Battery:</span>
                        <span className="font-bold text-yellow-600">
                          {labels.filter(l => l.status === 'low-battery').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Issues:</span>
                        <span className="font-bold text-red-600">
                          {labels.filter(l => l.status === 'error').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Report Issue Modal */}
      {showReportIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <h2 className="text-xl font-bold text-gray-900">Report Issue</h2>
                </div>
                <button onClick={() => setShowReportIssue(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Report a problem with a digital label</p>
            </div>

            <form onSubmit={reportIssue} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Label ID *</label>
                  <select
                    value={issueForm.labelId}
                    onChange={(e) => setIssueForm({...issueForm, labelId: e.target.value})}
                    className="w-full border rounded-lg bg-white px-3 py-2 text-gray-900"
                    required
                  >
                    <option value="">Select label...</option>
                    {sortedLabels
                      .filter((label) => label.branchId === currentUser.branchId && label.productId)
                      .map((label) => (
                        <option key={label.id} value={label.labelId || label.labelCode || label.id}>
                          {label.labelId || label.labelCode || label.id} — {label.productName || 'Unassigned'}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Issue Description *</label>
                  <textarea
                    value={issueForm.issue}
                    onChange={(e) => setIssueForm({...issueForm, issue: e.target.value})}
                    className="w-full border rounded-lg bg-white px-3 py-2 h-24 text-gray-900 placeholder:text-gray-400"
                    placeholder="Describe the issue (e.g., Wrong price, Blank screen, Low battery)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={issueForm.priority}
                    onChange={(e) => setIssueForm({...issueForm, priority: e.target.value as any})}
                    className="w-full border rounded-lg bg-white px-3 py-2 text-gray-900"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowReportIssue(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Report Issue
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {stockUpdateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Update Stock</h2>
                </div>
                <button onClick={() => setStockUpdateForm(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Update stock quantity</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (stockUpdateForm.change !== 0) {
                updateStock(stockUpdateForm.productId, stockUpdateForm.change, stockUpdateForm.reason, 'set');
              }
            }} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">New Stock *</label>
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setStockUpdateForm({
                        ...stockUpdateForm,
                        change: stockUpdateForm.change - 1
                      })}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={stockUpdateForm.change}
                      onChange={(e) => setStockUpdateForm({
                        ...stockUpdateForm,
                        change: parseInt(e.target.value) || 0
                      })}
                      className="text-center"
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setStockUpdateForm({
                        ...stockUpdateForm,
                        change: stockUpdateForm.change + 1
                      })}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Set the final stock value for this branch.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Reason (Optional)</label>
                  <Input
                    value={stockUpdateForm.reason || ''}
                    onChange={(e) => setStockUpdateForm({
                      ...stockUpdateForm,
                      reason: e.target.value
                    })}
                    placeholder="e.g., Restocked, Sold, Damaged"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setStockUpdateForm(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        categories={modalCategories}
        onSubmit={createProductFromStaff}
      />

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        companyId={currentUser?.companyId || ''}
        category={selectedCategory}
        onCategoryChange={reloadCategories}
      />
    </div>
  );
}
