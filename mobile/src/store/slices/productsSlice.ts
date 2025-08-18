import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {ProductResponse} from '../../services/productService';

interface ProductsState {
  products: ProductResponse[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    category: string;
    lowStock: boolean;
    expiring: boolean;
    expired: boolean;
  };
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  categories: string[];
  selectedProduct: ProductResponse | null;
}

const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    category: '',
    lowStock: false,
    expiring: false,
    expired: false,
  },
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  categories: [],
  selectedProduct: null,
};

const productsSlice = createSlice({
  name: 'products',
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

    // Products management
    setProducts: (state, action: PayloadAction<ProductResponse[]>) => {
      state.products = action.payload;
    },
    addProduct: (state, action: PayloadAction<ProductResponse>) => {
      state.products.unshift(action.payload);
    },
    updateProduct: (state, action: PayloadAction<ProductResponse>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
    removeProduct: (state, action: PayloadAction<number>) => {
      state.products = state.products.filter(p => p.id !== action.payload);
    },

    // Filters
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.filters.category = action.payload;
    },
    setLowStockFilter: (state, action: PayloadAction<boolean>) => {
      state.filters.lowStock = action.payload;
    },
    setExpiringFilter: (state, action: PayloadAction<boolean>) => {
      state.filters.expiring = action.payload;
    },
    setExpiredFilter: (state, action: PayloadAction<boolean>) => {
      state.filters.expired = action.payload;
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
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.size = action.payload;
    },

    // Categories
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload;
    },

    // Selected product
    setSelectedProduct: (state, action: PayloadAction<ProductResponse | null>) => {
      state.selectedProduct = action.payload;
    },

    // Stock updates
    updateProductStock: (state, action: PayloadAction<{id: number; quantity: number}>) => {
      const product = state.products.find(p => p.id === action.payload.id);
      if (product) {
        product.stockQuantity = action.payload.quantity;
      }
      if (state.selectedProduct?.id === action.payload.id) {
        state.selectedProduct.stockQuantity = action.payload.quantity;
      }
    },

    // Reset state
    resetProducts: (state) => {
      return initialState;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setProducts,
  addProduct,
  updateProduct,
  removeProduct,
  setSearchFilter,
  setCategoryFilter,
  setLowStockFilter,
  setExpiringFilter,
  setExpiredFilter,
  clearFilters,
  setPagination,
  setPage,
  setPageSize,
  setCategories,
  setSelectedProduct,
  updateProductStock,
  resetProducts,
} = productsSlice.actions;

export default productsSlice.reducer;
