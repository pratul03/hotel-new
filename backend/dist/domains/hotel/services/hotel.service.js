"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotelService = void 0;
const database_1 = require("../../../config/database");
const utils_1 = require("../../../utils");
const RECOMMENDED_RANKING_WEIGHTS = {
    quality: 0.45,
    popularity: 0.25,
    locationPersonalization: 0.2,
    price: 0.1,
};
const parseRankingWeights = (raw) => {
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed.quality === "number" &&
            typeof parsed.popularity === "number" &&
            typeof parsed.locationPersonalization === "number" &&
            typeof parsed.price === "number") {
            return parsed;
        }
    }
    catch {
        // ignore and fallback
    }
    return {
        quality: RECOMMENDED_RANKING_WEIGHTS.quality,
        popularity: RECOMMENDED_RANKING_WEIGHTS.popularity,
        locationPersonalization: RECOMMENDED_RANKING_WEIGHTS.locationPersonalization,
        price: RECOMMENDED_RANKING_WEIGHTS.price,
    };
};
const getDistance = (lat1, lon1, lat2, lon2) => {
    const earthRadiusKm = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
};
const parseLatLon = (location) => {
    const [latRaw, lonRaw] = location.split(",");
    const lat = Number(latRaw);
    const lon = Number(lonRaw);
    if (Number.isNaN(lat) || Number.isNaN(lon))
        return null;
    return { lat, lon };
};
const parseIcsDate = (raw) => {
    const value = raw.trim();
    if (/^\d{8}$/.test(value)) {
        const year = Number(value.slice(0, 4));
        const month = Number(value.slice(4, 6));
        const day = Number(value.slice(6, 8));
        return new Date(Date.UTC(year, month - 1, day));
    }
    if (/^\d{8}T\d{6}Z$/.test(value)) {
        const year = Number(value.slice(0, 4));
        const month = Number(value.slice(4, 6));
        const day = Number(value.slice(6, 8));
        const hour = Number(value.slice(9, 11));
        const minute = Number(value.slice(11, 13));
        const second = Number(value.slice(13, 15));
        return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};
const parseJsonStringArray = (value) => {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    }
    catch {
        return [];
    }
};
const parseIcsEvents = (icsContent) => {
    const normalized = icsContent.replace(/\r\n/g, "\n");
    const lines = normalized.split("\n");
    const events = [];
    let insideEvent = false;
    let dtStartRaw = "";
    let dtEndRaw = "";
    let summary = "";
    for (const line of lines) {
        if (line.startsWith("BEGIN:VEVENT")) {
            insideEvent = true;
            dtStartRaw = "";
            dtEndRaw = "";
            summary = "";
            continue;
        }
        if (line.startsWith("END:VEVENT")) {
            if (insideEvent && dtStartRaw && dtEndRaw) {
                const startDate = parseIcsDate(dtStartRaw);
                const endDate = parseIcsDate(dtEndRaw);
                if (startDate && endDate && startDate < endDate) {
                    events.push({ startDate, endDate, summary: summary || undefined });
                }
            }
            insideEvent = false;
            continue;
        }
        if (!insideEvent)
            continue;
        if (line.startsWith("DTSTART")) {
            const value = line.split(":").slice(1).join(":");
            dtStartRaw = value;
        }
        else if (line.startsWith("DTEND")) {
            const value = line.split(":").slice(1).join(":");
            dtEndRaw = value;
        }
        else if (line.startsWith("SUMMARY")) {
            summary = line.split(":").slice(1).join(":");
        }
    }
    return events;
};
const toIcsUtc = (date) => {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    const hh = String(date.getUTCHours()).padStart(2, "0");
    const mm = String(date.getUTCMinutes()).padStart(2, "0");
    const ss = String(date.getUTCSeconds()).padStart(2, "0");
    return `${y}${m}${d}T${hh}${mm}${ss}Z`;
};
exports.hotelService = {
    async createHotel(ownerId, data) {
        const user = await database_1.prisma.user.findUnique({ where: { id: ownerId } });
        if (!user) {
            throw new utils_1.AppError("Owner user not found", 404);
        }
        if (!["host", "admin"].includes(user.role)) {
            throw new utils_1.AppError("User must have host role to create hotels", 403);
        }
        const locationParts = data.location.split(",");
        if (locationParts.length < 3) {
            throw new utils_1.AppError("Location must be in format: latitude,longitude,address", 400);
        }
        return database_1.prisma.hotel.create({
            data: {
                ownerId,
                name: data.name,
                description: data.description,
                location: data.location,
                amenities: JSON.stringify(data.amenities || []),
                publicRules: data.publicRules,
                checkInTime: data.checkInTime || "14:00",
                checkOutTime: data.checkOutTime || "10:00",
                instantBooking: data.instantBooking || false,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        superhost: true,
                        responseRate: true,
                    },
                },
            },
        });
    },
    async getHotelById(hotelId) {
        const hotel = await database_1.prisma.hotel.findUnique({
            where: { id: hotelId },
            include: {
                rooms: {
                    select: {
                        id: true,
                        roomType: true,
                        capacity: true,
                        maxGuests: true,
                        basePrice: true,
                        amenities: true,
                        images: true,
                    },
                },
                owner: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        superhost: true,
                        responseRate: true,
                    },
                },
                reviews: {
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                    take: 10,
                    orderBy: { createdAt: "desc" },
                },
                cancellationPolicy: {
                    select: {
                        policyType: true,
                        freeCancellationHours: true,
                        partialRefundPercent: true,
                        noShowPenaltyPercent: true,
                    },
                },
            },
        });
        if (!hotel) {
            throw new utils_1.AppError("Hotel not found", 404);
        }
        return hotel;
    },
    async searchHotels(params) {
        const { latitude, longitude, radiusKm, guests = 1, minPrice, maxPrice, instantBooking, minRating, accessibility, north, south, east, west, sortBy = "recommended", userId, page = 1, limit = 10, } = params;
        const personalization = {
            wishlistedHotelIds: new Set(),
            bookedHotelIds: new Set(),
            locationTokens: [],
        };
        if (userId) {
            const [wishlistedRooms, bookings, searches] = await Promise.all([
                database_1.prisma.wishlist.findMany({
                    where: { userId },
                    include: { room: { select: { hotelId: true } } },
                }),
                database_1.prisma.booking.findMany({
                    where: { userId },
                    include: { room: { select: { hotelId: true } } },
                    take: 30,
                    orderBy: { createdAt: "desc" },
                }),
                database_1.prisma.searchHistory.findMany({
                    where: { userId },
                    select: { queryLocation: true },
                    take: 20,
                    orderBy: { createdAt: "desc" },
                }),
            ]);
            for (const item of wishlistedRooms) {
                if (item.room?.hotelId) {
                    personalization.wishlistedHotelIds.add(item.room.hotelId);
                }
            }
            for (const item of bookings) {
                if (item.room?.hotelId) {
                    personalization.bookedHotelIds.add(item.room.hotelId);
                }
            }
            const rawTokens = searches
                .map((s) => s.queryLocation)
                .join(" ")
                .toLowerCase()
                .split(/[^a-z0-9]+/)
                .filter((token) => token.length > 2);
            personalization.locationTokens = Array.from(new Set(rawTokens)).slice(0, 20);
        }
        const hotels = await database_1.prisma.hotel.findMany({
            include: {
                rooms: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        superhost: true,
                        responseRate: true,
                    },
                },
                reviews: {
                    select: {
                        rating: true,
                    },
                },
            },
        });
        const hasBounds = typeof north === "number" &&
            typeof south === "number" &&
            typeof east === "number" &&
            typeof west === "number";
        const nearby = hotels.filter((hotel) => {
            const parsed = parseLatLon(hotel.location);
            if (!parsed)
                return false;
            if (hasBounds) {
                return (parsed.lat <= north &&
                    parsed.lat >= south &&
                    parsed.lon <= east &&
                    parsed.lon >= west);
            }
            const distance = getDistance(latitude, longitude, parsed.lat, parsed.lon);
            return distance <= radiusKm;
        });
        const capacityFiltered = nearby.filter((hotel) => hotel.rooms.some((room) => room.maxGuests >= guests));
        const enriched = capacityFiltered
            .map((hotel) => {
            const roomPrices = hotel.rooms
                .map((room) => room.basePrice)
                .filter((price) => typeof price === "number");
            const minNightlyPrice = roomPrices.length ? Math.min(...roomPrices) : 0;
            const ratingCount = hotel.reviews?.length || 0;
            const avgRating = ratingCount
                ? hotel.reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount
                : 0;
            return {
                ...hotel,
                minNightlyPrice,
                avgRating,
            };
        })
            .filter((hotel) => typeof minPrice === "number" ? hotel.minNightlyPrice >= minPrice : true)
            .filter((hotel) => typeof maxPrice === "number" ? hotel.minNightlyPrice <= maxPrice : true)
            .filter((hotel) => typeof instantBooking === "boolean"
            ? hotel.instantBooking === instantBooking
            : true)
            .filter((hotel) => typeof minRating === "number" ? hotel.avgRating >= minRating : true)
            .filter((hotel) => {
            if (!accessibility)
                return true;
            const amenities = parseJsonStringArray(hotel.amenities || "[]");
            return amenities.includes(accessibility);
        });
        const getRecommendedScore = (hotel) => {
            const qualitySignal = Number(hotel.owner.superhost) * 1.2 +
                (hotel.owner.responseRate || 0) / 100 +
                hotel.avgRating / 5;
            const popularitySignal = (personalization.wishlistedHotelIds.has(hotel.id) ? 1.2 : 0) +
                (personalization.bookedHotelIds.has(hotel.id) ? 0.6 : 0);
            const locationSignal = personalization.locationTokens.some((token) => (hotel.location || "").toLowerCase().includes(token))
                ? 0.35
                : 0;
            const priceSignal = hotel.minNightlyPrice > 0 ? 1 / hotel.minNightlyPrice : 0;
            const weightedQuality = qualitySignal * RECOMMENDED_RANKING_WEIGHTS.quality;
            const weightedPopularity = popularitySignal * RECOMMENDED_RANKING_WEIGHTS.popularity;
            const weightedLocation = locationSignal * RECOMMENDED_RANKING_WEIGHTS.locationPersonalization;
            const weightedPrice = priceSignal * RECOMMENDED_RANKING_WEIGHTS.price;
            return {
                total: weightedQuality +
                    weightedPopularity +
                    weightedLocation +
                    weightedPrice,
                weighted: {
                    quality: weightedQuality,
                    popularity: weightedPopularity,
                    locationPersonalization: weightedLocation,
                    price: weightedPrice,
                },
                signals: {
                    quality: qualitySignal,
                    popularity: popularitySignal,
                    locationPersonalization: locationSignal,
                    price: priceSignal,
                },
            };
        };
        enriched.sort((a, b) => {
            if (sortBy === "price_asc")
                return a.minNightlyPrice - b.minNightlyPrice;
            if (sortBy === "price_desc")
                return b.minNightlyPrice - a.minNightlyPrice;
            if (sortBy === "rating_desc")
                return b.avgRating - a.avgRating;
            return getRecommendedScore(b).total - getRecommendedScore(a).total;
        });
        const total = enriched.length;
        const data = enriched
            .slice((page - 1) * limit, page * limit)
            .map((hotel) => {
            const ranking = getRecommendedScore(hotel);
            const baseHotel = { ...hotel };
            delete baseHotel.minNightlyPrice;
            delete baseHotel.avgRating;
            return {
                ...baseHotel,
                ...(sortBy === "recommended"
                    ? {
                        ranking: {
                            score: Number(ranking.total.toFixed(4)),
                            weights: RECOMMENDED_RANKING_WEIGHTS,
                            factors: {
                                quality: Number(ranking.weighted.quality.toFixed(4)),
                                popularity: Number(ranking.weighted.popularity.toFixed(4)),
                                locationPersonalization: Number(ranking.weighted.locationPersonalization.toFixed(4)),
                                price: Number(ranking.weighted.price.toFixed(4)),
                            },
                            signals: {
                                quality: Number(ranking.signals.quality.toFixed(4)),
                                popularity: Number(ranking.signals.popularity.toFixed(4)),
                                locationPersonalization: Number(ranking.signals.locationPersonalization.toFixed(4)),
                                price: Number(ranking.signals.price.toFixed(6)),
                            },
                        },
                    }
                    : {}),
            };
        });
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    },
    async updateHotel(hotelId, ownerId, data) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        return database_1.prisma.hotel.update({
            where: { id: hotelId },
            data: {
                ...(typeof data.name === "string" && { name: data.name }),
                ...(typeof data.description === "string" && {
                    description: data.description,
                }),
                ...(Array.isArray(data.amenities) && {
                    amenities: JSON.stringify(data.amenities),
                }),
                ...(typeof data.publicRules === "string" && {
                    publicRules: data.publicRules,
                }),
                ...(typeof data.checkInTime === "string" && {
                    checkInTime: data.checkInTime,
                }),
                ...(typeof data.checkOutTime === "string" && {
                    checkOutTime: data.checkOutTime,
                }),
                ...(typeof data.instantBooking === "boolean" && {
                    instantBooking: data.instantBooking,
                }),
            },
        });
    },
    async deleteHotel(hotelId, ownerId) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        await database_1.prisma.hotel.delete({ where: { id: hotelId } });
        return { message: "Hotel deleted successfully" };
    },
    async blockDates(hotelId, ownerId, data) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        const rooms = await database_1.prisma.room.findMany({
            where: { hotelId },
            select: { id: true },
        });
        return Promise.all(rooms.map((room) => database_1.prisma.blockedDates.create({
            data: {
                hotelId,
                roomId: room.id,
                startDate: data.startDate,
                endDate: data.endDate,
                reason: data.reason,
            },
        })));
    },
    async getBlockedDates(hotelId) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel) {
            throw new utils_1.AppError("Hotel not found", 404);
        }
        return database_1.prisma.blockedDates.findMany({
            where: { hotelId },
            orderBy: { startDate: "asc" },
        });
    },
    async getCalendarRules(hotelId, ownerId) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        return database_1.prisma.hotelCalendarRule.findUnique({
            where: { hotelId },
        });
    },
    async upsertCalendarRules(hotelId, ownerId, data) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        return database_1.prisma.hotelCalendarRule.upsert({
            where: { hotelId },
            update: {
                minStayNights: data.minStayNights,
                maxStayNights: data.maxStayNights,
                advanceNoticeHours: data.advanceNoticeHours,
                prepTimeHours: data.prepTimeHours,
                allowSameDayCheckIn: data.allowSameDayCheckIn,
                checkInStartTime: data.checkInStartTime,
                checkInEndTime: data.checkInEndTime,
            },
            create: {
                hotelId,
                minStayNights: data.minStayNights,
                maxStayNights: data.maxStayNights,
                advanceNoticeHours: data.advanceNoticeHours,
                prepTimeHours: data.prepTimeHours,
                allowSameDayCheckIn: data.allowSameDayCheckIn,
                checkInStartTime: data.checkInStartTime,
                checkInEndTime: data.checkInEndTime,
            },
        });
    },
    async getPricingRules(hotelId, ownerId) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        return database_1.prisma.hotelPricingRule.findUnique({
            where: { hotelId },
        });
    },
    async upsertPricingRules(hotelId, ownerId, data) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        return database_1.prisma.hotelPricingRule.upsert({
            where: { hotelId },
            update: data,
            create: {
                hotelId,
                ...data,
            },
        });
    },
    async getIcalSources(hotelId, ownerId) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        return database_1.prisma.hotelIcalSource.findMany({
            where: { hotelId },
            orderBy: { createdAt: "desc" },
        });
    },
    async addIcalSource(hotelId, ownerId, data) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        return database_1.prisma.hotelIcalSource.create({
            data: {
                hotelId,
                name: data.name,
                url: data.url,
                enabled: data.enabled ?? true,
            },
        });
    },
    async deleteIcalSource(hotelId, sourceId, ownerId) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        const source = await database_1.prisma.hotelIcalSource.findUnique({
            where: { id: sourceId },
        });
        if (!source || source.hotelId !== hotelId) {
            throw new utils_1.AppError("iCal source not found", 404);
        }
        await database_1.prisma.hotelIcalSource.delete({ where: { id: sourceId } });
        return { id: sourceId };
    },
    async importFromIcalContent(hotelId, ownerId, icsContent, reason = "ical_sync") {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        const rooms = await database_1.prisma.room.findMany({
            where: { hotelId },
            select: { id: true },
        });
        if (rooms.length === 0) {
            throw new utils_1.AppError("Cannot import iCal for hotel with no rooms", 400);
        }
        const events = parseIcsEvents(icsContent);
        let created = 0;
        for (const event of events) {
            for (const room of rooms) {
                const existing = await database_1.prisma.blockedDates.findFirst({
                    where: {
                        hotelId,
                        roomId: room.id,
                        startDate: event.startDate,
                        endDate: event.endDate,
                        reason,
                    },
                    select: { id: true },
                });
                if (existing)
                    continue;
                await database_1.prisma.blockedDates.create({
                    data: {
                        hotelId,
                        roomId: room.id,
                        startDate: event.startDate,
                        endDate: event.endDate,
                        reason,
                    },
                });
                created += 1;
            }
        }
        return {
            eventsParsed: events.length,
            blockedDatesCreated: created,
        };
    },
    async syncIcalSource(hotelId, sourceId, ownerId) {
        const source = await database_1.prisma.hotelIcalSource.findUnique({
            where: { id: sourceId },
        });
        if (!source || source.hotelId !== hotelId) {
            throw new utils_1.AppError("iCal source not found", 404);
        }
        const res = await fetch(source.url);
        if (!res.ok) {
            throw new utils_1.AppError("Failed to fetch iCal source URL", 400);
        }
        const icsContent = await res.text();
        const result = await this.importFromIcalContent(hotelId, ownerId, icsContent, "ical_sync");
        await database_1.prisma.hotelIcalSource.update({
            where: { id: sourceId },
            data: { lastSyncedAt: new Date() },
        });
        return result;
    },
    async exportIcal(hotelId, ownerId) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new utils_1.AppError("Unauthorized", 403);
        }
        const blocked = await database_1.prisma.blockedDates.findMany({
            where: { hotelId },
            orderBy: { startDate: "asc" },
            select: {
                id: true,
                startDate: true,
                endDate: true,
                reason: true,
            },
        });
        const unique = new Map();
        for (const item of blocked) {
            const key = `${item.startDate.toISOString()}|${item.endDate.toISOString()}|${item.reason}`;
            if (!unique.has(key))
                unique.set(key, item);
        }
        const now = new Date();
        const lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//my-bnb//Host Calendar//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
        ];
        for (const item of unique.values()) {
            lines.push("BEGIN:VEVENT");
            lines.push(`UID:${item.id}@my-bnb`);
            lines.push(`DTSTAMP:${toIcsUtc(now)}`);
            lines.push(`DTSTART:${toIcsUtc(new Date(item.startDate))}`);
            lines.push(`DTEND:${toIcsUtc(new Date(item.endDate))}`);
            lines.push(`SUMMARY:Blocked - ${item.reason}`);
            lines.push("END:VEVENT");
        }
        lines.push("END:VCALENDAR");
        return lines.join("\r\n");
    },
    async getMyHotels(ownerId) {
        return database_1.prisma.hotel.findMany({
            where: { ownerId },
            include: {
                rooms: { select: { id: true } },
                _count: { select: { rooms: true, reviews: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async getPromotedHotels(limit = 8) {
        const now = new Date();
        return database_1.prisma.hotel.findMany({
            where: {
                isPromoted: true,
                OR: [{ promotedUntil: null }, { promotedUntil: { gt: now } }],
            },
            include: {
                owner: {
                    select: { id: true, name: true, avatar: true, superhost: true },
                },
                rooms: {
                    take: 1,
                    select: { id: true, basePrice: true, images: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    },
    async promoteHotel(hotelId, ownerId, durationDays) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel)
            throw new utils_1.AppError("Hotel not found", 404);
        if (hotel.ownerId !== ownerId)
            throw new utils_1.AppError("Unauthorized", 403);
        const promotedUntil = new Date();
        promotedUntil.setDate(promotedUntil.getDate() + durationDays);
        return database_1.prisma.hotel.update({
            where: { id: hotelId },
            data: { isPromoted: true, promotedUntil },
            select: { id: true, name: true, isPromoted: true, promotedUntil: true },
        });
    },
    async unpromotedHotel(hotelId, ownerId) {
        const hotel = await database_1.prisma.hotel.findUnique({ where: { id: hotelId } });
        if (!hotel)
            throw new utils_1.AppError("Hotel not found", 404);
        if (hotel.ownerId !== ownerId)
            throw new utils_1.AppError("Unauthorized", 403);
        return database_1.prisma.hotel.update({
            where: { id: hotelId },
            data: { isPromoted: false, promotedUntil: null },
            select: { id: true, name: true, isPromoted: true },
        });
    },
    async listExperiences(payload) {
        const page = Math.max(1, payload?.page ?? 1);
        const limit = Math.min(50, Math.max(1, payload?.limit ?? 10));
        const where = {
            status: "active",
            ...(payload?.city ? { city: payload.city.toLowerCase() } : {}),
            ...(payload?.category
                ? { category: payload.category.toLowerCase() }
                : {}),
        };
        const [items, total] = await Promise.all([
            database_1.prisma.experience.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            database_1.prisma.experience.count({ where }),
        ]);
        return {
            items,
            page,
            limit,
            total,
        };
    },
    async createExperience(hostUserId, payload) {
        const actor = await database_1.prisma.user.findUnique({ where: { id: hostUserId } });
        if (!actor || !["host", "admin"].includes(actor.role)) {
            throw new utils_1.AppError("Only host or admin can create experiences", 403);
        }
        if (payload.hotelId) {
            const hotel = await database_1.prisma.hotel.findUnique({
                where: { id: payload.hotelId },
            });
            if (!hotel || (hotel.ownerId !== hostUserId && actor.role !== "admin")) {
                throw new utils_1.AppError("Unauthorized hotel association", 403);
            }
        }
        return database_1.prisma.experience.create({
            data: {
                hostUserId,
                hotelId: payload.hotelId,
                title: payload.title,
                description: payload.description,
                city: payload.city.toLowerCase(),
                category: payload.category.toLowerCase(),
                durationHours: payload.durationHours,
                price: payload.price,
                currency: payload.currency ?? "INR",
            },
        });
    },
    async listServicesMarketplace(payload) {
        const page = Math.max(1, payload?.page ?? 1);
        const limit = Math.min(50, Math.max(1, payload?.limit ?? 10));
        const where = {
            status: "active",
            ...(payload?.city ? { city: payload.city.toLowerCase() } : {}),
            ...(payload?.category
                ? { category: payload.category.toLowerCase() }
                : {}),
        };
        const [items, total] = await Promise.all([
            database_1.prisma.serviceListing.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            database_1.prisma.serviceListing.count({ where }),
        ]);
        return {
            items,
            page,
            limit,
            total,
        };
    },
    async createServiceListing(providerUserId, payload) {
        const actor = await database_1.prisma.user.findUnique({
            where: { id: providerUserId },
        });
        if (!actor || !["host", "admin"].includes(actor.role)) {
            throw new utils_1.AppError("Only host or admin can create service listings", 403);
        }
        if (payload.hotelId) {
            const hotel = await database_1.prisma.hotel.findUnique({
                where: { id: payload.hotelId },
            });
            if (!hotel ||
                (hotel.ownerId !== providerUserId && actor.role !== "admin")) {
                throw new utils_1.AppError("Unauthorized hotel association", 403);
            }
        }
        return database_1.prisma.serviceListing.create({
            data: {
                providerUserId,
                hotelId: payload.hotelId,
                title: payload.title,
                description: payload.description,
                city: payload.city.toLowerCase(),
                category: payload.category.toLowerCase(),
                basePrice: payload.basePrice,
                currency: payload.currency ?? "INR",
            },
        });
    },
    async getCrossVerticalRecommendations(userId, city) {
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new utils_1.AppError("User not found", 404);
        }
        const normalizedCity = city?.toLowerCase();
        const [stays, experiences, services] = await Promise.all([
            this.getPromotedHotels(6),
            database_1.prisma.experience.findMany({
                where: {
                    status: "active",
                    ...(normalizedCity ? { city: normalizedCity } : {}),
                },
                orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
                take: 4,
            }),
            database_1.prisma.serviceListing.findMany({
                where: {
                    status: "active",
                    ...(normalizedCity ? { city: normalizedCity } : {}),
                },
                orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
                take: 4,
            }),
        ]);
        return {
            generatedAt: new Date().toISOString(),
            userId,
            city: normalizedCity ?? null,
            recommendations: {
                stays,
                experiences,
                services,
            },
        };
    },
    async getRankingExperiment() {
        const experiment = await database_1.prisma.rankingExperiment.findFirst({
            where: { enabled: true },
            orderBy: { updatedAt: "desc" },
        });
        if (!experiment) {
            return {
                enabled: false,
                experimentName: "ranking_control_v1",
                weights: {
                    quality: RECOMMENDED_RANKING_WEIGHTS.quality,
                    popularity: RECOMMENDED_RANKING_WEIGHTS.popularity,
                    locationPersonalization: RECOMMENDED_RANKING_WEIGHTS.locationPersonalization,
                    price: RECOMMENDED_RANKING_WEIGHTS.price,
                },
                updatedAt: new Date().toISOString(),
            };
        }
        return {
            enabled: experiment.enabled,
            experimentName: experiment.name,
            weights: parseRankingWeights(experiment.weights),
            updatedAt: experiment.updatedAt.toISOString(),
        };
    },
    async upsertRankingExperiment(actorUserId, payload) {
        const actor = await database_1.prisma.user.findUnique({ where: { id: actorUserId } });
        if (!actor || actor.role !== "admin") {
            throw new utils_1.AppError("Only admins can update ranking experiment", 403);
        }
        const weights = payload.weights ?? {
            quality: RECOMMENDED_RANKING_WEIGHTS.quality,
            popularity: RECOMMENDED_RANKING_WEIGHTS.popularity,
            locationPersonalization: RECOMMENDED_RANKING_WEIGHTS.locationPersonalization,
            price: RECOMMENDED_RANKING_WEIGHTS.price,
        };
        const record = await database_1.prisma.rankingExperiment.upsert({
            where: { name: payload.experimentName },
            update: {
                enabled: payload.enabled,
                weights: JSON.stringify(weights),
            },
            create: {
                name: payload.experimentName,
                enabled: payload.enabled,
                weights: JSON.stringify(weights),
                createdByUserId: actorUserId,
            },
        });
        return {
            enabled: record.enabled,
            experimentName: record.name,
            weights: parseRankingWeights(record.weights),
            updatedAt: record.updatedAt.toISOString(),
        };
    },
};
exports.default = exports.hotelService;
