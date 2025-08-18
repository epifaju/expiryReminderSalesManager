import apiClient, {handleApiError} from './api';

// Types pour les ventes
export interface SaleItem {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id: number;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface SaleRequest {
  customerName?: string;
  customerPhone?: string;
  items: SaleItemRequest[];
  discount?: number;
  tax?: number;
  paymentMethod: PaymentMethod;
}

export interface SaleResponse {
  id: number;
  customerName?: string;
  customerPhone?: string;
  items: SaleItemResponse[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItemResponse {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT = 'CREDIT',
}

export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface SaleFilters {
  startDate?: string;
  endDate?: string;
  customerName?: string;
  paymentMethod?: PaymentMethod;
  status?: SaleStatus;
  page?: number;
  size?: number;
}

export interface SalesPageResponse {
  content: SaleResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface SalesStats {
  todaySales: number;
  todayRevenue: number;
  weeklySales: number;
  weeklyRevenue: number;
  monthlySales: number;
  monthlyRevenue: number;
  totalSales: number;
  totalRevenue: number;
}

export interface DailySalesReport {
  date: string;
  salesCount: number;
  revenue: number;
  profit: number;
}

class SaleService {
  /**
   * Récupérer toutes les ventes avec filtres et pagination
   */
  async getSales(filters: SaleFilters = {}): Promise<SalesPageResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.customerName) params.append('customerName', filters.customerName);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.status) params.append('status', filters.status);
      if (filters.page !== undefined) params.append('page', filters.page.toString());
      if (filters.size !== undefined) params.append('size', filters.size.toString());

      const response = await apiClient.get<SalesPageResponse>(`/api/sales?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer une vente par ID
   */
  async getSaleById(id: number): Promise<SaleResponse> {
    try {
      const response = await apiClient.get<SaleResponse>(`/api/sales/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Créer une nouvelle vente
   */
  async createSale(saleData: SaleRequest): Promise<SaleResponse> {
    try {
      const response = await apiClient.post<SaleResponse>('/api/sales', saleData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Mettre à jour une vente
   */
  async updateSale(id: number, saleData: Partial<SaleRequest>): Promise<SaleResponse> {
    try {
      const response = await apiClient.put<SaleResponse>(`/api/sales/${id}`, saleData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Annuler une vente
   */
  async cancelSale(id: number): Promise<SaleResponse> {
    try {
      const response = await apiClient.patch<SaleResponse>(`/api/sales/${id}/cancel`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Rembourser une vente
   */
  async refundSale(id: number): Promise<SaleResponse> {
    try {
      const response = await apiClient.patch<SaleResponse>(`/api/sales/${id}/refund`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer les statistiques des ventes
   */
  async getSalesStats(): Promise<SalesStats> {
    try {
      const response = await apiClient.get<SalesStats>('/api/sales/stats');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer les ventes récentes
   */
  async getRecentSales(limit: number = 10): Promise<SaleResponse[]> {
    try {
      const response = await apiClient.get<SaleResponse[]>(`/api/sales/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer les ventes du jour
   */
  async getTodaySales(): Promise<SaleResponse[]> {
    try {
      const response = await apiClient.get<SaleResponse[]>('/api/sales/today');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer le rapport des ventes quotidiennes
   */
  async getDailySalesReport(startDate: string, endDate: string): Promise<DailySalesReport[]> {
    try {
      const response = await apiClient.get<DailySalesReport[]>(
        `/api/sales/daily-report?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Générer un reçu PDF pour une vente
   */
  async generateReceipt(saleId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(`/api/sales/${saleId}/receipt`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer les méthodes de paiement disponibles
   */
  getPaymentMethods(): PaymentMethod[] {
    return Object.values(PaymentMethod);
  }

  /**
   * Récupérer les statuts de vente disponibles
   */
  getSaleStatuses(): SaleStatus[] {
    return Object.values(SaleStatus);
  }

  /**
   * Calculer le total d'une vente
   */
  calculateSaleTotal(items: SaleItemRequest[], discount: number = 0, tax: number = 0): {
    subtotal: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal - discount + tax;
    
    return {
      subtotal,
      total,
    };
  }

  /**
   * Valider les données d'une vente
   */
  validateSaleData(saleData: SaleRequest): string[] {
    const errors: string[] = [];

    if (!saleData.items || saleData.items.length === 0) {
      errors.push('Au moins un article est requis');
    }

    saleData.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Produit requis pour l'article ${index + 1}`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Quantité valide requise pour l'article ${index + 1}`);
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        errors.push(`Prix unitaire valide requis pour l'article ${index + 1}`);
      }
    });

    if (!saleData.paymentMethod) {
      errors.push('Méthode de paiement requise');
    }

    return errors;
  }
}

export default new SaleService();
