// Types unifiés pour les ventes dans toute l'application

export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  subtotal?: number;
}

export interface Sale {
  id: number;
  saleNumber?: string;
  saleDate: string;
  totalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  finalAmount?: number;
  paymentMethod: PaymentMethod | string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdByUsername?: string;
  // Support legacy field names
  saleItems?: SaleItem[];
  items?: SaleItem[];
  totalProfit?: number;
  totalQuantity?: number;
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  TRANSFER = 'TRANSFER',
  CREDIT = 'CREDIT',
}

// Types pour les requêtes API
export interface SaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface SaleRequest {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  saleItems: SaleItemRequest[];
  discountAmount?: number;
  taxAmount?: number;
  paymentMethod: PaymentMethod;
  saleDate: string; // ISO string format
  notes?: string;
}

// Types pour les réponses API (backend compatibility)
export interface SaleItemResponse {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleResponse {
  id: number;
  saleNumber?: string;
  saleDate: string;
  totalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  finalAmount?: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdByUsername?: string;
  saleItems: SaleItemResponse[];
  totalProfit?: number;
  totalQuantity?: number;
}
