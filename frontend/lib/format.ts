import { getUserPreferences } from "@/lib/userPreferences";

export const formatPrice = (
  price: number,
  options?: { locale?: string; currency?: string },
): string => {
  const prefs = getUserPreferences();
  const locale = options?.locale || prefs.locale;
  const currency = options?.currency || prefs.currency;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatDate = (
  date: string | Date,
  options?: { locale?: string },
): string => {
  const prefs = getUserPreferences();
  const locale = options?.locale || prefs.locale;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

export const formatDateRange = (
  startDate: string | Date,
  endDate: string | Date,
  options?: { locale?: string },
): string => {
  return `${formatDate(startDate, options)} - ${formatDate(endDate, options)}`;
};

export const formatDateWithTime = (
  date: string | Date,
  options?: { locale?: string },
): string => {
  const prefs = getUserPreferences();
  const locale = options?.locale || prefs.locale;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const getDaysDifference = (startDate: Date, endDate: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay);
};
