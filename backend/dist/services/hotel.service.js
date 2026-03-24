"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotelService = void 0;
const database_1 = require("../config/database");
const utils_1 = require("../utils");
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
        return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
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
        enriched.sort((a, b) => {
            if (sortBy === "price_asc")
                return a.minNightlyPrice - b.minNightlyPrice;
            if (sortBy === "price_desc")
                return b.minNightlyPrice - a.minNightlyPrice;
            if (sortBy === "rating_desc")
                return b.avgRating - a.avgRating;
            const aBaseScore = Number(a.owner.superhost) +
                (a.owner.responseRate || 0) / 100 +
                a.avgRating / 5;
            const bBaseScore = Number(b.owner.superhost) +
                (b.owner.responseRate || 0) / 100 +
                b.avgRating / 5;
            const tokenMatch = (location) => personalization.locationTokens.some((token) => location.toLowerCase().includes(token))
                ? 0.35
                : 0;
            const aScore = aBaseScore +
                (personalization.wishlistedHotelIds.has(a.id) ? 1.2 : 0) +
                (personalization.bookedHotelIds.has(a.id) ? 0.6 : 0) +
                tokenMatch(a.location || "");
            const bScore = bBaseScore +
                (personalization.wishlistedHotelIds.has(b.id) ? 1.2 : 0) +
                (personalization.bookedHotelIds.has(b.id) ? 0.6 : 0) +
                tokenMatch(b.location || "");
            return bScore - aScore;
        });
        const total = enriched.length;
        const data = enriched
            .slice((page - 1) * limit, page * limit)
            .map(({ minNightlyPrice: _p, avgRating: _r, ...hotel }) => hotel);
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
};
exports.default = exports.hotelService;
