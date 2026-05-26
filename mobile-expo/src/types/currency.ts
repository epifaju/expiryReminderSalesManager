export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'XOF'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
export const DEFAULT_CURRENCY: SupportedCurrency = 'EUR';

export function isSupportedCurrency(value: string | undefined | null): value is SupportedCurrency {
  return value != null && SUPPORTED_CURRENCIES.includes(value as SupportedCurrency);
}

export function normalizeCurrency(value: string | undefined | null): SupportedCurrency {
  if (isSupportedCurrency(value)) {
    return value;
  }
  return DEFAULT_CURRENCY;
}
