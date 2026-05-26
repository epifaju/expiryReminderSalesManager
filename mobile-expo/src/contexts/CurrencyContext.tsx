import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import authService from '../services/authService';
import profileService from '../services/profileService';
import { DEFAULT_CURRENCY, SupportedCurrency } from '../types/currency';
import {
  loadCachedCurrency,
  persistCurrency,
  setGlobalCurrency,
} from '../utils/currencyStore';
import { formatMoney as formatMoneyUtil } from '../utils/formatters';
import { useTranslation } from 'react-i18next';

interface CurrencyContextType {
  currency: SupportedCurrency;
  isLoading: boolean;
  setCurrency: (currency: SupportedCurrency) => Promise<void>;
  formatMoney: (amount: number) => string;
  refreshCurrency: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [currency, setCurrencyState] = useState<SupportedCurrency>(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(true);

  const applyCurrency = useCallback(async (code: SupportedCurrency, userId?: number) => {
    setGlobalCurrency(code);
    setCurrencyState(code);
    if (userId != null) {
      await persistCurrency(userId, code);
    }
  }, []);

  const refreshCurrency = useCallback(async () => {
    const user = authService.getUser();
    if (!user) {
      setGlobalCurrency(DEFAULT_CURRENCY);
      setCurrencyState(DEFAULT_CURRENCY);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const cached = await loadCachedCurrency(user.id);
      if (cached) {
        await applyCurrency(cached, user.id);
      }

      const profile = await profileService.getProfile();
      await applyCurrency(profile.preferredCurrency, user.id);

      const updatedUser = { ...user, preferredCurrency: profile.preferredCurrency };
      authService.updateLocalUser(updatedUser);
    } catch (error) {
      console.warn('Impossible de charger la devise depuis le profil:', error);
      const fromUser = user.preferredCurrency;
      if (fromUser) {
        await applyCurrency(fromUser as SupportedCurrency, user.id);
      }
    } finally {
      setIsLoading(false);
    }
  }, [applyCurrency]);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      void refreshCurrency();
    } else {
      setIsLoading(false);
    }

    return authService.onAuthChange(() => {
      if (authService.isAuthenticated()) {
        void refreshCurrency();
      }
    });
  }, [refreshCurrency]);

  const setCurrency = useCallback(
    async (code: SupportedCurrency) => {
      const profile = await profileService.updateProfile({ preferredCurrency: code });
      const user = authService.getUser();
      if (user) {
        await applyCurrency(profile.preferredCurrency, user.id);
        authService.updateLocalUser({ ...user, preferredCurrency: profile.preferredCurrency });
      } else {
        await applyCurrency(profile.preferredCurrency);
      }
    },
    [applyCurrency]
  );

  const formatMoney = useCallback(
    (amount: number) => formatMoneyUtil(amount, i18n.language, currency),
    [currency, i18n.language]
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, isLoading, setCurrency, formatMoney, refreshCurrency }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}
