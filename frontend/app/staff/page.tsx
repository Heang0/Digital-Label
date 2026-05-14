'use client';

import { useUserStore } from '@/lib/user-store';

// The Manager gets the FULL vendor experience
import { ManagerStaffPage } from './ManagerView';
import { RegularStaffPage } from './StaffView';

export default function StaffPage() {
  const { user, hasHydrated } = useUserStore();
  
  if (!hasHydrated) return null;

  // Manager gets the full vendor-level experience
  if (user?.position === 'Manager') {
    return <ManagerStaffPage />;
  }

  // Regular staff (Cashier, Stock, IT, etc.)
  return <RegularStaffPage />;
}
