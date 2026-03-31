import { normalizeRoom, toArray, toIsoString } from "../../helpers";

export const coreTypeResolvers = {
  Hotel: {
    amenities: (hotel: { amenities?: unknown }) => toArray(hotel.amenities),
    publicRules: (hotel: { publicRules?: unknown }) => {
      if (Array.isArray(hotel.publicRules)) {
        return hotel.publicRules
          .map(String)
          .map((item) => item.trim())
          .filter(Boolean);
      }
      if (typeof hotel.publicRules === "string") {
        try {
          const parsed = JSON.parse(hotel.publicRules);
          if (Array.isArray(parsed)) {
            return parsed
              .map(String)
              .map((item) => item.trim())
              .filter(Boolean);
          }
        } catch {
          return hotel.publicRules
            .split(/\n|,/)
            .map((item) => item.trim())
            .filter(Boolean);
        }
      }
      return [];
    },
    createdAt: (hotel: { createdAt?: unknown }) => toIsoString(hotel.createdAt),
    updatedAt: (hotel: { updatedAt?: unknown }) => toIsoString(hotel.updatedAt),
    promotedUntil: (hotel: { promotedUntil?: unknown }) =>
      toIsoString(hotel.promotedUntil),
  },

  HotelRoomSummary: {
    amenities: (room: { amenities?: unknown }) => toArray(room.amenities),
    images: (room: { images?: unknown }) => toArray(room.images),
    isAvailable: (room: { isAvailable?: unknown }) =>
      typeof room.isAvailable === "boolean" ? room.isAvailable : true,
  },

  Room: {
    amenities: (room: { amenities?: unknown }) => toArray(room.amenities),
    images: (room: { images?: unknown }) => toArray(room.images),
    isAvailable: (room: { isAvailable?: unknown }) =>
      typeof room.isAvailable === "boolean" ? room.isAvailable : true,
  },

  Booking: {
    checkIn: (booking: { checkIn?: unknown }) => toIsoString(booking.checkIn),
    checkOut: (booking: { checkOut?: unknown }) =>
      toIsoString(booking.checkOut),
    expiresAt: (booking: { expiresAt?: unknown }) =>
      toIsoString(booking.expiresAt),
    createdAt: (booking: { createdAt?: unknown }) =>
      toIsoString(booking.createdAt),
    updatedAt: (booking: { updatedAt?: unknown }) =>
      toIsoString(booking.updatedAt),
    room: (booking: { room?: Record<string, unknown> }) =>
      booking.room ? normalizeRoom(booking.room) : null,
  },

  Payment: {
    createdAt: (payment: { createdAt?: unknown }) =>
      toIsoString(payment.createdAt),
    updatedAt: (payment: { updatedAt?: unknown }) =>
      toIsoString(payment.updatedAt),
  },

  Message: {
    createdAt: (message: { createdAt?: unknown }) =>
      toIsoString(message.createdAt),
    updatedAt: (message: { updatedAt?: unknown }) =>
      toIsoString(message.updatedAt),
  },

  Notification: {
    createdAt: (notification: { createdAt?: unknown }) =>
      toIsoString(notification.createdAt),
    updatedAt: (notification: { updatedAt?: unknown }) =>
      toIsoString(notification.updatedAt),
  },

  Conversation: {
    lastMessageAt: (conversation: { lastMessageAt?: unknown }) =>
      toIsoString(conversation.lastMessageAt),
  },

  FxRate: {
    effectiveAt: (fxRate: { effectiveAt?: unknown }) =>
      toIsoString(fxRate.effectiveAt),
    createdAt: (fxRate: { createdAt?: unknown }) =>
      toIsoString(fxRate.createdAt),
    updatedAt: (fxRate: { updatedAt?: unknown }) =>
      toIsoString(fxRate.updatedAt),
  },

  HotelPromotionState: {
    promotedUntil: (item: { promotedUntil?: unknown }) =>
      toIsoString(item.promotedUntil),
  },

  BlockedDate: {
    startDate: (item: { startDate?: unknown }) => toIsoString(item.startDate),
    endDate: (item: { endDate?: unknown }) => toIsoString(item.endDate),
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  HotelCalendarRule: {
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  HotelIcalSource: {
    lastSyncedAt: (item: { lastSyncedAt?: unknown }) =>
      toIsoString(item.lastSyncedAt),
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },

  HotelPricingRule: {
    createdAt: (item: { createdAt?: unknown }) => toIsoString(item.createdAt),
    updatedAt: (item: { updatedAt?: unknown }) => toIsoString(item.updatedAt),
  },
};
