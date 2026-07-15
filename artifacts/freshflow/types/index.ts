export interface Area {
  id: string;
  name: string;
  createdAt: string;
  isSub?: boolean;
}

export interface Street {
  id: string;
  areaId: string;
  areaName: string;
  name: string;
  createdAt: string;
  isSub?: boolean;
}

export interface Customer {
  id: string;
  streetId: string;
  streetName: string;
  areaId: string;
  areaName: string;
  name: string;
  phone: string;
  phone2: string;
  houseNumber: string;
  address: string;
  notes: string;
  whatsapp: string;
  outstandingBalance: number;
  totalOrders: number;
  totalPaid: number;
  customerSince: string;
  lastOrderDate: string;
}

export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'online' | 'upi' | 'card';
export type DeliveryStatus = 'pending' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  roundedAmount: number;
  deliveryCharge: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  deliveryStatus: DeliveryStatus;
  notes: string;
  createdAt: string;
}

export type ItemCategory = 'Vegetables' | 'Fruits' | 'Groceries' | 'Medicines';
export type ItemUnit = 'Kg' | 'Gram' | 'Dozen' | 'Liter' | 'Piece' | 'Packet';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  unit: ItemUnit;
}

export type ExpenseCategory =
  | 'Transport'
  | 'Utilities'
  | 'Salaries'
  | 'Supplies'
  | 'Maintenance'
  | 'Other';

export interface Expense {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes: string;
  paymentMethod: PaymentMethod;
}

export interface AppSettings {
  businessName: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  deliveryCharge: number;
  smartRounding: boolean;
  currency: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  businessName: 'My Business',
  ownerName: 'Owner',
  phone: '',
  whatsapp: '',
  deliveryCharge: 10,
  smartRounding: true,
  currency: '₹',
};

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function smartRound(amount: number): number {
  return Math.ceil(amount / 10) * 10;
}

export function formatCurrency(amount: number, currency = '₹'): string {
  return `${currency}${amount.toFixed(2)}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export const ITEM_CATEGORIES: ItemCategory[] = ['Vegetables', 'Fruits', 'Groceries', 'Medicines'];
export const ITEM_UNITS: ItemUnit[] = ['Kg', 'Gram', 'Dozen', 'Liter', 'Piece', 'Packet'];
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Transport', 'Utilities', 'Salaries', 'Supplies', 'Maintenance', 'Other',
];
export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'online', 'upi', 'card'];
