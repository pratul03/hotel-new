import { getUserPreferences } from "@/lib/userPreferences";

type Dictionary = Record<string, string>;

const dictionaries: Record<string, Dictionary> = {
  "en-IN": {
    searchResults: "Search Results",
    bookings: "Bookings",
    messages: "Messages",
    wishlist: "Wishlist",
  },
  "en-US": {
    searchResults: "Search Results",
    bookings: "Reservations",
    messages: "Messages",
    wishlist: "Wishlist",
  },
  "en-GB": {
    searchResults: "Search Results",
    bookings: "Bookings",
    messages: "Messages",
    wishlist: "Saved",
  },
};

export const t = (key: string): string => {
  const locale = getUserPreferences().locale;
  const dict = dictionaries[locale] || dictionaries["en-IN"];
  return dict[key] || key;
};
