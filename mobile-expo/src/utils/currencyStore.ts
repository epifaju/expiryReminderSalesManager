import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CURRENCY, normalizeCurrency, SupportedCurrency } from '../types/currency';

let currentCurrency: SupportedCurrency = DEFAULT_CURRENCY;

export function getGlobalCurrency(): SupportedCurrency {
  return currentCurrency;
}

export function setGlobalCurrency(currency: SupportedCurrency): void {
  currentCurrency = currency;
}

function cacheKey(userId: number): string {
  return `currency_code:user:${userId}`;
}

export async function loadCachedCurrency(userId: number): Promise<SupportedCurrency | null> {
  try {
    const cached = await AsyncStorage.getItem(cacheKey(userId));
    return cached ? normalizeCurrency(cached) : null;
  } catch {
    return null;
  }
}

export async function persistCurrency(userId: number, currency: SupportedCurrency): Promise<void> {
  setGlobalCurrency(currency);
  await AsyncStorage.setItem(cacheKey(userId), currency);
}

export async function clearCurrencyCache(userId?: number): Promise<void> {
  setGlobalCurrency(DEFAULT_CURRENCY);
  if (userId != null) {
    await AsyncStorage.removeItem(cacheKey(userId));
  }
}
