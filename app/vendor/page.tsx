'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/user-store';
import { auth, db, logOut } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, updateDoc } from 'firebase/firestore';
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
  Upload
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  position: string;
  branch: string;
  status: 'active' | 'inactive';
  permissions: {
    canViewProducts: boolean;
    canUpdateStock: boolean;
    canReportIssues: boolean;
    canViewReports: boolean;
    canChangePrices: boolean;
    maxPriceChange?: number;
  };
  lastLogin?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: string;
}

interface DigitalLabel {
  id: string;
  labelId: string;
  productName: string;
  location: string;
  battery: number;
  status: 'active' | 'inactive' | 'low-battery' | 'error';
  lastSync: string;
}

export default function VendorDashboard() {
  const router = useRouter();
  const { user: currentUser, clearUser } = useUserStore();
  
  // States
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'products' | 'staff' | 'labels' | 'promotions' | 'reports'>('dashboard');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [labels, setLabels] = useState<DigitalLabel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateStaff, setShowCreateStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState<StaffMember | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<string | null>(null);
  
  // Form states
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    position: 'Cashier',
    branch: 'main',
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

  // Load data
  useEffect(() => {
    if (currentUser?.role === 'vendor') {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      // Mock data for demo - replace with actual Firestore calls
      setStaffMembers([
        {
          id: '1',
          name: 'John Smith',
          email: 'john@store.com',
          position: 'Store Manager',
          branch: 'Downtown Store',
          status: 'active',
          permissions: {
            canViewProducts: true,
            canUpdateStock: true,
            canReportIssues: true,
            canViewReports: true,
            canChangePrices: true,
            maxPriceChange: 50
          },
          lastLogin: '2024-01-12 14:30'
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@store.com',
          position: 'Cashier',
          branch: 'Uptown Store',
          status: 'active',
          permissions: {
            canViewProducts: true,
            canUpdateStock: true,
            canReportIssues: true,
            canViewReports: false,
            canChangePrices: false
          },
          lastLogin: '2024-01-13 09:15'
        }
      ]);

      setProducts([
        {
          id: '1',
          name: 'Premium Coffee Beans',
          sku: 'COF-001',
          category: 'Beverages',
          price: 12.99,
          stock: 45,
          minStock: 20,
          status: 'in-stock',
          lastUpdated: '2024-01-13'
        },
        {
          id: '2',
          name: 'Organic Milk',
          sku: 'DAI-001',
          category: 'Dairy',
          price: 3.99,
          stock: 15,
          minStock: 25,
          status: 'low-stock',
          lastUpdated: '2024-01-13'
        }
      ]);

      setLabels([
        {
          id: '1',
          labelId: 'DL-001',
          productName: 'Premium Coffee Beans',
          location: 'Aisle 3, Shelf B',
          battery: 85,
          status: 'active',
          lastSync: '2024-01-13 10:30'
        },
        {
          id: '2',
          labelId: 'DL-002',
          productName: 'Organic Milk',
          location: 'Aisle 5, Shelf A',
          battery: 45,
          status: 'low-battery',
          lastSync: '2024-01-13 09:45'
        }
      ]);

    } catch (error) {
      console.error('Error loading data:', error);
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
    try {
      // 1. Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        staffForm.email,
        staffForm.password
      );

      const userId = userCredential.user.uid;

      // 2. Create staff document
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: staffForm.email,
        name: staffForm.name,
        role: 'staff',
        companyId: currentUser?.companyId,
        branch: staffForm.branch,
        position: staffForm.position,
        permissions: staffForm.permissions,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: 'vendor'
      });

      // Refresh data
      await loadData();
      
      // Reset form and close modal
      setStaffForm({
        name: '',
        email: '',
        position: 'Cashier',
        branch: 'main',
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

  // Reset staff password
  const resetStaffPassword = async (staffId: string) => {
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      // In production, you would use Firebase Admin SDK or call a cloud function
      // For demo, we'll just show an alert
      alert(`Password reset for staff ID: ${staffId}\nNew password: ${resetPasswordForm.newPassword}`);
      
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
      
      // Update in Firestore
      // await updateDoc(doc(db, 'users', staffId), { status: newStatus });
      
      // Update local state
      setStaffMembers(staffMembers.map(staff => 
        staff.id === staffId ? { ...staff, status: newStatus } : staff
      ));
      
      alert(`Staff status updated to ${newStatus}`);
      
    } catch (error) {
      console.error('Error updating staff status:', error);
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
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Digital Label</h1>
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
              <p className="text-xs text-gray-400">Vendor Account</p>
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
            <span>Products</span>
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
            <span>Staff Management</span>
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
            <span>Digital Labels</span>
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
            <span>Promotions</span>
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
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white">
            <HelpCircle className="h-5 w-5" />
            <span>Help & Support</span>
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
                  {selectedTab === 'dashboard' && 'Dashboard'}
                  {selectedTab === 'products' && 'Product Management'}
                  {selectedTab === 'staff' && 'Staff Management'}
                  {selectedTab === 'labels' && 'Digital Labels'}
                  {selectedTab === 'promotions' && 'Promotions'}
                  {selectedTab === 'reports' && 'Reports'}
                </h1>
                <p className="text-gray-600">
                  {selectedTab === 'dashboard' && 'Overview of your retail operations'}
                  {selectedTab === 'products' && 'Manage products and inventory'}
                  {selectedTab === 'staff' && 'Create and manage staff accounts'}
                  {selectedTab === 'labels' && 'Monitor and manage digital price labels'}
                  {selectedTab === 'promotions' && 'Create sales and promotions'}
                  {selectedTab === 'reports' && 'View business analytics'}
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
                
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" /> Export
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
                      <p className="text-sm text-gray-500 mt-1">{products.filter(p => p.status === 'low-stock').length} low stock</p>
                    </div>
                    <Package className="h-10 w-10 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Staff</p>
                      <p className="text-3xl font-bold mt-2">{staffMembers.filter(s => s.status === 'active').length}</p>
                      <p className="text-sm text-gray-500 mt-1">Total: {staffMembers.length}</p>
                    </div>
                    <Users className="h-10 w-10 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Labels</p>
                      <p className="text-3xl font-bold mt-2">{labels.filter(l => l.status === 'active').length}</p>
                      <p className="text-sm text-gray-500 mt-1">{labels.filter(l => l.status === 'low-battery').length} low battery</p>
                    </div>
                    <Tag className="h-10 w-10 text-purple-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Today's Sales</p>
                      <p className="text-3xl font-bold mt-2">$2,450</p>
                      <p className="text-sm text-green-600 mt-1">+12% from yesterday</p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                    <Plus className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <span className="text-sm font-medium">Add Product</span>
                  </button>
                  <button 
                    onClick={() => setSelectedTab('staff')}
                    className="p-4 border rounded-lg hover:bg-gray-50 text-center"
                  >
                    <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <span className="text-sm font-medium">Add Staff</span>
                  </button>
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                    <Tag className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <span className="text-sm font-medium">Register Label</span>
                  </button>
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                    <BarChart3 className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <span className="text-sm font-medium">View Reports</span>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Staff Activity</h3>
                  <div className="space-y-4">
                    {staffMembers.slice(0, 3).map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{staff.name}</p>
                          <p className="text-sm text-gray-500">{staff.position} • {staff.branch}</p>
                        </div>
                        <span className="text-sm text-gray-500">{staff.lastLogin}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <h3 className="text-lg font-semibold mb-4">Label Status</h3>
                  <div className="space-y-3">
                    {labels.map((label) => (
                      <div key={label.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${
                            label.status === 'active' ? 'bg-green-500' :
                            label.status === 'low-battery' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}></div>
                          <div>
                            <p className="font-medium">{label.labelId}</p>
                            <p className="text-sm text-gray-500">{label.productName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{label.battery}%</p>
                          <p className="text-xs text-gray-500">Battery</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Staff Management Tab */}
          {selectedTab === 'staff' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Staff Management</h3>
                    <p className="text-gray-600">Create and manage staff accounts for your stores</p>
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
                            <span className="text-sm text-gray-900">{staff.branch}</span>
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
                                onClick={() => setShowEditStaff(staff)}
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

          {/* Products Tab - You can add later */}
          {selectedTab === 'products' && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4">Product Management</h3>
              <p className="text-gray-600">This section is under development...</p>
            </div>
          )}

          {/* Other tabs - similar structure */}
          {selectedTab === 'labels' && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4">Digital Label Management</h3>
              <p className="text-gray-600">This section is under development...</p>
            </div>
          )}

          {selectedTab === 'promotions' && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4">Promotion Management</h3>
              <p className="text-gray-600">This section is under development...</p>
            </div>
          )}

          {selectedTab === 'reports' && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4">Business Reports</h3>
              <p className="text-gray-600">This section is under development...</p>
            </div>
          )}
        </main>
      </div>

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
                    value={staffForm.branch}
                    onChange={(e) => setStaffForm({...staffForm, branch: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="main">Main Store</option>
                    <option value="downtown">Downtown Store</option>
                    <option value="uptown">Uptown Store</option>
                    <option value="west">West Branch</option>
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
