import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";
import {
  fallbackLanguage,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
} from "./languages";

const savedLanguage = normalizeLanguage(
  localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? undefined
);
const systemLanguage = normalizeLanguage(navigator.language);

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "zh-CN": { translation: zhCN },
  },
  lng: savedLanguage ?? systemLanguage ?? fallbackLanguage,
  fallbackLng: fallbackLanguage,
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language) => {
  const normalized = normalizeLanguage(language);
  if (normalized) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  }
});

export default i18n;

