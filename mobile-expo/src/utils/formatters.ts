import { format } from 'date-fns';
import { fr, pt } from 'date-fns/locale';
import { DEFAULT_CURRENCY, SupportedCurrency } from '../types/currency';
import { getGlobalCurrency } from './currencyStore';

export const formatMoney = (
  amount: number,
  locale: string,
  currencyCode: SupportedCurrency = getGlobalCurrency()
): string => {
  const localeConfig = getIntlLocale(locale);
  try {
    return new Intl.NumberFormat(localeConfig, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(localeConfig, {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
};

// Formatage des prix selon la locale et la devise du compte
export const formatPrice = (amount: number, locale: string, currencyCode?: SupportedCurrency): string => {
  return formatMoney(amount, locale, currencyCode ?? getGlobalCurrency());
};

// Formatage des nombres selon la locale
export const formatNumber = (value: number, locale: string): string => {
  const localeConfig = locale === 'fr' ? 'fr-FR' : locale === 'pt' ? 'pt-PT' : 'fr-FR';
  
  return new Intl.NumberFormat(localeConfig).format(value);
};

// Formatage des dates selon la locale
export const formatDate = (date: Date | string, locale: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const localeConfig = locale === 'pt' ? pt : fr;
  
  return format(dateObj, 'dd/MM/yyyy', { locale: localeConfig });
};

// Formatage des dates avec heure
export const formatDateTime = (date: Date | string, locale: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const localeConfig = locale === 'pt' ? pt : fr;
  
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: localeConfig });
};

// Formatage des dates courtes (pour affichage compact)
export const formatShortDate = (date: Date | string, locale: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const localeConfig = locale === 'pt' ? pt : fr;
  
  return format(dateObj, 'dd/MM', { locale: localeConfig });
};

// Formatage des pourcentages
export const formatPercentage = (value: number, locale: string): string => {
  const localeConfig = locale === 'fr' ? 'fr-FR' : locale === 'pt' ? 'pt-PT' : 'fr-FR';
  
  return new Intl.NumberFormat(localeConfig, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

// Formatage des devises (générique, code ISO)
export const formatCurrency = (
  amount: number,
  locale: string,
  currency: SupportedCurrency = getGlobalCurrency()
): string => {
  return formatMoney(amount, locale, currency);
};

// Formatage des quantités avec unité
export const formatQuantity = (quantity: number, unit: string, locale: string): string => {
  const formattedNumber = formatNumber(quantity, locale);
  return `${formattedNumber} ${unit}`;
};

// Validation et formatage des montants
export const parseAmount = (value: string): number => {
  // Nettoyer la chaîne (supprimer espaces, virgules, etc.)
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Formatage pour l'affichage des montants dans les inputs
export const formatAmountForInput = (amount: number, locale: string): string => {
  if (amount === 0) return '';
  
  const localeConfig = locale === 'fr' ? 'fr-FR' : locale === 'pt' ? 'pt-PT' : 'fr-FR';
  
  return new Intl.NumberFormat(localeConfig, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Fonction utilitaire pour obtenir la locale appropriée pour date-fns
export const getDateLocale = (locale: string) => {
  switch (locale) {
    case 'pt':
      return pt;
    case 'fr':
    case 'cr':
    default:
      return fr;
  }
};

// Fonction utilitaire pour obtenir la locale appropriée pour Intl
export const getIntlLocale = (locale: string) => {
  switch (locale) {
    case 'pt':
      return 'pt-PT';
    case 'fr':
    case 'cr':
    default:
      return 'fr-FR';
  }
};
