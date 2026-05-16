export interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  productCode?: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface POSTabProps {
  branchProducts: any[];
  updateStock: (productId: string, value: number, mode: 'set' | 'adjust', silent?: boolean) => Promise<void>;
  onRefresh: () => void;
  currentUser: any;
  branch: any;
  openLabelNotice: (title: string, message: string, tone: any) => void;
}
