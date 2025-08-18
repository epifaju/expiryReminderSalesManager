import apiClient, {handleApiError} from './api';

// Types pour les rapports
export interface SalesReport {
  period: string;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  topProducts: ProductSalesData[];
  salesByPaymentMethod: PaymentMethodData[];
  dailyBreakdown: DailySalesData[];
}

export interface ProductSalesData {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
  profit: number;
}

export interface PaymentMethodData {
  paymentMethod: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface DailySalesData {
  date: string;
  salesCount: number;
  revenue: number;
  profit: number;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockProducts: LowStockProduct[];
  expiringProducts: ExpiringProduct[];
  expiredProducts: ExpiredProduct[];
  categoryBreakdown: CategoryData[];
}

export interface LowStockProduct {
  id: number;
  name: string;
  currentStock: number;
  minStockLevel: number;
  category: string;
}

export interface ExpiringProduct {
  id: number;
  name: string;
  expiryDate: string;
  daysUntilExpiry: number;
  stockQuantity: number;
}

export interface ExpiredProduct {
  id: number;
  name: string;
  expiryDate: string;
  daysSinceExpiry: number;
  stockQuantity: number;
}

export interface CategoryData {
  category: string;
  productCount: number;
  totalValue: number;
  percentage: number;
}

export interface FinancialReport {
  period: string;
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  expenses: ExpenseData[];
  revenueByCategory: CategoryRevenueData[];
}

export interface ExpenseData {
  category: string;
  amount: number;
  percentage: number;
}

export interface CategoryRevenueData {
  category: string;
  revenue: number;
  profit: number;
  margin: number;
}

export interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  expiringProductsCount: number;
  expiredProductsCount: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  topSellingProducts: ProductSalesData[];
  recentActivity: ActivityData[];
}

export interface ActivityData {
  id: number;
  type: 'SALE' | 'PRODUCT_ADDED' | 'STOCK_UPDATE' | 'LOW_STOCK_ALERT' | 'EXPIRY_ALERT';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export enum ReportPeriod {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  THIS_WEEK = 'THIS_WEEK',
  LAST_WEEK = 'LAST_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  THIS_YEAR = 'THIS_YEAR',
  CUSTOM = 'CUSTOM',
}

export interface ReportFilters {
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
  category?: string;
  productId?: number;
}

class ReportService {
  /**
   * Récupérer les statistiques du tableau de bord
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>('/api/reports/dashboard');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer le rapport des ventes
   */
  async getSalesReport(filters: ReportFilters): Promise<SalesReport> {
    try {
      const params = new URLSearchParams();
      params.append('period', filters.period);
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.category) params.append('category', filters.category);
      if (filters.productId) params.append('productId', filters.productId.toString());

      const response = await apiClient.get<SalesReport>(`/api/reports/sales?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer le rapport d'inventaire
   */
  async getInventoryReport(): Promise<InventoryReport> {
    try {
      const response = await apiClient.get<InventoryReport>('/api/reports/inventory');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer le rapport financier
   */
  async getFinancialReport(filters: ReportFilters): Promise<FinancialReport> {
    try {
      const params = new URLSearchParams();
      params.append('period', filters.period);
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await apiClient.get<FinancialReport>(`/api/reports/financial?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer les produits les plus vendus
   */
  async getTopSellingProducts(period: ReportPeriod, limit: number = 10): Promise<ProductSalesData[]> {
    try {
      const response = await apiClient.get<ProductSalesData[]>(
        `/api/reports/top-products?period=${period}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer les ventes par période
   */
  async getSalesByPeriod(
    period: ReportPeriod,
    startDate?: string,
    endDate?: string
  ): Promise<DailySalesData[]> {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get<DailySalesData[]>(`/api/reports/sales-by-period?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer l'activité récente
   */
  async getRecentActivity(limit: number = 20): Promise<ActivityData[]> {
    try {
      const response = await apiClient.get<ActivityData[]>(`/api/reports/activity?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Exporter un rapport en PDF
   */
  async exportReportToPDF(reportType: 'sales' | 'inventory' | 'financial', filters: ReportFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      params.append('period', filters.period);
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.category) params.append('category', filters.category);

      const response = await apiClient.get(`/api/reports/${reportType}/export/pdf?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Exporter un rapport en Excel
   */
  async exportReportToExcel(reportType: 'sales' | 'inventory' | 'financial', filters: ReportFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      params.append('period', filters.period);
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.category) params.append('category', filters.category);

      const response = await apiClient.get(`/api/reports/${reportType}/export/excel?${params.toString()}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupérer les périodes de rapport disponibles
   */
  getReportPeriods(): ReportPeriod[] {
    return Object.values(ReportPeriod);
  }

  /**
   * Formater une période pour l'affichage
   */
  formatPeriodLabel(period: ReportPeriod): string {
    const labels: Record<ReportPeriod, string> = {
      [ReportPeriod.TODAY]: "Aujourd'hui",
      [ReportPeriod.YESTERDAY]: 'Hier',
      [ReportPeriod.THIS_WEEK]: 'Cette semaine',
      [ReportPeriod.LAST_WEEK]: 'Semaine dernière',
      [ReportPeriod.THIS_MONTH]: 'Ce mois',
      [ReportPeriod.LAST_MONTH]: 'Mois dernier',
      [ReportPeriod.THIS_YEAR]: 'Cette année',
      [ReportPeriod.CUSTOM]: 'Période personnalisée',
    };
    
    return labels[period];
  }

  /**
   * Calculer les dates pour une période donnée
   */
  getPeriodDates(period: ReportPeriod): { startDate: string; endDate: string } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case ReportPeriod.TODAY:
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
        
      case ReportPeriod.YESTERDAY:
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: yesterday.toISOString().split('T')[0],
          endDate: yesterday.toISOString().split('T')[0],
        };
        
      case ReportPeriod.THIS_WEEK:
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
        
      case ReportPeriod.LAST_WEEK:
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        return {
          startDate: lastWeekStart.toISOString().split('T')[0],
          endDate: lastWeekEnd.toISOString().split('T')[0],
        };
        
      case ReportPeriod.THIS_MONTH:
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
        
      case ReportPeriod.LAST_MONTH:
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          startDate: lastMonthStart.toISOString().split('T')[0],
          endDate: lastMonthEnd.toISOString().split('T')[0],
        };
        
      case ReportPeriod.THIS_YEAR:
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        return {
          startDate: startOfYear.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
        
      default:
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
    }
  }
}

export default new ReportService();
