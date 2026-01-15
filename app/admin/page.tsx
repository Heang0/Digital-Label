// app/admin/page.tsx - Professional Admin Dashboard
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/user-store';
import { auth, db, logOut } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { makeVendorCode, nextGlobalSequence } from '@/lib/id-generator';
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
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Users, 
  Tag, 
  Battery, 
  TrendingUp,
  AlertCircle,
  Store,
  Shield,
  X,
  Plus,
  Mail,
  User as UserIcon,
  Phone,
  MapPin,
  DollarSign,
  CheckCircle,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  Clock,
  Check,
  XCircle,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Package,
  CreditCard,
  Settings,
  LogOut,
  RefreshCw,
  BarChart,
  TrendingDown,
  Percent,
  QrCode,
  Activity,
  Database,
  Server,
  Zap,
  Globe,
  Cpu,
  HardDrive,
  Network,
  Shield as ShieldIcon,
  Key,
  Bell,
  HelpCircle,
  DownloadCloud,
  UploadCloud,
  Home,
  Calendar,
  ArrowUpDown,
  Star,
  Award,
  Target,
  PieChart,
  LineChart,
  AlertTriangle,
  Menu,
  ChevronRight,
  ShieldCheck,
  Cloud,
  Layers,
  FileText,
  Database as DbIcon,
  Server as ServerIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Percent as PercentIcon,
  CheckSquare,
  XSquare,
  PauseCircle,
  PlayCircle,
  UserPlus,
  Building,
  Store as StoreIcon,
  Tag as TagIcon,
  BarChart2,
  Users as UsersIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Activity as ActivityIcon,
  Bell as BellIcon,
  HelpCircle as HelpCircleIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Calendar as CalendarIcon,
  Star as StarIcon,
  Award as AwardIcon,
  Target as TargetIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AlertTriangle as AlertTriangleIcon
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'vendor' | 'staff';
  companyId?: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: Timestamp;
  phone?: string;
  subscription?: string;
  branchId?: string;
  position?: string;
  permissions?: {
    canViewProducts: boolean;
    canUpdateStock: boolean;
    canReportIssues: boolean;
    canViewReports: boolean;
    canChangePrices: boolean;
    canCreateProducts?: boolean;
    canCreateLabels?: boolean;
    canCreatePromotions?: boolean;
    maxPriceChange?: number;
  };
}

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  subscription: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'pending' | 'suspended';
  ownerId: string;
  ownerName?: string;
  createdAt: Timestamp;
  code?: string;
  labelsCount?: number;
  branchesCount?: number;
  staffCount?: number;
}

interface SystemMetrics {
  totalUsers: number;
  totalCompanies: number;
  totalLabels: number;
  totalBranches: number;
  systemHealth: number;
  apiResponseTime: number;
  databaseLoad: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  trialAccounts: number;
  activeUsers24h: number;
  totalRevenue: number;
  conversionRate: number;
}

