import apiClient from './apiClient';
import { Sale, SaleItem, PaymentMethod } from '../types/sales';

export interface Product {
  id: number;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  category: string;
  purchasePrice: number;
}

export interface ReportStats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  salesByPaymentMethod: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  salesByPeriod: Array<{
    period: string;
    sales: number;
    revenue: number;
  }>;
  profitAnalysis: {
    totalCost: number;
    totalRevenue: number;
    grossProfit: number;
    profitMargin: number;
  };
}

class ReportService {
  async getSales(): Promise<Sale[]> {
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
      // Return mock data as fallback
      return this.getMockSales();
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.get('/products');
      
      if (response.data && response.data.content) {
        return response.data.content;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error loading products:', error);
      // Return mock data as fallback
      return this.getMockProducts();
    }
  }

  async getReportData(period: 'today' | 'week' | 'month' | 'year'): Promise<{ sales: Sale[], products: Product[], stats: ReportStats }> {
    const [sales, products] = await Promise.all([
      this.getSales(),
      this.getProducts()
    ]);

    const stats = this.calculateStats(sales, products, period);

    return { sales, products, stats };
  }

  private calculateStats(salesData: Sale[], productsData: Product[], selectedPeriod: string): ReportStats {
    const filteredSales = this.filterSalesByPeriod(salesData, selectedPeriod);
    
    // Basic stats with validation
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => {
      const amount = sale.finalAmount || sale.totalAmount || 0;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Top selling products - handle both saleItems and items field names
    const productSales: { [key: string]: { quantity: number; revenue: number } } = {};
    filteredSales.forEach(sale => {
      // Use saleItems if available, otherwise fall back to items
      const items = sale.saleItems || sale.items || [];
      items.forEach(item => {
        if (item && item.productName && typeof item.quantity === 'number' && typeof item.totalPrice === 'number') {
          if (!productSales[item.productName]) {
            productSales[item.productName] = { quantity: 0, revenue: 0 };
          }
          productSales[item.productName].quantity += item.quantity;
          productSales[item.productName].revenue += item.totalPrice;
        }
      });
    });

    const topSellingProducts = Object.entries(productSales)
      .map(([productName, data]) => ({
        productName,
        totalQuantity: data.quantity,
        totalRevenue: data.revenue,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    // Sales by payment method with validation
    const paymentMethods: { [key: string]: { count: number; amount: number } } = {};
    filteredSales.forEach(sale => {
      const method = sale.paymentMethod || 'UNKNOWN';
      const amount = sale.finalAmount || sale.totalAmount || 0;
      
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].amount += (typeof amount === 'number' ? amount : 0);
    });

    const salesByPaymentMethod = Object.entries(paymentMethods).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount,
    }));

    // Sales by period (daily for last 7 days)
    const salesByPeriod = this.generatePeriodData(filteredSales, selectedPeriod);

    // Profit analysis with better validation
    let totalCost = 0;
    filteredSales.forEach(sale => {
      // Use totalProfit from backend if available
      if (sale.totalProfit && typeof sale.totalProfit === 'number') {
        // If backend provides totalProfit, we can calculate totalCost
        const saleRevenue = sale.finalAmount || sale.totalAmount || 0;
        totalCost += saleRevenue - sale.totalProfit;
      } else {
        // Calculate from items if totalProfit not available
        const items = sale.saleItems || sale.items || [];
        items.forEach(item => {
          if (item && typeof item.productId === 'number' && typeof item.quantity === 'number') {
            const product = productsData.find(p => p.id === item.productId);
            if (product && typeof product.purchasePrice === 'number') {
              totalCost += product.purchasePrice * item.quantity;
            }
          }
        });
      }
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalSales,
      totalRevenue,
      totalProducts: productsData.length,
      averageOrderValue,
      topSellingProducts,
      salesByPaymentMethod,
      salesByPeriod,
      profitAnalysis: {
        totalCost,
        totalRevenue,
        grossProfit,
        profitMargin,
      },
    };
  }

  private filterSalesByPeriod(salesData: Sale[], period: string): Sale[] {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return salesData.filter(sale => new Date(sale.saleDate) >= startDate);
  }

  private generatePeriodData(salesData: Sale[], period: string) {
    const data = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      
      const daySales = salesData.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate.toDateString() === date.toDateString();
      });

      data.push({
        period: dateStr,
        sales: daySales.length,
        revenue: daySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      });
    }

    return data;
  }

  private getMockSales(): Sale[] {
    return [
      {
        id: 1,
        saleDate: new Date().toISOString(),
        totalAmount: 45.50,
        paymentMethod: 'CASH',
        status: 'COMPLETED',
        items: [
          { productId: 1, productName: 'Coca-Cola 33cl', quantity: 2, unitPrice: 1.50, totalPrice: 3.00 },
          { productId: 2, productName: 'Pain de mie', quantity: 1, unitPrice: 2.50, totalPrice: 2.50 }
        ]
      },
      {
        id: 2,
        saleDate: new Date(Date.now() - 86400000).toISOString(),
        totalAmount: 32.00,
        paymentMethod: 'CARD',
        status: 'COMPLETED',
        items: [
          { productId: 1, productName: 'Coca-Cola 33cl', quantity: 3, unitPrice: 1.50, totalPrice: 4.50 }
        ]
      }
    ];
  }

  private getMockProducts(): Product[] {
    return [
      { id: 1, name: 'Coca-Cola 33cl', sellingPrice: 1.50, stockQuantity: 50, category: 'Boissons', purchasePrice: 0.80 },
      { id: 2, name: 'Pain de mie', sellingPrice: 2.50, stockQuantity: 20, category: 'Boulangerie', purchasePrice: 1.20 }
    ];
  }
}

export const reportService = new ReportService();
