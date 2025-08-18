import apiClient, {handleApiError} from './api';

// Types pour les produits
export interface Product {
  id: number;
  name: string;
  description?: string;
  barcode?: string;
  category?: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  expiryDate?: string;
  manufacturingDate?: string;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  name: string;
  description?: string;
  barcode?: string;
  category?: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  expiryDate?: string;
  manufacturingDate?: string;
  unit: string;
}

export interface ProductResponse {
  id: number;
  name: string;
  description?: string;
  barcode?: string;
  category?: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  expiryDate?: string;
  manufacturingDate?: string;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  lowStock?: boolean;
  expiring?: boolean;
  expired?: boolean;
  page?: number;
  size?: number;
}

export interface ProductsPageResponse {
  content: ProductResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

class ProductService {
  /**
   * Récupérer tous les produits avec filtres et pagination
   */
  async getProducts(filters: ProductFilters = {}): Promise<ProductsPageResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.lowStock) params.append('lowStock', 'true');
      if (filters.expiring) params.append('expiring', 'true');
      if (filters.expired) params.append('expired', 'true');
      if (filters.page !== undefined) params.append('page', filters.page.toString());
      if (filters.size !== undefined) params.append('size', filters.size.toString());

      const response = await apiClient.get<ProductsPageResponse>(`/api/products?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer un produit par ID
   */
  async getProductById(id: number): Promise<ProductResponse> {
    try {
      const response = await apiClient.get<ProductResponse>(`/api/products/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Créer un nouveau produit
   */
  async createProduct(productData: ProductRequest): Promise<ProductResponse> {
    try {
      const response = await apiClient.post<ProductResponse>('/api/products', productData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Mettre à jour un produit
   */
  async updateProduct(id: number, productData: ProductRequest): Promise<ProductResponse> {
    try {
      const response = await apiClient.put<ProductResponse>(`/api/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Supprimer un produit
   */
  async deleteProduct(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/products/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Rechercher des produits par code-barres
   */
  async getProductByBarcode(barcode: string): Promise<ProductResponse> {
    try {
      const response = await apiClient.get<ProductResponse>(`/api/products/barcode/${barcode}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer les produits avec stock faible
   */
  async getLowStockProducts(): Promise<ProductResponse[]> {
    try {
      const response = await apiClient.get<ProductResponse[]>('/api/products/low-stock');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer les produits expirants
   */
  async getExpiringProducts(days: number = 7): Promise<ProductResponse[]> {
    try {
      const response = await apiClient.get<ProductResponse[]>(`/api/products/expiring?days=${days}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer les produits expirés
   */
  async getExpiredProducts(): Promise<ProductResponse[]> {
    try {
      const response = await apiClient.get<ProductResponse[]>('/api/products/expired');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer les catégories de produits
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/api/products/categories');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Mettre à jour le stock d'un produit
   */
  async updateStock(id: number, quantity: number): Promise<ProductResponse> {
    try {
      const response = await apiClient.patch<ProductResponse>(`/api/products/${id}/stock`, {
        quantity,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer les statistiques des produits
   */
  async getProductStats(): Promise<{
    totalProducts: number;
    lowStockCount: number;
    expiringCount: number;
    expiredCount: number;
    totalValue: number;
  }> {
    try {
      const response = await apiClient.get('/api/products/stats');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export default new ProductService();
