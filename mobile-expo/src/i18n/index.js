import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import fr from "./locales/fr.json";
import pt from "./locales/pt.json";
import cr from "./locales/cr.json";

const LANGUAGE_STORAGE_KEY = "@sales_manager_language";

const resources = {
  fr: { translation: fr },
  pt: { translation: pt },
  cr: { translation: cr },
};

// Détection de la langue du système
const getDeviceLanguage = () => {
  const supportedLanguages = ["fr", "pt", "cr"];

  // Obtenir la locale du système avec expo-localization
  const deviceLocale = Localization.getLocales()[0];

  if (deviceLocale) {
    const deviceLang = deviceLocale.languageCode;

    // Vérifier si la langue est supportée
    if (supportedLanguages.includes(deviceLang)) {
      return deviceLang;
    }

    // Vérifier les variantes (pt-BR -> pt)
    const baseLang = deviceLang.split("-")[0];
    if (supportedLanguages.includes(baseLang)) {
      return baseLang;
    }
  }

  // Fallback vers français
  return "fr";
};

// Initialisation i18n
export const initI18n = async () => {
  try {
    let savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (!savedLanguage) {
      savedLanguage = getDeviceLanguage();
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, savedLanguage);
    }

    await i18n.use(initReactI18next).init({
      resources,
      lng: savedLanguage,
      fallbackLng: "fr",
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to initialize i18n:", error);
    // Initialiser quand même avec le français
    await i18n.use(initReactI18next).init({
      resources,
      lng: "fr",
      fallbackLng: "fr",
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
    return false;
  }
};

// Fonction pour changer de langue
export const changeLanguage = async (lang) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    await i18n.changeLanguage(lang);
    return { success: true };
  } catch (error) {
    console.error("Failed to change language:", error);
    // Changer quand même la langue pour la session en cours
    i18n.changeLanguage(lang);
    return { success: false, error: error.message };
  }
};

// Fonction pour obtenir la langue actuelle
export const getCurrentLanguage = () => {
  return i18n.language || "fr";
};

export default i18n;
