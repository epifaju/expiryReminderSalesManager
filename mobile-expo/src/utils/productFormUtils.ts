import { Product, ProductRequest } from '../services/productService';

export interface ProductFormValues {
  name: string;
  description: string;
  barcode: string;
  purchasePrice: string;
  sellingPrice: string;
  stockQuantity: string;
  minStockLevel: string;
  category: string;
  unit: string;
  manufacturingDate: string;
  expiryDate: string;
  isActive: boolean;
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '',
  description: '',
  barcode: '',
  purchasePrice: '',
  sellingPrice: '',
  stockQuantity: '',
  minStockLevel: '5',
  category: '',
  unit: 'pcs',
  manufacturingDate: '',
  expiryDate: '',
  isActive: true,
};

const toDateOnly = (value?: string | null): string => {
  if (!value) return '';
  return value.split('T')[0];
};

const toFormNumber = (value?: number | null): string => {
  if (value === undefined || value === null) return '';
  return String(value);
};

export const productToFormValues = (product: Partial<Product>): ProductFormValues => ({
  name: product.name ?? '',
  description: product.description ?? '',
  barcode: product.barcode ?? '',
  purchasePrice: toFormNumber(product.purchasePrice),
  sellingPrice: toFormNumber(product.sellingPrice),
  stockQuantity: toFormNumber(product.stockQuantity),
  minStockLevel: toFormNumber(product.minStockLevel ?? 5),
  category: product.category ?? '',
  unit: product.unit ?? 'pcs',
  manufacturingDate: toDateOnly(product.manufacturingDate),
  expiryDate: toDateOnly(product.expiryDate),
  isActive: product.isActive !== false,
});

export const formValuesToProductRequest = (values: ProductFormValues): ProductRequest => ({
  name: values.name.trim(),
  description: values.description.trim() || undefined,
  barcode: values.barcode.trim() || undefined,
  purchasePrice: parseFloat(values.purchasePrice),
  sellingPrice: parseFloat(values.sellingPrice),
  stockQuantity: parseInt(values.stockQuantity, 10) || 0,
  minStockLevel: parseInt(values.minStockLevel, 10) || 5,
  category: values.category.trim() || undefined,
  unit: values.unit.trim() || 'pcs',
  manufacturingDate: values.manufacturingDate || undefined,
  expiryDate: values.expiryDate || undefined,
  isActive: values.isActive,
});
