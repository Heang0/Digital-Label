import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  getDoc, 
  doc as fsDoc,
  Timestamp,
  limit,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Company, SystemMetrics, AuditLog, LabelSyncRecord } from '@/types';

export const useAdminData = (currentUser: any) => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [syncRecords, setSyncRecords] = useState<LabelSyncRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalCompanies: 0,
    totalLabels: 0,
    totalBranches: 0,
    systemHealth: 99.8,
    apiResponseTime: 42,
    databaseLoad: 68,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    trialAccounts: 0,
    activeUsers24h: 1250,
    totalRevenue: 0,
    conversionRate: 4.2
  });

  const loadData = async (minDelayMs = 0) => {
    const startTime = Date.now();
    try {
      setLoading(true);
      
      const usersQuery = query(collection(db, 'users'), where('role', 'in', ['vendor', 'admin']));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      const uniqueVendors = Array.from(
        new Map(
          usersData.map((u) => [
            (u.companyId && u.companyId.trim())
              ? u.companyId.trim()
              : (u.email || '').toLowerCase(),
            u,
          ])
        ).values()
      );

      setUsers(uniqueVendors);

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

          const productsQuery = query(collection(db, 'products'), where('companyId', '==', doc.id));
          const productsSnapshot = await getDocs(productsQuery);

          const categoriesQuery = query(collection(db, 'categories'), where('companyId', '==', doc.id));
          const categoriesSnapshot = await getDocs(categoriesQuery);
          
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
            labelsCount: labelsSnapshot.size,
            productsCount: productsSnapshot.size,
            categoriesCount: categoriesSnapshot.size
          } as any;
        })
      );
      setCompanies(companiesData);

      // Calculate system metrics
      const totalLabels = companiesData.reduce((sum, company) => sum + (company.labelsCount || 0), 0);
      const totalBranches = companiesData.reduce((sum, company) => sum + (company.branchesCount || 0), 0);
      const activeSubscriptions = companiesData.filter(c => c.status === 'active').length;
      const trialAccounts = companiesData.filter(c => c.subscription === 'basic').length;
      
      setSystemMetrics({
        totalUsers: uniqueVendors.length,
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

      // Load Audit Logs
      const auditSnapshot = await getDocs(query(collection(db, 'audit_logs'), limit(50), orderBy('timestamp', 'desc')));
      const auditData = auditSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditLog[];
      setAuditLogs(auditData);

      // Load Sync Records
      const syncSnapshot = await getDocs(query(collection(db, 'label_syncs'), limit(50), orderBy('lastAttempt', 'desc')));
      const syncData = syncSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LabelSyncRecord[];
      setSyncRecords(syncData);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      const elapsed = Date.now() - startTime;
      if (minDelayMs > elapsed) {
        await new Promise((resolve) => setTimeout(resolve, minDelayMs - elapsed));
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadData();
    }
  }, [currentUser]);

  return {
    users,
    companies,
    auditLogs,
    syncRecords,
    loading,
    systemMetrics,
    refreshData: () => loadData(400)
  };
};
