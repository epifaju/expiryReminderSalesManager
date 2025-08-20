import apiClient from './apiClient';

const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;
    let message = data.message || 'Erreur inconnue';
    
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
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  name: string;
  description?: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  expiryDate?: string;
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

  async getProductById(id: number) {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return response.data;
    } catch (error) {
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

  async updateProduct(id: number, productData: Partial<ProductRequest>) {
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

    if (!productData.category?.trim()) {
      errors.push('La catégorie est requise');
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
