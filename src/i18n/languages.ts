export const LANGUAGE_STORAGE_KEY = "delta-language";

export const supportedLanguages = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "zh-CN", label: "Simplified Chinese", nativeLabel: "简体中文" },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"];

export const fallbackLanguage: SupportedLanguage = "en";

export function normalizeLanguage(language?: string): SupportedLanguage | undefined {
  if (!language) return undefined;

  const normalized = language.toLowerCase();

  if (
    normalized === "zh" ||
    normalized === "zh-cn" ||
    normalized.startsWith("zh-hans")
  ) {
    return "zh-CN";
  }

  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en";
  }

  return undefined;
}

