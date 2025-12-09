export enum Currency {
  INR = 'INR',
  USD = 'USD',
  AED = 'AED',
  EUR = 'EUR'
}

export type DataSource = 'MYSQL_API' | 'LOCAL_STORAGE';

export interface GlobalSettings {
  dataSource: DataSource;
  mysqlApiUrl: string; // The backend endpoint for MySQL connection
  defaultTaxPresets: number[];
}

export interface Store {
  id: string;
  name: string;
  ownerName: string;
  currency: Currency;
  gstNumber?: string;
  address: string;
  primaryUpiId?: string;
  secondaryUpiId?: string;
  activeUpiIdType?: 'PRIMARY' | 'SECONDARY';
  isActive: boolean;
  email?: string;
  mobile?: string;
  logoUrl?: string;
  timezone?: string;
  globalDiscount?: number; // Store-wide default discount (Limited period)
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  defaultGST: number; // Percentage
  defaultDiscount?: number; // Default category discount %
  lowStockThreshold?: number; // Quantity at which to trigger alert
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  price: number;
  stockQty: number;
  taxOverride?: number | null; // If null, use category default
  sku?: string;
  imageUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
  appliedTaxPercent: number;
  appliedDiscountPercent: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  storeId: string;
  date: string; // ISO string
  items: CartItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'QR';
  synced: boolean;
}

export type ViewMode = 'SUPER_ADMIN' | 'STORE_ADMIN' | 'POS' | 'PROFILE';
export type UserRole = 'SUPER_ADMIN' | 'STORE_ADMIN' | 'CASHIER';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  storeId?: string; // specific store assignment
  email?: string;
  imageUrl?: string;
}

export interface UserContextType {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  activeStoreId: string | null;
  setActiveStoreId: (id: string) => void;
}

export interface DataContextType {
  stores: Store[];
  categories: Category[];
  products: Product[];
  invoices: Invoice[];
  addStore: (store: Store) => void;
  addCategory: (cat: Category) => void;
  addProduct: (prod: Product) => void;
  addInvoice: (inv: Invoice) => void;
  updateProductStock: (id: string, qty: number) => void;
}