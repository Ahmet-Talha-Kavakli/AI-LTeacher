import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "@/locales/en.json";
import tr from "@/locales/tr.json";

export type AppLanguage = "en" | "tr";
export const FALLBACK_LANGUAGE: AppLanguage = "en";
export const SUPPORTED_APP_LANGUAGES: AppLanguage[] = ["en", "tr"];

export function getDeviceLanguage(): AppLanguage {
  const code = Localization.getLocales()[0]?.languageCode ?? FALLBACK_LANGUAGE;
  return code === "tr" ? "tr" : "en";
}

export function initI18n(initialLanguage: AppLanguage) {
  if (i18n.isInitialized) {
    if (i18n.language !== initialLanguage) i18n.changeLanguage(initialLanguage);
    return i18n;
  }
  i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, tr: { translation: tr } },
    lng: initialLanguage,
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    compatibilityJSON: "v4",
  });
  return i18n;
}

export default i18n;
