export type SupportedLocale = "en-IN" | "en-US" | "en-GB";
export type SupportedCurrency = "INR" | "USD" | "EUR";

export interface UserPreferences {
  locale: SupportedLocale;
  currency: SupportedCurrency;
}

const STORAGE_KEY = "user-preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  locale: "en-IN",
  currency: "INR",
};

export const SUPPORTED_LOCALES: Array<{
  label: string;
  value: SupportedLocale;
}> = [
  { label: "English (India)", value: "en-IN" },
  { label: "English (US)", value: "en-US" },
  { label: "English (UK)", value: "en-GB" },
];

export const SUPPORTED_CURRENCIES: Array<{
  label: string;
  value: SupportedCurrency;
}> = [
  { label: "Indian Rupee (INR)", value: "INR" },
  { label: "US Dollar (USD)", value: "USD" },
  { label: "Euro (EUR)", value: "EUR" },
];

export const getDefaultPreferences = (): UserPreferences => DEFAULT_PREFERENCES;

export const getUserPreferences = (): UserPreferences => {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;

    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    const locale =
      parsed.locale && SUPPORTED_LOCALES.some((l) => l.value === parsed.locale)
        ? parsed.locale
        : DEFAULT_PREFERENCES.locale;
    const currency =
      parsed.currency &&
      SUPPORTED_CURRENCIES.some((c) => c.value === parsed.currency)
        ? parsed.currency
        : DEFAULT_PREFERENCES.currency;

    return { locale, currency };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

export const setUserPreferences = (prefs: UserPreferences) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
};
