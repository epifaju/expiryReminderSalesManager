// Export des services API
export { default as apiClient, handleApiError } from './api';
export type { ApiResponse, ApiError } from './api';

export { default as authService } from './authService';
export type {
  LoginRequest,
  SignupRequest,
  User,
  JwtResponse,
  AuthResponse,
} from './authService';

export { default as productService } from './productService';
export type {
  Product,
  ProductRequest,
  ProductResponse,
  ProductFilters,
  ProductsPageResponse,
} from './productService';

export { default as saleService } from './saleService';
export type {
  Sale,
  SaleItem,
  SaleRequest,
  SaleResponse,
  SaleItemRequest,
  SaleItemResponse,
  SaleFilters,
  SalesPageResponse,
  SalesStats,
  DailySalesReport,
  PaymentMethod,
  SaleStatus,
} from './saleService';

export { default as reportService } from './reportService';
export type {
  SalesReport,
  InventoryReport,
  FinancialReport,
  DashboardStats,
  ProductSalesData,
  PaymentMethodData,
  DailySalesData,
  LowStockProduct,
  ExpiringProduct,
  ExpiredProduct,
  CategoryData,
  ActivityData,
  ReportPeriod,
  ReportFilters,
} from './reportService';
