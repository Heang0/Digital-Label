'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/user-store';
import { logOut } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  LayoutDashboard,
  Package,
  Tag,
  AlertCircle,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Bell,
  HelpCircle,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Clock,
  Battery,
  RefreshCw,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Info,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  QrCode,
  Scan,
  Upload,
  Copy,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  assignedBy: string;
}

interface LabelIssue {
  id: string;
  labelId: string;
  productName: string;
  issue: string;
  status: 'open' | 'in-progress' | 'resolved';
  reportedAt: string;
  priority: 'high' | 'medium' | 'low';
}

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: string;
}

export default function StaffDashboard() {
  const router = useRouter();
  const { user: currentUser, clearUser } = useUserStore();
  
  // States
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'inventory' | 'labels' | 'issues' | 'reports'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<LabelIssue[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Redirect if not staff
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role !== 'staff') {
      if (currentUser.role === 'admin') router.push('/admin');
      if (currentUser.role === 'vendor') router.push('/vendor');
    }
  }, [currentUser, router]);

  // Load data
  useEffect(() => {
    if (currentUser?.role === 'staff') {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      // Mock data for demo
      setTasks([
        {
          id: '1',
          title: 'Restock milk in Aisle 4',
          description: 'Organic milk is running low, needs restocking',
          priority: 'high',
          status: 'pending',
          dueDate: 'Today, 4 PM',
          assignedBy: 'Store Manager'
        },
        {
          id: '2',
          title: 'Check label battery #DL-002',
          description: 'Label showing low battery warning',
          priority: 'medium',
          status: 'in-progress',
          dueDate: 'Tomorrow',
          assignedBy: 'System Alert'
        },
        {
          id: '3',
          title: 'Update coffee beans stock',
          description: 'Received new shipment of coffee beans',
          priority: 'low',
          status: 'completed',
          dueDate: 'Yesterday',
          assignedBy: 'Inventory Manager'
        }
      ]);

      setIssues([
        {
          id: '1',
          labelId: 'DL-002',
          productName: 'Organic Milk',
          issue: 'Showing wrong price ($3.49 instead of $3.99)',
          status: 'open',
          reportedAt: '2 hours ago',
          priority: 'high'
        },
        {
          id: '2',
          labelId: 'DL-015',
          productName: 'Premium Coffee',
          issue: 'Blank screen - not displaying price',
          status: 'in-progress',
          reportedAt: '1 day ago',
          priority: 'medium'
        },
        {
          id: '3',
          labelId: 'DL-008',
          productName: 'Whole Wheat Bread',
          issue: 'Low battery warning',
          status: 'resolved',
          reportedAt: '3 days ago',
          priority: 'low'
        }
      ]);

      setProducts([
        {
          id: '1',
          name: 'Organic Milk',
          sku: 'DAI-001',
          currentStock: 15,
          minStock: 25,
          status: 'low-stock',
          lastUpdated: '10:30 AM'
        },
        {
          id: '2',
          name: 'Premium Coffee Beans',
          sku: 'COF-001',
          currentStock: 45,
          minStock: 20,
          status: 'in-stock',
          lastUpdated: '9:15 AM'
        },
        {
          id: '3',
          name: 'Whole Wheat Bread',
          sku: 'BAK-001',
          currentStock: 8,
          minStock: 15,
          status: 'low-stock',
          lastUpdated: '11:45 AM'
        },
        {
          id: '4',
          name: 'Free Range Eggs',
          sku: 'DAI-002',
          currentStock: 32,
          minStock: 20,
          status: 'in-stock',
          lastUpdated: '8:30 AM'
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

  // Complete task
  const completeTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: 'completed' } : task
    ));
  };

  // Update stock
  const updateStock = (productId: string, amount: number) => {
    setProducts(products.map(product => 
      product.id === productId ? { 
        ...product, 
        currentStock: product.currentStock + amount,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } : product
    ));
  };

  // Report new issue
  const reportIssue = () => {
    const newIssue: LabelIssue = {
      id: Date.now().toString(),
      labelId: 'DL-' + Math.floor(Math.random() * 100).toString().padStart(3, '0'),
      productName: 'New Product',
      issue: 'Sample issue description',
      status: 'open',
      reportedAt: 'Just now',
      priority: 'medium'
    };
    setIssues([newIssue, ...issues]);
  };

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
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Staff Portal</p>
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
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen fixed left-0 top-0">
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Digital Label</h1>
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
                <p className="text-xs text-gray-400">Store Staff</p>
                <p className="text-xs text-gray-500 mt-1 truncate">{currentUser.email}</p>
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
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </button>

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

            <button
              onClick={() => setSelectedTab('reports')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                selectedTab === 'reports' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-md'
              )}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Reports</span>
            </button>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-700 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
              <HelpCircle className="h-5 w-5" />
              <span className="font-medium">Help & Support</span>
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
              {/* Mobile menu content similar to desktop sidebar */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold">Staff Portal</h1>
                    </div>
                  </div>
                  <button onClick={() => setShowMobileMenu(false)} className="p-2">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {/* Add mobile navigation items here */}
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
                    {selectedTab === 'dashboard' && 'Staff Dashboard'}
                    {selectedTab === 'inventory' && 'Inventory Management'}
                    {selectedTab === 'labels' && 'Digital Labels'}
                    {selectedTab === 'issues' && 'Issue Reports'}
                    {selectedTab === 'reports' && 'Activity Reports'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {selectedTab === 'dashboard' && 'Overview of your tasks and store operations'}
                    {selectedTab === 'inventory' && 'Manage product stock levels and updates'}
                    {selectedTab === 'labels' && 'Monitor and report digital label issues'}
                    {selectedTab === 'issues' && 'Track and resolve reported problems'}
                    {selectedTab === 'reports' && 'View your activity and performance'}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search tasks, products..."
                      className="pl-10 w-64"
                    />
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={() => loadData()}>
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
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold">Welcome back, {currentUser.name}!</h2>
                      <p className="text-blue-100 mt-2">Here&apos;s what you need to focus on today.</p>
                      <div className="flex items-center gap-4 mt-6">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          <span>Shift: 9:00 AM - 5:00 PM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          <span>{tasks.filter(t => t.status === 'completed').length}/{tasks.length} tasks completed</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                      <div className="text-center">
                        <div className="text-3xl font-bold">08:45</div>
                        <div className="text-sm text-blue-100">Current Time</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
                        <p className="text-3xl font-bold mt-2">{tasks.filter(t => t.status === 'pending').length}</p>
                        <p className="text-sm text-gray-500 mt-1">High priority: {tasks.filter(t => t.priority === 'high' && t.status === 'pending').length}</p>
                      </div>
                      <div className="rounded-lg bg-yellow-100 p-3">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                        <p className="text-3xl font-bold mt-2">{products.filter(p => p.status === 'low-stock').length}</p>
                        <p className="text-sm text-gray-500 mt-1">Need attention</p>
                      </div>
                      <div className="rounded-lg bg-red-100 p-3">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Active Issues</p>
                        <p className="text-3xl font-bold mt-2">{issues.filter(i => i.status === 'open').length}</p>
                        <p className="text-sm text-gray-500 mt-1">Today: {issues.filter(i => i.reportedAt.includes('hour')).length}</p>
                      </div>
                      <div className="rounded-lg bg-orange-100 p-3">
                        <Tag className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Today&apos;s Updates</p>
                        <p className="text-3xl font-bold mt-2">12</p>
                        <p className="text-sm text-green-600 mt-1">+3 from yesterday</p>
                      </div>
                      <div className="rounded-lg bg-green-100 p-3">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Tasks</h3>
                        <p className="text-gray-600">Your assigned responsibilities</p>
                      </div>
                      <Button size="sm" variant="outline">
                        View All
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {tasks.map((task) => (
                        <div key={task.id} className={cn(
                          "p-4 rounded-xl border transition-all hover:shadow-sm",
                          task.priority === 'high' ? 'border-red-200 bg-red-50' :
                          task.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                          'border-gray-200 bg-gray-50'
                        )}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={cn(
                                  "h-2 w-2 rounded-full",
                                  task.priority === 'high' ? 'bg-red-500' :
                                  task.priority === 'medium' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                )}></div>
                                <span className="text-sm font-medium text-gray-900">{task.title}</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <span className="text-xs text-gray-500">Due: {task.dueDate}</span>
                                  <span className="text-xs text-gray-500">By: {task.assignedBy}</span>
                                </div>
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium",
                                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                )}>
                                  {task.status}
                                </span>
                              </div>
                            </div>
                            {task.status !== 'completed' && (
                              <Button 
                                size="sm" 
                                className="ml-4"
                                onClick={() => completeTask(task.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" /> Done
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl border p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:shadow-md transition-all text-center group">
                        <Package className="h-8 w-8 mx-auto mb-3 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-gray-900">Update Stock</span>
                        <p className="text-sm text-gray-600 mt-1">Record inventory changes</p>
                      </button>
                      <button 
                        onClick={reportIssue}
                        className="p-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl hover:shadow-md transition-all text-center group"
                      >
                        <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-600 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-gray-900">Report Issue</span>
                        <p className="text-sm text-gray-600 mt-1">Label problems or errors</p>
                      </button>
                      <button className="p-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:shadow-md transition-all text-center group">
                        <BarChart3 className="h-8 w-8 mx-auto mb-3 text-green-600 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-gray-900">Daily Report</span>
                        <p className="text-sm text-gray-600 mt-1">View shift summary</p>
                      </button>
                      <button className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:shadow-md transition-all text-center group">
                        <QrCode className="h-8 w-8 mx-auto mb-3 text-purple-600 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-gray-900">Scan Label</span>
                        <p className="text-sm text-gray-600 mt-1">Check label status</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {selectedTab === 'inventory' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Inventory Management</h3>
                      <p className="text-gray-600">Update stock levels and track inventory</p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" /> Export
                      </Button>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" /> Add Product
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Current Stock</th>
                          <th className="px6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Min Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Updated</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                                  <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-gray-900">{product.currentStock}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{product.minStock}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-semibold",
                                product.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                                product.status === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              )}>
                                {product.status === 'in-stock' ? 'In Stock' : 
                                 product.status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.lastUpdated}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateStock(product.id, 10)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateStock(product.id, -5)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Info className="h-4 w-4" />
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Digital Label Status</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {issues.map((issue) => (
                      <div key={issue.id} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{issue.labelId}</h4>
                            <p className="text-sm text-gray-600">{issue.productName}</p>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold",
                            issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            issue.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          )}>
                            {issue.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-4">{issue.issue}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-gray-500">
                            Reported {issue.reportedAt}
                          </div>
                          <div className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            issue.priority === 'high' ? 'bg-red-100 text-red-800' :
                            issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          )}>
                            {issue.priority} priority
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs (simplified for demo) */}
            {(selectedTab === 'issues' || selectedTab === 'reports') && (
              <div className="bg-white rounded-xl border p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedTab === 'issues' ? 'Issue Management' : 'Activity Reports'}
                </h3>
                <p className="text-gray-600">This section is under development. Coming soon with more features!</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}