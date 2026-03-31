type SearchHotelsArgs = {
  input: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    minPrice?: number;
    maxPrice?: number;
    instantBooking?: boolean;
    minRating?: number;
    accessibility?:
      | "wheelchair_accessible"
      | "step_free_entry"
      | "accessible_parking";
    north?: number;
    south?: number;
    east?: number;
    west?: number;
    sortBy?: "recommended" | "price_asc" | "price_desc" | "rating_desc";
    page?: number;
    limit?: number;
  };
};

type CreateHotelArgs = {
  input: {
    name: string;
    description?: string;
    location: string;
    amenities?: string[];
    publicRules?: string[];
    checkInTime?: string;
    checkOutTime?: string;
    instantBooking?: boolean;
  };
};

type CreateBookingArgs = {
  input: {
    roomId: string;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    notes?: string;
  };
};

type RoomDateRangeArgs = {
  roomId: string;
  input: {
    checkIn: string;
    checkOut: string;
  };
};

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  return [];
};

const toRuleArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const asJsonArray = toArray(value);
    if (asJsonArray.length > 0) return asJsonArray;

    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toDisplayLocation = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const parts = value.split(",");
  if (parts.length >= 3) {
    return parts.slice(2).join(",").trim();
  }
  return value;
};

const toIsoString = (value: unknown): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

type HotelLike = {
  amenities?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  promotedUntil?: unknown;
  [key: string]: unknown;
};

const normalizeHotel = (hotel: HotelLike) => ({
  ...hotel,
  location: toDisplayLocation(hotel.location),
  amenities: toArray(hotel.amenities),
  publicRules: toRuleArray(hotel.publicRules),
  createdAt: toIsoString(hotel.createdAt),
  updatedAt: toIsoString(hotel.updatedAt),
  promotedUntil: toIsoString(hotel.promotedUntil),
});

const normalizeRoom = (room: Record<string, unknown>) => ({
  ...room,
  amenities: toArray(room.amenities),
  images: toArray(room.images),
  createdAt: toIsoString(room.createdAt),
  updatedAt: toIsoString(room.updatedAt),
});

const toStringRecord = (value: unknown): Record<string, string> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        String(k),
        String(v ?? ""),
      ]),
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed).map(([k, v]) => [String(k), String(v ?? "")]),
        );
      }
    } catch {
      return {};
    }
  }

  return {};
};

const toUnknownArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const toMetadataEntries = (
  value: unknown,
): Array<{ key: string; value: string }> =>
  Object.entries(toStringRecord(value)).map(([key, entryValue]) => ({
    key,
    value: entryValue,
  }));

const toDate = (value: string) => new Date(value);

export type {
  SearchHotelsArgs,
  CreateHotelArgs,
  CreateBookingArgs,
  RoomDateRangeArgs,
  HotelLike,
};
export {
  toArray,
  toIsoString,
  normalizeHotel,
  normalizeRoom,
  toStringRecord,
  toUnknownArray,
  toMetadataEntries,
  toDate,
};
