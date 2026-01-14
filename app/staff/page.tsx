'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/user-store';
import { db, logOut } from '@/lib/firebase';
import { 
  doc as fsDoc,
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc,
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

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
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
  productId: string;
  productName?: string;
  branchId: string;
  currentPrice: number;
  battery: number;
  status: 'active' | 'inactive' | 'low-battery' | 'error';
  lastSync: Timestamp;
  location: string;
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

export default function StaffDashboard() {
  const router = useRouter();
  const { user: currentUser, clearUser } = useUserStore();
  
  // States
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'inventory' | 'labels' | 'issues' | 'reports'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [branchProducts, setBranchProducts] = useState<BranchProduct[]>([]);
  const [labels, setLabels] = useState<DigitalLabel[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  
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

  // Redirect if not staff
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role !== 'staff') {
      if (currentUser.role === 'admin') router.push('/admin');
      if (currentUser.role === 'vendor') router.push('/vendor');
    }
  }, [currentUser, router]);

  // Load staff data
  useEffect(() => {
    if (currentUser?.role === 'staff' && currentUser.branchId && currentUser.companyId) {
      loadStaffData();
    }
  }, [currentUser]);

  const loadStaffData = async () => {
    if (!currentUser?.branchId || !currentUser.companyId) return;
    
    try {
      setLoading(true);
      
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
          const productDetails = productDoc.exists() ? productDoc.data() as Product : undefined;
          
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
          const labelData = docSnap.data();
          const productDoc = await getDoc(fsDoc(db, 'products', labelData.productId));
          return {
            id: docSnap.id,
            ...labelData,
            labelId: labelData.labelId ?? labelData.labelCode ?? docSnap.id,
            productName: productDoc.exists() ? (productDoc.data() as any).name : 'Unknown Product'
          } as DigitalLabel;
        })
      );
      setLabels(labelsData);

      // 4. Load tasks (mock for now - can be extended to Firestore)
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Restock milk in Aisle 4',
          description: 'Organic milk is running low, needs restocking',
          priority: 'high',
          status: 'pending',
          dueDate: 'Today, 4 PM',
          assignedBy: 'Store Manager',
          branchId: currentUser.branchId
        },
        {
          id: '2',
          title: 'Check label battery #DL-002',
          description: 'Label showing low battery warning',
          priority: 'medium',
          status: 'in-progress',
          dueDate: 'Tomorrow',
          assignedBy: 'System Alert',
          branchId: currentUser.branchId
        },
      ];
      setTasks(mockTasks);

      // 5. Load issues (only for this branch)
      const issuesQuery = query(
        collection(db, 'issue_reports'),
        where('branchId', '==', currentUser.branchId)
      );
      const issuesSnapshot = await getDocs(issuesQuery);
      const issuesData = await Promise.all(
        issuesSnapshot.docs.map(async (docSnap) => {
          const issueData = docSnap.data();
          const productDoc = await getDoc(fsDoc(db, 'products', issueData.productId));
          return {
            id: docSnap.id,
            ...issueData,
            productName: productDoc.exists() ? (productDoc.data() as any).name : 'Unknown Product'
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
  const updateStock = async (productId: string, change: number, reason?: string) => {
    if (!currentUser?.branchId || !currentUser.companyId) return;

    try {
      // Find the branch product
      const bpQuery = query(
        collection(db, 'branch_products'),
        where('productId', '==', productId),
        where('branchId', '==', currentUser.branchId)
      );
      const bpSnapshot = await getDocs(bpQuery);
      
      if (!bpSnapshot.empty) {
        const bpDoc = bpSnapshot.docs[0];
        const bpData = bpDoc.data();
        const newStock = bpData.stock + change;
        
        // Update stock
        await updateDoc(fsDoc(db, 'branch_products', bpDoc.id), {
          stock: newStock,
          status: newStock <= 0 ? 'out-of-stock' : 
                  newStock <= bpData.minStock ? 'low-stock' : 'in-stock',
          lastUpdated: Timestamp.now()
        });

        // Log the stock change
        await addDoc(collection(db, 'inventory_logs'), {
          productId,
          branchId: currentUser.branchId,
          companyId: currentUser.companyId,
          change,
          newStock,
          reason: reason || 'Manual adjustment',
          changedBy: currentUser.id,
          changedByName: currentUser.name,
          timestamp: Timestamp.now()
        });

        // Refresh data
        await loadStaffData();
        setStockUpdateForm(null);
        alert('Stock updated successfully!');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock');
    }
  };

  // Report issue
  const reportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
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

  // Check staff permissions
  const canUpdateStock = currentUser ? true : false; // You can check actual permissions from user data
  const canReportIssues = currentUser ? true : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading your dashboard</p>
          <p className="text-gray-500">Preparing your tasks and reports...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'staff') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
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

            {canUpdateStock && (
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-600">Welcome back, {currentUser.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                    <Button size="sm" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-sm text-green-600 font-medium">+5%</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{branchProducts.length}</h3>
                    <p className="text-gray-600">Total Products</p>
                  </div>

                  <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="text-sm text-green-600 font-medium">+2%</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {branchProducts.filter(p => p.status === 'in-stock').length}
                    </h3>
                    <p className="text-gray-600">In Stock</p>
                  </div>

                  <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                      </div>
                      <span className="text-sm text-red-600 font-medium">-3%</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {branchProducts.filter(p => p.status === 'low-stock').length}
                    </h3>
                    <p className="text-gray-600">Low Stock</p>
                  </div>

                  <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Tag className="h-6 w-6 text-purple-600" />
                      </div>
                      <span className="text-sm text-green-600 font-medium">+8%</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{labels.length}</h3>
                    <p className="text-gray-600">Active Labels</p>
                  </div>
                </div>

                {/* Tasks and Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tasks */}
                  <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
                      <Button size="sm" variant="outline">View All</Button>
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

                  {/* Alerts */}
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
                              Label: {issue.labelId} • Product: {issue.productName}
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
            {selectedTab === 'inventory' && (
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
                          className="pl-10 w-64"
                        />
                      </div>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" /> Filter
                      </Button>
                    </div>
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
                        {branchProducts.map((bp) => (
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
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
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
                                  onClick={() => updateStock(bp.productId, 10, 'Restocked')}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateStock(bp.productId, -5, 'Sold')}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setStockUpdateForm({
                                    productId: bp.productId,
                                    change: 0,
                                    reason: ''
                                  })}
                                >
                                  <Edit className="h-4 w-4" />
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

            {/* Labels Tab */}
            {selectedTab === 'labels' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Digital Label Status - {branch?.name}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {labels.map((label) => (
                      <div key={label.id} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{label.labelId}</h4>
                            <p className="text-sm text-gray-600">{label.productName}</p>
                            <p className="text-xs text-gray-500">{label.location}</p>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold",
                            label.status === 'active' ? 'bg-green-100 text-green-800' :
                            label.status === 'low-battery' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          )}>
                            {label.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Current Price:</span>
                            <span className="font-bold">${label.currentPrice.toFixed(2)}</span>
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

                        <div className="pt-4 border-t">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => {
                              setIssueForm({
                                labelId: label.labelId,
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
                              <span className="font-medium">{issue.labelId}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm">{issue.productName}</span>
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
            {selectedTab === 'reports' && (
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
                  <Input
                    value={issueForm.labelId}
                    onChange={(e) => setIssueForm({...issueForm, labelId: e.target.value})}
                    placeholder="e.g., DL-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Issue Description *</label>
                  <textarea
                    value={issueForm.issue}
                    onChange={(e) => setIssueForm({...issueForm, issue: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 h-24"
                    placeholder="Describe the issue (e.g., Wrong price, Blank screen, Low battery)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={issueForm.priority}
                    onChange={(e) => setIssueForm({...issueForm, priority: e.target.value as any})}
                    className="w-full border rounded-lg px-3 py-2"
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
                updateStock(stockUpdateForm.productId, stockUpdateForm.change, stockUpdateForm.reason);
              }
            }} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Quantity Change *</label>
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
                    Positive number to add stock, negative to remove
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
    </div>
  );
}
