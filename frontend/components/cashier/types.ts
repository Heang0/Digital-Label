import { Timestamp } from 'firebase/firestore';

export type StaffUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'vendor' | 'staff';
  branchId?: string;
  position?: string;
};

export type Branch = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  productCode?: string;
  category: string;
  imageUrl?: string | null;
};

export type BranchProduct = {
  id: string;
  productId: string;
  currentPrice: number;
  stock: number;
  productDetails?: Product;
};

export type DigitalLabel = {
  id: string;
  productId: string | null;
  branchId: string;
  basePrice?: number | null;
  finalPrice?: number | null;
  discountPercent?: number | null;
};

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  category?: string;
  qty: number;
  baseUnitPrice: number;
  finalUnitPrice: number;
  discountPercent?: number | null;
  imageUrl?: string | null;
};

export type SaleRecord = {
  id: string;
  receiptNo: string;
  createdAt: Timestamp;
  items: any[];
  subtotal: number;
  discountTotal: number;
  total: number;
  staffName?: string;
  branchId: string;
};

export function money(n: number) {
  if (!Number.isFinite(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
}
