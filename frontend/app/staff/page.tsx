'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/user-store';

// The Manager gets the FULL vendor experience
import { ManagerStaffPage } from './ManagerView';
import { RegularStaffPage } from './StaffView';

export default function StaffPage() {
  const { user, hasHydrated } = useUserStore();
  const router = useRouter();
  const redirecting = useRef(false);

  useEffect(() => {
    if (!hasHydrated || redirecting.current) return;
    if (!user) {
      redirecting.current = true;
      router.replace('/login');
    }
  }, [user, hasHydrated, router]);
  
  if (!hasHydrated) return null;

  const isManager = user?.position?.toLowerCase() === 'manager';
  if (isManager || user?.permissions?.canCreateProducts || user?.permissions?.canCreateLabels) {
    return <ManagerStaffPage />;
  }

  // Regular staff (Cashier, Stock, IT, etc.)
  return <RegularStaffPage />;
}
