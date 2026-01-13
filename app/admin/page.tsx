'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/user-store';
import { auth, db, logOut } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, updateDoc, deleteDoc } from 'firebase/firestore';
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
  BarChart3
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'vendor' | 'staff';
  companyId?: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  phone?: string;
  subscription?: string;
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
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user: currentUser, clearUser } = useUserStore();
  
  // States
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateVendor, setShowCreateVendor] = useState(false);
  const [showPendingUsers, setShowPendingUsers] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'companies' | 'settings'>('overview');

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

  // Redirect if not admin
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role !== 'admin') {
      if (currentUser.role === 'vendor') router.push('/vendor');
      if (currentUser.role === 'staff') router.push('/staff');
    }
  }, [currentUser, router]);

  // Load data
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
      setUsers(usersData);

      // Load companies
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesData = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Company[];
      setCompanies(companiesData);
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

  // Create new vendor
  const createVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        vendorForm.email,
        vendorForm.password
      );

      const userId = userCredential.user.uid;
      const companyId = `company_${Date.now()}`;

      // 2. Create user document
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: vendorForm.email,
        name: vendorForm.contactName,
        role: 'vendor',
        companyId: companyId,
        status: 'active',
        createdAt: new Date().toISOString(),
        phone: vendorForm.phone,
        createdBy: 'admin'
      });

      // 3. Create company document
      await setDoc(doc(db, 'companies', companyId), {
        id: companyId,
        name: vendorForm.companyName,
        email: vendorForm.email,
        phone: vendorForm.phone,
        address: vendorForm.address,
        contactPerson: vendorForm.contactName,
        subscription: vendorForm.subscription,
        status: 'active',
        ownerId: userId,
        createdAt: new Date().toISOString(),
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
      await updateDoc(doc(db, 'users', userId), {
        status: 'active'
      });
      await loadData();
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  // Suspend user/company
  const suspendUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'suspended'
      });
      await loadData();
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  // Delete user/company
  const deleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        await loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  // Filter data
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.includes(searchTerm.toLowerCase())
  );

  const pendingUsers = users.filter(user => user.status === 'pending');
  const activeVendors = users.filter(user => user.role === 'vendor' && user.status === 'active');
  const activeStaff = users.filter(user => user.role === 'staff' && user.status === 'active');

  const pendingCount = pendingUsers.length;
  const vendorsCount = activeVendors.length;
  const staffCount = activeStaff.length;
  const labelsCount = 2184; // Mock data
  const systemHealth = 99.8; // Mock data

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-600 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Digital Label Admin</h1>
                <p className="text-sm text-gray-600">System Control Panel</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users, companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-sm text-gray-500">System Administrator</p>
                </div>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-4 border-b">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-4 py-2 text-sm font-medium ${selectedTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('users')}
              className={`px-4 py-2 text-sm font-medium ${selectedTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setSelectedTab('companies')}
              className={`px-4 py-2 text-sm font-medium ${selectedTab === 'companies' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Companies ({companies.length})
            </button>
            <button
              onClick={() => setSelectedTab('settings')}
              className={`px-4 py-2 text-sm font-medium ${selectedTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats - Always visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{pendingCount}</p>
              </div>
              <div className="rounded-lg bg-yellow-100 p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Vendors</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{vendorsCount}</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Staff Members</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{staffCount}</p>
              </div>
              <div className="rounded-lg bg-green-100 p-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">System Health</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{systemHealth}%</p>
              </div>
              <div className="rounded-lg bg-purple-100 p-3">
                <Battery className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Based on Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Pending Approvals Section */}
            {pendingCount > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
                    <p className="text-gray-600">Review and approve new registrations</p>
                  </div>
                  <Button onClick={() => setShowPendingUsers(true)} variant="outline">
                    View All ({pendingCount})
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {pendingUsers.slice(0, 3).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email} • {user.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveUser(user.id)}>
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteUser(user.id)}>
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setShowCreateVendor(true)}
                  className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors"
                >
                  <Building2 className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <span className="text-sm font-medium">Create Vendor</span>
                </button>
                <button 
                  onClick={() => setSelectedTab('users')}
                  className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors"
                >
                  <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <span className="text-sm font-medium">Manage Users</span>
                </button>
                <button 
                  onClick={() => setSelectedTab('companies')}
                  className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors"
                >
                  <Store className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <span className="text-sm font-medium">View Companies</span>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <span className="text-sm font-medium">System Reports</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'users' && (
          <div className="bg-white rounded-xl border">
            <div className="p-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                  <p className="text-gray-600">Manage all platform users</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" /> Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" /> Export
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="font-medium">{user.name.charAt(0)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'vendor' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {user.status === 'pending' && (
                            <Button size="sm" onClick={() => approveUser(user.id)}>
                              Approve
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => suspendUser(user.id)}>
                            {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteUser(user.id)}>
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
        )}

        {selectedTab === 'companies' && (
          <div className="bg-white rounded-xl border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Company Management</h3>
                  <p className="text-gray-600">Manage all retail chains</p>
                </div>
                <Button onClick={() => setShowCreateVendor(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Company
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {companies.map((company) => (
                <div key={company.id} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{company.name}</h4>
                        <p className="text-sm text-gray-500">{company.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      company.status === 'active' ? 'bg-green-100 text-green-800' :
                      company.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {company.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{company.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span className="flex-1">{company.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span className="capitalize">{company.subscription} Plan</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-6">System Settings</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Platform Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Maintenance Mode</span>
                      <Button size="sm" variant="outline">Enable</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New User Registration</span>
                      <Button size="sm" variant="outline">Require Approval</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Notifications</span>
                      <Button size="sm" variant="outline">Enabled</Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Billing & Subscriptions</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly Revenue</span>
                      <span className="font-medium">$12,450</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Subscriptions</span>
                      <span className="font-medium">{companies.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Trial Accounts</span>
                      <span className="font-medium">3</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t">
                <h4 className="font-medium mb-3">System Health</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Response Time</span>
                    <span className="text-sm font-medium text-green-600">42ms</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '85%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Load</span>
                    <span className="text-sm font-medium text-yellow-600">68%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: '68%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Vendor Modal */}
      {showCreateVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Create New Vendor</h2>
                </div>
                <button onClick={() => setShowCreateVendor(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Add a new retail chain to the platform</p>
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
                      className="pl-10"
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
                      value={vendorForm.email}
                      onChange={(e) => setVendorForm({...vendorForm, email: e.target.value})}
                      className="pl-10"
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
                      className="pl-10"
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
                      className="w-full border rounded-lg px-3 py-2 pl-10 min-h-[80px]"
                      placeholder="123 Business St, City, State, ZIP"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Initial Password *</label>
                  <Input
                    type="text"
                    value={vendorForm.password}
                    onChange={(e) => setVendorForm({...vendorForm, password: e.target.value})}
                    placeholder="changeme123"
                    required
                  />
                  <p className="text-xs text-gray-500">Vendor should change this on first login</p>
                </div>

                {/* Subscription */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Subscription Plan</label>
                  <select
                    value={vendorForm.subscription}
                    onChange={(e) => setVendorForm({...vendorForm, subscription: e.target.value as any})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="basic">Basic ($99/month)</option>
                    <option value="pro">Professional ($299/month)</option>
                    <option value="enterprise">Enterprise (Custom)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowCreateVendor(false)}>
                  Cancel
                </Button>
                <Button type="submit">
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