const formatDate = (value: unknown) => {
  if (!value) return '--';
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const dateValue = (value as { toDate: () => Date }).toDate();
    return dateValue instanceof Date && !Number.isNaN(dateValue.getTime())
      ? dateValue.toLocaleDateString()
      : '--';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const dateValue = new Date(value);
    return Number.isNaN(dateValue.getTime()) ? '--' : dateValue.toLocaleDateString();
  }
  return '--';
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user: currentUser, clearUser, hasHydrated } = useUserStore();

  const getCompanyDisplayCode = (company: Company) => {
    const raw = company.code || `VE${company.id.slice(-3).toUpperCase()}`;
    return raw.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  };
  
  // States
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [showCreateVendor, setShowCreateVendor] = useState(false);
  const [showEditUser, setShowEditUser] = useState<User | null>(null);
  const [showEditCompany, setShowEditCompany] = useState<Company | null>(null);
  const [showPendingUsers, setShowPendingUsers] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'companies' | 'analytics' | 'settings'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalCompanies: 0,
    totalLabels: 0,
    totalBranches: 0,
    systemHealth: 99.8,
    apiResponseTime: 42,
    databaseLoad: 68,
    monthlyRevenue: 12450,
    activeSubscriptions: 0,
    trialAccounts: 0,
    activeUsers24h: 1250,
    totalRevenue: 124500,
    conversionRate: 4.2
  });

  // Form states
  const [vendorForm, setVendorForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    password: 'changeme123',
    subscription: 'basic' as 'basic' | 'pro' | 'enterprise',
  });
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    status: 'active' as 'active' | 'pending' | 'suspended',
  });
  const [editCompanyForm, setEditCompanyForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    subscription: 'basic' as 'basic' | 'pro' | 'enterprise',
    status: 'active' as 'active' | 'pending' | 'suspended',
  });

  // Redirect if not admin
  useEffect(() => {
    if (!hasHydrated) return;
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role !== 'admin') {
      if (currentUser.role === 'vendor') router.push('/vendor');
      if (currentUser.role === 'staff') router.push('/staff');
    }
  }, [currentUser, hasHydrated, router]);

  // Load data
  useEffect(() => {
    if (!hasHydrated) return;
    if (currentUser?.role === 'admin') {
      loadData();
    }
  }, [currentUser, hasHydrated]);

  const loadData = async (minDelayMs = 0) => {
    const startTime = Date.now();
    try {
      setLoading(true);
      
      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as User)
      }));
      setUsers(usersData);

      // Load companies
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesData = await Promise.all(
        companiesSnapshot.docs.map(async (doc) => {
          const companyData = doc.data() as Company;
          
          // Get company stats
          const branchesQuery = query(collection(db, 'branches'), where('companyId', '==', doc.id));
          const branchesSnapshot = await getDocs(branchesQuery);
          
          const staffQuery = query(collection(db, 'users'), where('companyId', '==', doc.id), where('role', '==', 'staff'));
          const staffSnapshot = await getDocs(staffQuery);
          
          const labelsQuery = query(collection(db, 'labels'), where('companyId', '==', doc.id));
          const labelsSnapshot = await getDocs(labelsQuery);
          
          // Get owner name
          let ownerName = '';
          if (companyData.ownerId) {
            const ownerDoc = await getDoc(fsDoc(db, 'users', companyData.ownerId));
            if (ownerDoc.exists()) {
              ownerName = (ownerDoc.data() as User).name;
            }
          }
          
          return {
            id: doc.id,
            ...companyData,
            ownerName,
            branchesCount: branchesSnapshot.size,
            staffCount: staffSnapshot.size,
            labelsCount: labelsSnapshot.size
          } as Company;
        })
      );
      setCompanies(companiesData);

      // Calculate system metrics
      const totalLabels = companiesData.reduce((sum, company) => sum + (company.labelsCount || 0), 0);
      const totalBranches = companiesData.reduce((sum, company) => sum + (company.branchesCount || 0), 0);
      const activeSubscriptions = companiesData.filter(c => c.status === 'active').length;
      const trialAccounts = companiesData.filter(c => c.subscription === 'basic').length;
      
      setSystemMetrics({
        totalUsers: usersData.length,
        totalCompanies: companiesData.length,
        totalLabels,
        totalBranches,
        systemHealth: 99.8,
        apiResponseTime: 42,
        databaseLoad: 68,
        monthlyRevenue: companiesData.length * 299,
        activeSubscriptions,
        trialAccounts,
        activeUsers24h: 1250,
        totalRevenue: companiesData.length * 299 * 12,
        conversionRate: 4.2
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      const elapsed = Date.now() - startTime;
      if (minDelayMs > elapsed) {
        await new Promise((resolve) => setTimeout(resolve, minDelayMs - elapsed));
      }
      setLoading(false);
      setDataReady(true);
    }
  };

  const refreshAdminData = () => loadData(1800);

  // Handle logout
  const handleLogout = async () => {
    await logOut();
    clearUser();
    router.push('/login');
  };

  // Create new vendor
  const createVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const companySeq = await nextGlobalSequence("nextCompanyNumber");
      const vendorCode = makeVendorCode(companySeq);

      // 1. Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        vendorForm.email,
        vendorForm.password
      );

      const userId = userCredential.user.uid;
      const companyId = `company_${Date.now()}`;

      // 2. Create user document
      await setDoc(fsDoc(db, 'users', userId), {
        id: userId,
        email: vendorForm.email,
        name: vendorForm.contactName,
        role: 'vendor',
        companyId: companyId,
        status: 'active',
        createdAt: Timestamp.now(),
        phone: vendorForm.phone,
        createdBy: 'admin'
      });

      // 3. Create company document
      await setDoc(fsDoc(db, 'companies', companyId), {
        id: companyId,
        code: vendorCode,
        name: vendorForm.companyName,
        email: vendorForm.email,
        phone: vendorForm.phone,
        address: vendorForm.address,
        contactPerson: vendorForm.contactName,
        subscription: vendorForm.subscription,
        status: 'active',
        ownerId: userId,
        ownerName: vendorForm.contactName,
        createdAt: Timestamp.now(),
        createdBy: 'admin'
      });

      // Refresh data
      await loadData();
      
      // Reset form and close modal
      setVendorForm({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        password: 'changeme123',
        subscription: 'basic',
      });
      setShowCreateVendor(false);

      alert(`Vendor "${vendorForm.companyName}" created successfully!`);

    } catch (error: any) {
      console.error('Error creating vendor:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Approve pending user
  const approveUser = async (userId: string) => {
    try {
      await updateDoc(fsDoc(db, 'users', userId), {
        status: 'active'
      });
      await loadData();
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  // Suspend user/company
  const suspendUser = async (userId: string, currentStatus: 'active' | 'pending' | 'suspended') => {
    try {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      await updateDoc(fsDoc(db, 'users', userId), {
        status: newStatus
      });
      await loadData();
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  // Suspend company
  const suspendCompany = async (companyId: string, currentStatus: 'active' | 'pending' | 'suspended') => {
    try {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      await updateDoc(fsDoc(db, 'companies', companyId), {
        status: newStatus
      });
      await loadData();
    } catch (error) {
      console.error('Error suspending company:', error);
    }
  };

  // Delete user/company
  const deleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(fsDoc(db, 'users', userId));
        await loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  // Delete company
  const deleteCompany = async (companyId: string) => {
    if (confirm('Are you sure you want to delete this company? This will delete all associated data.')) {
      try {
        await deleteDoc(fsDoc(db, 'companies', companyId));
        await loadData();
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
  };

  const openEditUserModal = (user: User) => {
    setShowEditUser(user);
    setEditUserForm({
      name: user.name || '',
      email: user.email || '',
      status: user.status || 'active',
    });
  };

  const updateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditUser?.id) return;
    try {
      await updateDoc(fsDoc(db, 'users', showEditUser.id), {
        name: editUserForm.name.trim(),
        email: editUserForm.email.trim(),
        status: editUserForm.status,
        updatedAt: Timestamp.now(),
      });
      setUsers((prev) =>
        prev.map((user) =>
          user.id === showEditUser.id
            ? {
                ...user,
                name: editUserForm.name.trim(),
                email: editUserForm.email.trim(),
                status: editUserForm.status,
              }
            : user
        )
      );
      setShowEditUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

  const sendResetEmail = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent.');
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      alert(error?.message || 'Error sending password reset email');
    }
  };

  const requestPasswordReset = (user: User) => {
    if (!user.email) {
      alert('User does not have an email address.');
      return;
    }
    if (!confirm(`Send a password reset email to ${user.email}?`)) return;
    sendResetEmail(user.email);
  };

  const openEditCompanyModal = (company: Company) => {
    setShowEditCompany(company);
    setEditCompanyForm({
      name: company.name || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      subscription: company.subscription || 'basic',
      status: company.status || 'active',
    });
  };

  const updateCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditCompany?.id) return;
    try {
      await updateDoc(fsDoc(db, 'companies', showEditCompany.id), {
        name: editCompanyForm.name.trim(),
        email: editCompanyForm.email.trim(),
        phone: editCompanyForm.phone.trim(),
        address: editCompanyForm.address.trim(),
        subscription: editCompanyForm.subscription,
        status: editCompanyForm.status,
        updatedAt: Timestamp.now(),
      });
      setCompanies((prev) =>
        prev.map((company) =>
          company.id === showEditCompany.id
            ? {
                ...company,
                name: editCompanyForm.name.trim(),
                email: editCompanyForm.email.trim(),
                phone: editCompanyForm.phone.trim(),
                address: editCompanyForm.address.trim(),
                subscription: editCompanyForm.subscription,
                status: editCompanyForm.status,
              }
            : company
        )
      );
      setShowEditCompany(null);
    } catch (error) {
      console.error('Error updating company:', error);
      alert('Error updating company');
    }
  };

  // Filter data
  const vendorUsers = users.filter((user) => user.role === 'vendor');
  const filteredUsers = vendorUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingUsers = vendorUsers.filter(user => user.status === 'pending');
  const activeVendors = vendorUsers.filter(user => user.status === 'active');
  const activeStaff = users.filter(user => user.role === 'staff' && user.status === 'active');
  const activeCompanies = companies.filter(company => company.status === 'active');
  const pendingCompanies = companies.filter(company => company.status === 'pending');

  const pendingCount = pendingUsers.length;
  const vendorsCount = activeVendors.length;
  const staffCount = activeStaff.length;
  const companiesCount = companies.length;
  
  const adminTabs = [
    { id: 'overview', label: 'Overview', icon: HomeIcon, color: 'text-blue-600' },
    { id: 'users', label: 'Users', icon: UsersIcon, color: 'text-green-600' },
    { id: 'companies', label: 'Companies', icon: Building2, color: 'text-purple-600' },
    { id: 'analytics', label: 'Analytics', icon: BarChart2, color: 'text-orange-600' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, color: 'text-gray-600' }
  ] as const;

  if (!dataReady && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-[5px] border-gray-300 border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Loading Admin Console</h3>
            <p className="text-gray-600 mt-1">Preparing dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasHydrated) {
    return null;
  }
  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white font-sans">
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden">
          <div className="fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">Admin Console</p>
                  <p className="text-xs text-gray-400">LabelSync Enterprise</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-gray-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                      selectedTab === tab.id
                        ? 'bg-gray-800 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${tab.color}`} />
                    <span className="font-medium">{tab.label}</span>
                    {tab.id === 'users' && vendorUsers.length > 0 && (
                      <span className="ml-auto bg-blue-600 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">
                        {vendorUsers.length}
                      </span>
                    )}
                    {tab.id === 'companies' && companies.length > 0 && (
                      <span className="ml-auto bg-purple-600 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">
                        {companies.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="absolute bottom-0 w-full p-6 border-t border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center">
                  <span className="font-bold text-white">{currentUser.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold">{currentUser.name}</p>
                  <p className="text-xs text-gray-400">System Administrator</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-gray-700 text-white hover:bg-gray-800"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden inline-flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800 h-10 w-10 hover:bg-gray-700 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">LabelSync Admin</h1>
                  <p className="text-xs sm:text-sm text-gray-300">Enterprise Management Console</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users, companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <Button 
                  onClick={refreshAdminData}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-gray-800 hidden sm:flex"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <div className="text-right hidden sm:block">
                  <p className="font-semibold">{currentUser.name}</p>
                  <p className="text-sm text-gray-300">Administrator</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                  <span className="font-bold text-white">{currentUser.name.charAt(0)}</span>
                </div>
                <Button 
                  onClick={handleLogout} 
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex space-x-2 mt-8">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-t-xl transition-all ${
                    selectedTab === tab.id
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${selectedTab === tab.id ? tab.color : 'text-gray-400'}`} />
                  <span className="font-medium">{tab.label}</span>
                  {tab.id === 'users' && vendorUsers.length > 0 && (
                    <span className={`ml-2 text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center ${
                      selectedTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-700 text-white'
                    }`}>
                      {vendorUsers.length}
                    </span>
                  )}
                  {tab.id === 'companies' && companies.length > 0 && (
                    <span className={`ml-2 text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center ${
                      selectedTab === tab.id ? 'bg-purple-100 text-purple-600' : 'bg-gray-700 text-white'
                    }`}>
                      {companies.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {loading && dataReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-gray-700">
            <div className="h-12 w-12 animate-spin rounded-full border-[6px] border-gray-300 border-t-blue-600"></div>
            <div className="text-sm font-semibold tracking-wide uppercase">Refreshing data...</div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl border border-blue-400 p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Pending Approvals</p>
                <p className="mt-2 text-3xl font-bold">{pendingCount}</p>
                <p className="text-sm text-blue-100 mt-1">
                  {pendingCompanies.length} companies • {pendingUsers.length} users
                </p>
              </div>
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl border border-purple-400 p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Active Vendors</p>
                <p className="mt-2 text-3xl font-bold">{vendorsCount}</p>
                <p className="text-sm text-purple-100 mt-1">
                  {activeCompanies.length} active companies
                </p>
              </div>
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl border border-green-400 p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Staff Members</p>
                <p className="mt-2 text-3xl font-bold">{staffCount}</p>
                <p className="text-sm text-green-100 mt-1">
                  Across {systemMetrics.totalBranches} branches
                </p>
              </div>
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl border border-orange-400 p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">System Health</p>
                <p className="mt-2 text-3xl font-bold">{systemMetrics.systemHealth}%</p>
                <p className="text-sm text-orange-100 mt-1">
                  {systemMetrics.apiResponseTime}ms API response
                </p>
              </div>
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Based on Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Pending Approvals Section */}
            {(pendingCount > 0 || pendingCompanies.length > 0) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Pending Approvals</h3>
                    <p className="text-gray-600">Review and approve new registrations</p>
                  </div>
                  <Button 
                    onClick={() => setShowPendingUsers(true)} 
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    View All ({pendingCount + pendingCompanies.length})
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pending Companies */}
                  {pendingCompanies.slice(0, 2).map((company) => (
                    <div key={company.id} className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{company.name}</p>
                          <p className="text-sm text-gray-600">{company.email}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Button 
                              size="sm" 
                              onClick={() => approveUser(company.ownerId)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => deleteCompany(company.id)}
                              className="border-red-600 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pending Users */}
                  {pendingUsers.slice(0, 2).map((user) => (
                    <div key={user.id} className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email} • {user.role}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Button 
                              size="sm" 
                              onClick={() => approveUser(user.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => deleteUser(user.id)}
                              className="border-red-600 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setShowCreateVendor(true)}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-xl transition-all text-center group bg-gradient-to-b from-white to-gray-50"
                >
                  <Building2 className="h-8 w-8 mx-auto mb-3 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-gray-900">Create Vendor</span>
                  <p className="text-xs text-gray-500 mt-1">Add new retail chain</p>
                </button>
                <button 
                  onClick={() => setSelectedTab('users')}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-xl transition-all text-center group bg-gradient-to-b from-white to-gray-50"
                >
                  <Users className="h-8 w-8 mx-auto mb-3 text-green-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-gray-900">Manage Users</span>
                  <p className="text-xs text-gray-500 mt-1">View all platform users</p>
                </button>
                <button 
                  onClick={() => setSelectedTab('companies')}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-xl transition-all text-center group bg-gradient-to-b from-white to-gray-50"
                >
                  <Store className="h-8 w-8 mx-auto mb-3 text-purple-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-gray-900">View Companies</span>
                  <p className="text-xs text-gray-500 mt-1">All retail chains</p>
                </button>
                <button 
                  onClick={refreshAdminData}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-xl transition-all text-center group bg-gradient-to-b from-white to-gray-50"
                >
                  <RefreshCw className="h-8 w-8 mx-auto mb-3 text-orange-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-gray-900">Refresh Data</span>
                  <p className="text-xs text-gray-500 mt-1">Update all information</p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {companies.slice(0, 3).map((company) => (
                  <div key={company.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{company.name}</p>
                        <p className="text-sm text-gray-500">
                          Joined {formatDate(company.createdAt)} • {company.subscription} Plan
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {company.branchesCount || 0} branches
                      </p>
                      <p className="text-xs text-gray-500">
                        {company.labelsCount || 0} labels
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">User Management</h3>
                  <p className="text-gray-600">Manage vendor accounts and permissions</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-gray-300">
                    <DownloadIcon className="h-4 w-4 mr-2" /> Export
                  </Button>
                  <Button variant="outline" className="border-gray-300">
                    <Filter className="h-4 w-4 mr-2" /> Filter
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const userCompany = companies.find(c => c.id === user.companyId);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center">
                              <span className="font-medium text-white">{user.name.charAt(0)}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.position && (
                                <div className="text-xs text-gray-400">{user.position}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'vendor' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {userCompany ? userCompany.name : 'No Company'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {userCompany ? userCompany.subscription : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditUserModal(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => requestPasswordReset(user)}
                            >
                              <Mail className="h-4 w-4 mr-2" /> Reset PW
                            </Button>
                            {user.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => approveUser(user.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => suspendUser(user.id, user.status)}
                              className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                            >
                              {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteUser(user.id)}
                              className="border-red-600 text-red-600 hover:bg-red-50"
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
        )}

        {selectedTab === 'companies' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Company Management</h3>
                  <p className="text-gray-600">Manage all retail chains on the platform</p>
                </div>
                <Button 
                  onClick={() => setShowCreateVendor(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Company
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <div key={company.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{company.name}</h4>
                        <p className="text-sm text-gray-500">{company.email}</p>
                        <p className="text-xs text-gray-400">Code: {getCompanyDisplayCode(company)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      company.status === 'active' ? 'bg-green-100 text-green-800' :
                      company.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {company.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{company.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span className="flex-1">{company.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UserIcon className="h-4 w-4" />
                      <span>Owner: {company.ownerName || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CreditCard className="h-4 w-4" />
                      <span className="capitalize">{company.subscription} Plan</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{company.branchesCount || 0}</p>
                      <p className="text-xs text-gray-600">Branches</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">{company.staffCount || 0}</p>
                      <p className="text-xs text-gray-600">Staff</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded-lg">
                      <p className="text-lg font-bold text-purple-600">{company.labelsCount || 0}</p>
                      <p className="text-xs text-gray-600">Labels</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 border-gray-300"
                      onClick={() => {
                        router.push(`/admin/companies/${company.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-gray-300"
                      onClick={() => openEditCompanyModal(company)}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                      onClick={() => suspendCompany(company.id, company.status)}
                    >
                      {company.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                      onClick={() => deleteCompany(company.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">System Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Platform Usage</h4>
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Users</span>
                      <span className="font-bold text-gray-900">{systemMetrics.totalUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Vendors</span>
                      <span className="font-bold text-blue-600">{vendorsCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Staff</span>
                      <span className="font-bold text-green-600">{staffCount}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Company Stats</h4>
                    <Building2 className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Companies</span>
                      <span className="font-bold text-gray-900">{systemMetrics.totalCompanies}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active</span>
                      <span className="font-bold text-green-600">{activeCompanies.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Branches</span>
                      <span className="font-bold text-blue-600">{systemMetrics.totalBranches}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Labels</h4>
                    <Tag className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Labels</span>
                      <span className="font-bold text-gray-900">{systemMetrics.totalLabels}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avg per Company</span>
                      <span className="font-bold text-blue-600">
                        {systemMetrics.totalCompanies > 0 
                          ? Math.round(systemMetrics.totalLabels / systemMetrics.totalCompanies)
                          : 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl p-6 md:col-span-2 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">System Health</h4>
                    <Activity className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">System Health</span>
                        <span className={`text-sm font-medium ${
                          systemMetrics.systemHealth > 95 ? 'text-green-600' :
                          systemMetrics.systemHealth > 85 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {systemMetrics.systemHealth}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            systemMetrics.systemHealth > 95 ? 'bg-green-500' :
                            systemMetrics.systemHealth > 85 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} 
                          style={{ width: `${systemMetrics.systemHealth}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">API Response Time</span>
                        <span className={`text-sm font-medium ${
                          systemMetrics.apiResponseTime < 50 ? 'text-green-600' :
                          systemMetrics.apiResponseTime < 100 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {systemMetrics.apiResponseTime}ms
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            systemMetrics.apiResponseTime < 50 ? 'bg-green-500' :
                            systemMetrics.apiResponseTime < 100 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} 
                          style={{ width: `${Math.min(100, 100 - (systemMetrics.apiResponseTime / 2))}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Database Load</span>
                        <span className={`text-sm font-medium ${
                          systemMetrics.databaseLoad < 60 ? 'text-green-600' :
                          systemMetrics.databaseLoad < 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {systemMetrics.databaseLoad}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            systemMetrics.databaseLoad < 60 ? 'bg-green-500' :
                            systemMetrics.databaseLoad < 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} 
                          style={{ width: `${systemMetrics.databaseLoad}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Revenue</h4>
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Monthly Revenue</span>
                      <span className="font-bold text-green-600">${systemMetrics.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Subscriptions</span>
                      <span className="font-bold text-blue-600">{systemMetrics.activeSubscriptions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Trial Accounts</span>
                      <span className="font-bold text-yellow-600">{systemMetrics.trialAccounts}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-6">System Settings</h3>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ShieldIcon className="h-5 w-5 text-blue-500" />
                    Platform Settings
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
                        <p className="text-xs text-gray-500">Disable platform for maintenance</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-gray-300">
                        Disabled
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">User Registration</span>
                        <p className="text-xs text-gray-500">New user approval settings</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-green-600 text-green-600">
                        Auto-approve
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                        <p className="text-xs text-gray-500">System notification settings</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-blue-600 text-blue-600">
                        Enabled
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">API Access</span>
                        <p className="text-xs text-gray-500">Third-party API settings</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-600">
                        Restricted
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Key className="h-5 w-5 text-purple-500" />
                    Security Settings
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Two-Factor Auth</span>
                        <p className="text-xs text-gray-500">Admin account 2FA</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-green-600 text-green-600">
                        Enabled
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Session Timeout</span>
                        <p className="text-xs text-gray-500">Auto logout after inactivity</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-blue-600 text-blue-600">
                        24 Hours
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Password Policy</span>
                        <p className="text-xs text-gray-500">User password requirements</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-green-600 text-green-600">
                        Strong
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Audit Logging</span>
                        <p className="text-xs text-gray-500">Track all system activities</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-blue-600 text-blue-600">
                        Enabled
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Database className="h-5 w-5 text-orange-500" />
                  Database Management
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-center transition-colors">
                    <DownloadCloud className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <span className="text-sm font-medium">Backup Now</span>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-center transition-colors">
                    <UploadCloud className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <span className="text-sm font-medium">Restore Backup</span>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-center transition-colors">
                    <RefreshCw className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <span className="text-sm font-medium">Optimize Database</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals (Edit User, Edit Company, Create Vendor) */}
      {/* Edit User Modal */}
      {showEditUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                </div>
                <button onClick={() => setShowEditUser(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Update vendor account details</p>
            </div>

            <form onSubmit={updateUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Name *</label>
                <Input
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email *</label>
                <Input
                  type="email"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={editUserForm.status}
                  onChange={(e) =>
                    setEditUserForm({ ...editUserForm, status: e.target.value as 'active' | 'pending' | 'suspended' })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => sendResetEmail(editUserForm.email)} className="rounded-lg">
                  <Mail className="h-4 w-4 mr-2" /> Send Reset Email
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowEditUser(null)} className="rounded-lg">
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-lg">Save</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditCompany && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Edit Company</h2>
                </div>
                <button onClick={() => setShowEditCompany(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Update company information</p>
            </div>

            <form onSubmit={updateCompanyInfo} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Company Name *</label>
                  <Input
                    value={editCompanyForm.name}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, name: e.target.value })}
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <Input
                    type="email"
                    value={editCompanyForm.email}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, email: e.target.value })}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <Input
                    value={editCompanyForm.phone}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, phone: e.target.value })}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={editCompanyForm.address}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, address: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Subscription</label>
                  <select
                    value={editCompanyForm.subscription}
                    onChange={(e) =>
                      setEditCompanyForm({ ...editCompanyForm, subscription: e.target.value as 'basic' | 'pro' | 'enterprise' })
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editCompanyForm.status}
                    onChange={(e) =>
                      setEditCompanyForm({ ...editCompanyForm, status: e.target.value as 'active' | 'pending' | 'suspended' })
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowEditCompany(null)} className="rounded-lg">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-lg">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Vendor Modal */}
      {showCreateVendor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-7 w-7 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Create New Vendor</h2>
                </div>
                <button 
                  onClick={() => setShowCreateVendor(false)} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Add a new retail chain to the platform</p>
            </div>

            <form onSubmit={createVendor} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Company Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={vendorForm.companyName}
                      onChange={(e) => setVendorForm({...vendorForm, companyName: e.target.value})}
                      className="pl-10 rounded-lg"
                      placeholder="Retail Chain Inc."
                      required
                    />
                  </div>
                </div>

                {/* Contact Person */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Contact Person *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={vendorForm.contactName}
                      onChange={(e) => setVendorForm({...vendorForm, contactName: e.target.value})}
                      className="pl-10 rounded-lg"
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
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm({...vendorForm, email: e.target.value})}
                      className="pl-10 rounded-lg"
                      placeholder="contact@company.com"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={vendorForm.phone}
                      onChange={(e) => setVendorForm({...vendorForm, phone: e.target.value})}
                      className="pl-10 rounded-lg"
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      value={vendorForm.address}
                      onChange={(e) => setVendorForm({...vendorForm, address: e.target.value})}
                      className="w-full border rounded-xl px-3 py-2 pl-10 min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="123 Business St, City, State, ZIP"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Initial Password *</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      value={vendorForm.password}
                      onChange={(e) => setVendorForm({...vendorForm, password: e.target.value})}
                      className="pl-10 rounded-lg"
                      placeholder="changeme123"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">Vendor should change this on first login</p>
                </div>

                {/* Subscription */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Subscription Plan</label>
                  <select
                    value={vendorForm.subscription}
                    onChange={(e) => setVendorForm({...vendorForm, subscription: e.target.value as any})}
                    className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="basic">Basic ($99/month)</option>
                    <option value="pro">Professional ($299/month)</option>
                    <option value="enterprise">Enterprise (Custom)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateVendor(false)}
                  className="border-gray-300 rounded-lg"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg shadow-lg"
                >
                  Create Vendor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}