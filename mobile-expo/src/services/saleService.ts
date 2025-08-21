import apiClient from './apiClient';

const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;
    let message = data.message || 'Erreur inconnue';
    
    // Handle validation errors specifically
    if (status === 400 && data.error) {
      message = data.error;
    } else if (status === 400 && typeof data === 'string') {
      message = data;
    } else {
      switch (status) {
        case 400:
          message = 'Données invalides - Vérifiez que tous les champs requis sont remplis';
          break;
        case 401:
          message = 'Authentification requise';
          break;
        case 403:
          message = 'Accès refusé';
          break;
        case 404:
          message = 'Ressource introuvable';
          break;
        case 500:
          message = 'Erreur serveur';
          break;
      }
    }
    
    throw new Error(`Erreur ${status}: ${message}`);
  } else if (error.request) {
    throw new Error('Pas de réponse du serveur');
  } else {
    throw new Error('Erreur de configuration de la requête');
  }
};

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
  saleDate: string; // ISO string format - required
  notes?: string;
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT = 'CREDIT',
}

class SaleService {
  async getSales(): Promise<SaleResponse[]> {
    try {
      const response = await apiClient.get('/sales');
      
      if (response.data && response.data.content) {
        return response.data.content;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error loading sales:', error);
      handleApiError(error);
      throw error;
    }
  }

  async createSale(saleData: SaleRequest) {
    try {
      // Ensure saleDate is always provided
      const requestData = {
        ...saleData,
        saleDate: saleData.saleDate || new Date().toISOString(),
        // Ensure saleItems is not empty and properly formatted
        saleItems: saleData.saleItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0
        }))
      };
      
      const response = await apiClient.post('/sales', requestData);
      
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  private calculateSaleTotal(items: SaleItemRequest[], discount: number, tax: number) {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return {
      subtotal,
      total: subtotal - discount + tax
    };
  }

  validateSaleData(saleData: SaleRequest): string[] {
    const errors: string[] = [];
    
    if (!saleData.saleItems?.length) {
      errors.push('Ajoutez au moins un produit');
    } else {
      saleData.saleItems.forEach((item, index) => {
        if (!item.productId) errors.push(`Produit manquant ligne ${index + 1}`);
        if (item.quantity <= 0) errors.push(`Quantité invalide ligne ${index + 1}`);
      });
    }
    
    if (!saleData.paymentMethod) {
      errors.push('Sélectionnez un mode de paiement');
    }
    
    return errors;
  }

  getPaymentMethods() {
    return Object.values(PaymentMethod);
  }
}

export default new SaleService();
