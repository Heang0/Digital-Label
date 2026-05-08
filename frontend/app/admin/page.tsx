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
  updateDoc, 
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { useAdminData } from '@/hooks/useAdminData';
import { DashboardSidebar } from '@/components/admin/DashboardSidebar';
import { DashboardHeader } from '@/components/admin/DashboardHeader';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminCompanies } from '@/components/admin/AdminCompanies';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { VendorModal } from '@/components/admin/VendorModal';
import { CompanyModal } from '@/components/admin/CompanyModal';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminFinancials } from '@/components/admin/AdminFinancials';
import { User, Company } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const router = useRouter();
  const { user: currentUser, clearUser, hasHydrated } = useUserStore();
  const { users, companies, loading, systemMetrics, refreshData } = useAdminData(currentUser);

  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'companies' | 'analytics' | 'settings' | 'revenue'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<User | null>(null);
  
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

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

  // Handle password reset event from AdminUsers component
  useEffect(() => {
    const handleReset = async (e: any) => {
      const email = e.detail;
      if (!email) return;
      try {
        await sendPasswordResetEmail(auth, email);
        alert(`A secure password reset link has been sent to ${email}`);
      } catch (error: any) {
        alert(`Failed to send reset link: ${error.message}`);
      }
    };
    window.addEventListener('reset-vendor-password', handleReset);
    return () => window.removeEventListener('reset-vendor-password', handleReset);
  }, []);

  const handleLogout = async () => {
    await logOut();
    clearUser();
    router.push('/login');
  };

  const handleOpenVendorModal = (vendor: User | null = null) => {
    setEditingVendor(vendor);
    setIsVendorModalOpen(true);
  };

  const handleSaveVendor = async (data: any) => {
    try {
      const url = editingVendor 
        ? `http://localhost:5000/api/users/vendors/${editingVendor.id}`
        : 'http://localhost:5000/api/users/vendors';
      
      const method = editingVendor ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save vendor');
      }

      refreshData();
      alert(`Vendor ${editingVendor ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
      alert(error.message);
      throw error;
    }
  };

  const handleOpenCompanyModal = (company: Company | null = null) => {
    setEditingCompany(company);
    setIsCompanyModalOpen(true);
  };

  const handleSaveCompany = async (data: any) => {
    try {
      const url = editingCompany 
        ? `http://localhost:5000/api/companies/${editingCompany.id}`
        : 'http://localhost:5000/api/companies';
      
      const method = editingCompany ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to save company');

      refreshData();
      alert(`Company ${editingCompany ? 'updated' : 'onboarded'} successfully!`);
    } catch (error: any) {
      alert(error.message);
      throw error;
    }
  };

  const handleSuspendUser = async (id: string, currentStatus: any) => {
    try {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      await updateDoc(fsDoc(db, 'users', id), { status: newStatus });
      refreshData();
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  const handleSuspendCompany = async (id: string, currentStatus: any) => {
    try {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      await updateDoc(fsDoc(db, 'companies', id), { status: newStatus });
      refreshData();
    } catch (error) {
      console.error('Error suspending company:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteDoc(fsDoc(db, 'users', id));
      refreshData();
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (confirm('Are you sure you want to delete this company?')) {
      await deleteDoc(fsDoc(db, 'companies', id));
      refreshData();
    }
  };

  if (!hasHydrated || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F1F5F9] dark:bg-[#1C2434] overflow-hidden transition-colors duration-300">
      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
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
                setSelectedTab={setSelectedTab}
                onLogout={handleLogout}
                onClose={() => setMobileMenuOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Static Sidebar (Desktop) */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <DashboardSidebar 
          currentUser={currentUser as any}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Dashboard Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader 
          onMenuOpen={() => setMobileMenuOpen(true)} 
          onRefresh={refreshData}
          title={selectedTab}
          isRefreshing={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onTabChange={setSelectedTab}
        />

        <main className="flex-1 overflow-y-auto py-6 lg:py-10 px-4 lg:px-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {selectedTab === 'overview' && (
                <AdminOverview 
                  metrics={systemMetrics} 
                  onTabChange={setSelectedTab}
                />
              )}
              {selectedTab === 'users' && (
                <AdminUsers 
                  users={users} 
                  searchTerm={searchTerm}
                  onEdit={(u) => handleOpenVendorModal(u)}
                  onDelete={handleDeleteUser}
                  onSuspend={handleSuspendUser}
                  onCreate={() => handleOpenVendorModal(null)}
                />
              )}
              {selectedTab === 'companies' && (
                <AdminCompanies 
                  companies={companies} 
                  searchTerm={searchTerm}
                  onEdit={(c) => handleOpenCompanyModal(c)}
                  onDelete={handleDeleteCompany}
                  onSuspend={handleSuspendCompany}
                />
              )}
              {selectedTab === 'settings' && <AdminSettings />}
              {selectedTab === 'analytics' && (
                <AdminAnalytics 
                  metrics={systemMetrics} 
                  companies={companies} 
                />
              )}
              {selectedTab === 'revenue' && <AdminFinancials />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <VendorModal 
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        onSave={handleSaveVendor}
        editingUser={editingVendor}
      />

      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={handleSaveCompany}
        editingCompany={editingCompany}
      />
    </div>
  );
}