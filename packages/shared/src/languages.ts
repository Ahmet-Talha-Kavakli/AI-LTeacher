import { z } from "zod";

export const LanguageCode = z.enum(["en", "es", "de"]);
export type LanguageCode = z.infer<typeof LanguageCode>;

export const AccentCode = z.enum([
  // English
  "en-US",
  "en-GB",
  "en-SCT",
  "en-AU",
  // Spanish
  "es-ES",
  "es-MX",
  // German
  "de-DE",
  "de-AT",
]);
export type AccentCode = z.infer<typeof AccentCode>;

export interface LanguageDefinition {
  code: LanguageCode;
  nameEn: string;
  nameNative: string;
  flagEmoji: string;
  accents: AccentDefinition[];
}

export interface AccentDefinition {
  code: AccentCode;
  label: string;
  region: string;
  elevenLabsVoiceId?: string;
}

export const LANGUAGES: Record<LanguageCode, LanguageDefinition> = {
  en: {
    code: "en",
    nameEn: "English",
    nameNative: "English",
    flagEmoji: "🇺🇸",
    accents: [
      { code: "en-US", label: "American", region: "United States" },
      { code: "en-GB", label: "British", region: "United Kingdom" },
      { code: "en-SCT", label: "Scottish", region: "Scotland" },
      { code: "en-AU", label: "Australian", region: "Australia" },
    ],
  },
  es: {
    code: "es",
    nameEn: "Spanish",
    nameNative: "Español",
    flagEmoji: "🇪🇸",
    accents: [
      { code: "es-ES", label: "Castilian", region: "Spain" },
      { code: "es-MX", label: "Latin American", region: "Mexico" },
    ],
  },
  de: {
    code: "de",
    nameEn: "German",
    nameNative: "Deutsch",
    flagEmoji: "🇩🇪",
    accents: [
      { code: "de-DE", label: "Standard German", region: "Germany" },
      { code: "de-AT", label: "Austrian German", region: "Austria" },
    ],
  },
};

export const SUPPORTED_LANGUAGES: LanguageDefinition[] = Object.values(LANGUAGES);
