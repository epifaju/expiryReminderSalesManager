import apiClient from './apiClient';
import { barcodeLookupCandidates } from '../bluetooth/gs1BarcodeParser';

const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;
    let message = data?.message || data?.error || 'Erreur inconnue';
    
    switch (status) {
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
    
    throw new Error(`Erreur ${status}: ${message}`);
  } else if (error.request) {
    throw new Error('Pas de réponse du serveur');
  } else {
    throw new Error('Erreur de configuration de la requête');
  }
};

export interface Product {
  id: number;
  name: string;
  description?: string;
  barcode?: string;
  category?: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  expiryDate?: string;
  manufacturingDate?: string;
  imageUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdByUsername?: string;
  isLowStock?: boolean;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  profit?: number;
  profitMargin?: number;
}

export interface ProductRequest {
  name: string;
  description?: string;
  barcode?: string;
  category?: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  expiryDate?: string;
  manufacturingDate?: string;
  imageUrl?: string;
  isActive?: boolean;
}

class ProductService {
  async getProducts() {
    try {
      const response = await apiClient.get('/products?size=100'); // Récupérer plus de produits
      // Le backend retourne un format paginé, on extrait le contenu
      return response.data.content || response.data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      handleApiError(error);
      throw error;
    }
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    const candidates = barcodeLookupCandidates(barcode);
    if (candidates.length === 0) {
      return null;
    }

    const mapPayload = (payload: any): Product => ({
      id: payload.id,
      name: payload.name,
      barcode: payload.barcode,
      category: payload.category,
      unit: payload.unit ?? 'pcs',
      purchasePrice: Number(payload.purchasePrice ?? payload.salePrice ?? 0),
      sellingPrice: Number(payload.salePrice ?? payload.sellingPrice ?? 0),
      stockQuantity: Number(payload.stockQuantity ?? 0),
      minStockLevel: Number(payload.minStockLevel ?? 0),
      expiryDate: payload.expirationDate ?? payload.expiryDate,
      isActive: payload.isActive ?? true,
    });

    const paths = ['/products/barcode/', '/api/v1/products/barcode/'];
    const lookupConfig = {
      silentNotFound: true,
      validateStatus: (status: number) => status === 200 || status === 404,
    };

    for (const code of candidates) {
      for (const pathPrefix of paths) {
        const response = await apiClient.get(
          `${pathPrefix}${encodeURIComponent(code)}`,
          lookupConfig
        );
        if (response.status === 404) {
          continue;
        }
        const payload = response.data?.data ?? response.data;
        if (payload?.id) {
          return mapPayload(payload);
        }
      }
    }

    return null;
  }

  async getProductById(id: number) {
    const product = await this.getProductByIdOptional(id);
    if (!product) {
      throw new Error('Erreur 404: Ressource introuvable');
    }
    return product;
  }

  /** Retourne null si le produit n'existe pas dans l'organisation courante (sans log d'erreur). */
  async getProductByIdOptional(id: number): Promise<Product | null> {
    try {
      const response = await apiClient.get(`/products/${id}`, {
        silentNotFound: true,
        validateStatus: (status: number) => status === 200 || status === 404,
      });
      if (response.status === 404) {
        return null;
      }
      return response.data;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return null;
      }
      handleApiError(error);
      throw error;
    }
  }

  async createProduct(productData: ProductRequest) {
    try {
      const response = await apiClient.post('/products', productData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async updateProduct(id: number, productData: ProductRequest) {
    try {
      const response = await apiClient.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async deleteProduct(id: number) {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  async getExpiringProducts(warningDays: number = 7) {
    try {
      const response = await apiClient.get(`/products/alerts/expiring?warningDays=${warningDays}`);
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des produits expirants:', error);
      handleApiError(error);
      throw error;
    }
  }

  async getExpiredProducts() {
    try {
      const response = await apiClient.get('/products/alerts/expired');
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des produits expirés:', error);
      handleApiError(error);
      throw error;
    }
  }

  async getLowStockProducts() {
    try {
      const response = await apiClient.get('/products/alerts/low-stock');
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des produits en stock faible:', error);
      handleApiError(error);
      throw error;
    }
  }

  async getProductStats() {
    try {
      const response = await apiClient.get('/products/stats');
      return response.data || {};
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques produits:', error);
      handleApiError(error);
      throw error;
    }
  }

  validateProductData(productData: ProductRequest): string[] {
    const errors: string[] = [];

    if (!productData.name?.trim()) {
      errors.push('Le nom du produit est requis');
    }

    if (!productData.unit?.trim()) {
      errors.push('L\'unité est requise');
    }

    if (productData.purchasePrice <= 0) {
      errors.push('Le prix d\'achat doit être supérieur à 0');
    }

    if (productData.sellingPrice <= 0) {
      errors.push('Le prix de vente doit être supérieur à 0');
    }

    if (productData.stockQuantity < 0) {
      errors.push('La quantité en stock ne peut pas être négative');
    }

    if (productData.minStockLevel < 0) {
      errors.push('Le niveau de stock minimum ne peut pas être négatif');
    }

    return errors;
  }

  // Utility methods for date handling
  isExpired(expiryDate: string | null): boolean {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  }

  isExpiringSoon(expiryDate: string | null, warningDays: number = 7): boolean {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + warningDays);
    return expiry <= warningDate && expiry >= today;
  }

  getDaysUntilExpiry(expiryDate: string | null): number | null {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

export default new ProductService();
