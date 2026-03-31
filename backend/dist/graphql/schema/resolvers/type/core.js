"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coreTypeResolvers = void 0;
const helpers_1 = require("../../helpers");
exports.coreTypeResolvers = {
    Hotel: {
        amenities: (hotel) => (0, helpers_1.toArray)(hotel.amenities),
        publicRules: (hotel) => {
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
                }
                catch {
                    return hotel.publicRules
                        .split(/\n|,/)
                        .map((item) => item.trim())
                        .filter(Boolean);
                }
            }
            return [];
        },
        createdAt: (hotel) => (0, helpers_1.toIsoString)(hotel.createdAt),
        updatedAt: (hotel) => (0, helpers_1.toIsoString)(hotel.updatedAt),
        promotedUntil: (hotel) => (0, helpers_1.toIsoString)(hotel.promotedUntil),
    },
    HotelRoomSummary: {
        amenities: (room) => (0, helpers_1.toArray)(room.amenities),
        images: (room) => (0, helpers_1.toArray)(room.images),
        isAvailable: (room) => typeof room.isAvailable === "boolean" ? room.isAvailable : true,
    },
    Room: {
        amenities: (room) => (0, helpers_1.toArray)(room.amenities),
        images: (room) => (0, helpers_1.toArray)(room.images),
        isAvailable: (room) => typeof room.isAvailable === "boolean" ? room.isAvailable : true,
    },
    Booking: {
        checkIn: (booking) => (0, helpers_1.toIsoString)(booking.checkIn),
        checkOut: (booking) => (0, helpers_1.toIsoString)(booking.checkOut),
        expiresAt: (booking) => (0, helpers_1.toIsoString)(booking.expiresAt),
        createdAt: (booking) => (0, helpers_1.toIsoString)(booking.createdAt),
        updatedAt: (booking) => (0, helpers_1.toIsoString)(booking.updatedAt),
        room: (booking) => booking.room ? (0, helpers_1.normalizeRoom)(booking.room) : null,
    },
    Payment: {
        createdAt: (payment) => (0, helpers_1.toIsoString)(payment.createdAt),
        updatedAt: (payment) => (0, helpers_1.toIsoString)(payment.updatedAt),
    },
    Message: {
        createdAt: (message) => (0, helpers_1.toIsoString)(message.createdAt),
        updatedAt: (message) => (0, helpers_1.toIsoString)(message.updatedAt),
    },
    Notification: {
        createdAt: (notification) => (0, helpers_1.toIsoString)(notification.createdAt),
        updatedAt: (notification) => (0, helpers_1.toIsoString)(notification.updatedAt),
    },
    Conversation: {
        lastMessageAt: (conversation) => (0, helpers_1.toIsoString)(conversation.lastMessageAt),
    },
    FxRate: {
        effectiveAt: (fxRate) => (0, helpers_1.toIsoString)(fxRate.effectiveAt),
        createdAt: (fxRate) => (0, helpers_1.toIsoString)(fxRate.createdAt),
        updatedAt: (fxRate) => (0, helpers_1.toIsoString)(fxRate.updatedAt),
    },
    HotelPromotionState: {
        promotedUntil: (item) => (0, helpers_1.toIsoString)(item.promotedUntil),
    },
    BlockedDate: {
        startDate: (item) => (0, helpers_1.toIsoString)(item.startDate),
        endDate: (item) => (0, helpers_1.toIsoString)(item.endDate),
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    HotelCalendarRule: {
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    HotelIcalSource: {
        lastSyncedAt: (item) => (0, helpers_1.toIsoString)(item.lastSyncedAt),
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    HotelPricingRule: {
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
};
