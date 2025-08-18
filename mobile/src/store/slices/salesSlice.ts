import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {SaleResponse, SalesStats, PaymentMethod, SaleStatus} from '../../services/saleService';

interface SalesState {
  sales: SaleResponse[];
  loading: boolean;
  error: string | null;
  stats: SalesStats | null;
  filters: {
    startDate: string;
    endDate: string;
    customerName: string;
    paymentMethod: PaymentMethod | '';
    status: SaleStatus | '';
  };
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  selectedSale: SaleResponse | null;
  currentSale: {
    items: Array<{
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    customerName: string;
    customerPhone: string;
    discount: number;
    tax: number;
    paymentMethod: PaymentMethod | null;
    subtotal: number;
    total: number;
  };
}

const initialState: SalesState = {
  sales: [],
  loading: false,
  error: null,
  stats: null,
  filters: {
    startDate: '',
    endDate: '',
    customerName: '',
    paymentMethod: '',
    status: '',
  },
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  selectedSale: null,
  currentSale: {
    items: [],
    customerName: '',
    customerPhone: '',
    discount: 0,
    tax: 0,
    paymentMethod: null,
    subtotal: 0,
    total: 0,
  },
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Sales management
    setSales: (state, action: PayloadAction<SaleResponse[]>) => {
      state.sales = action.payload;
    },
    addSale: (state, action: PayloadAction<SaleResponse>) => {
      state.sales.unshift(action.payload);
    },
    updateSale: (state, action: PayloadAction<SaleResponse>) => {
      const index = state.sales.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.sales[index] = action.payload;
      }
    },
    removeSale: (state, action: PayloadAction<number>) => {
      state.sales = state.sales.filter(s => s.id !== action.payload);
    },

    // Stats
    setStats: (state, action: PayloadAction<SalesStats>) => {
      state.stats = action.payload;
    },

    // Filters
    setDateFilter: (state, action: PayloadAction<{startDate: string; endDate: string}>) => {
      state.filters.startDate = action.payload.startDate;
      state.filters.endDate = action.payload.endDate;
    },
    setCustomerNameFilter: (state, action: PayloadAction<string>) => {
      state.filters.customerName = action.payload;
    },
    setPaymentMethodFilter: (state, action: PayloadAction<PaymentMethod | ''>) => {
      state.filters.paymentMethod = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<SaleStatus | ''>) => {
      state.filters.status = action.payload;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Pagination
    setPagination: (state, action: PayloadAction<{
      page: number;
      size: number;
      totalElements: number;
      totalPages: number;
    }>) => {
      state.pagination = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    // Selected sale
    setSelectedSale: (state, action: PayloadAction<SaleResponse | null>) => {
      state.selectedSale = action.payload;
    },

    // Current sale (for creating new sales)
    addItemToCurrentSale: (state, action: PayloadAction<{
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
    }>) => {
      const item = {
        ...action.payload,
        totalPrice: action.payload.quantity * action.payload.unitPrice,
      };
      
      const existingItemIndex = state.currentSale.items.findIndex(
        i => i.productId === item.productId
      );
      
      if (existingItemIndex !== -1) {
        state.currentSale.items[existingItemIndex].quantity += item.quantity;
        state.currentSale.items[existingItemIndex].totalPrice = 
          state.currentSale.items[existingItemIndex].quantity * 
          state.currentSale.items[existingItemIndex].unitPrice;
      } else {
        state.currentSale.items.push(item);
      }
      
      // Recalculate totals
      salesSlice.caseReducers.calculateCurrentSaleTotals(state);
    },
    
    updateItemInCurrentSale: (state, action: PayloadAction<{
      productId: number;
      quantity: number;
      unitPrice?: number;
    }>) => {
      const itemIndex = state.currentSale.items.findIndex(
        i => i.productId === action.payload.productId
      );
      
      if (itemIndex !== -1) {
        if (action.payload.unitPrice !== undefined) {
          state.currentSale.items[itemIndex].unitPrice = action.payload.unitPrice;
        }
        state.currentSale.items[itemIndex].quantity = action.payload.quantity;
        state.currentSale.items[itemIndex].totalPrice = 
          state.currentSale.items[itemIndex].quantity * 
          state.currentSale.items[itemIndex].unitPrice;
        
        // Recalculate totals
        salesSlice.caseReducers.calculateCurrentSaleTotals(state);
      }
    },
    
    removeItemFromCurrentSale: (state, action: PayloadAction<number>) => {
      state.currentSale.items = state.currentSale.items.filter(
        i => i.productId !== action.payload
      );
      
      // Recalculate totals
      salesSlice.caseReducers.calculateCurrentSaleTotals(state);
    },
    
    setCurrentSaleCustomer: (state, action: PayloadAction<{
      customerName: string;
      customerPhone: string;
    }>) => {
      state.currentSale.customerName = action.payload.customerName;
      state.currentSale.customerPhone = action.payload.customerPhone;
    },
    
    setCurrentSaleDiscount: (state, action: PayloadAction<number>) => {
      state.currentSale.discount = action.payload;
      salesSlice.caseReducers.calculateCurrentSaleTotals(state);
    },
    
    setCurrentSaleTax: (state, action: PayloadAction<number>) => {
      state.currentSale.tax = action.payload;
      salesSlice.caseReducers.calculateCurrentSaleTotals(state);
    },
    
    setCurrentSalePaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.currentSale.paymentMethod = action.payload;
    },
    
    calculateCurrentSaleTotals: (state) => {
      const subtotal = state.currentSale.items.reduce(
        (sum, item) => sum + item.totalPrice, 0
      );
      state.currentSale.subtotal = subtotal;
      state.currentSale.total = subtotal - state.currentSale.discount + state.currentSale.tax;
    },
    
    clearCurrentSale: (state) => {
      state.currentSale = initialState.currentSale;
    },

    // Reset state
    resetSales: (state) => {
      return initialState;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setSales,
  addSale,
  updateSale,
  removeSale,
  setStats,
  setDateFilter,
  setCustomerNameFilter,
  setPaymentMethodFilter,
  setStatusFilter,
  clearFilters,
  setPagination,
  setPage,
  setSelectedSale,
  addItemToCurrentSale,
  updateItemInCurrentSale,
  removeItemFromCurrentSale,
  setCurrentSaleCustomer,
  setCurrentSaleDiscount,
  setCurrentSaleTax,
  setCurrentSalePaymentMethod,
  calculateCurrentSaleTotals,
  clearCurrentSale,
  resetSales,
} = salesSlice.actions;

export default salesSlice.reducer;
