"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const zod_1 = require("zod");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const hotel_service_1 = require("../services/hotel.service");
const environment_1 = require("../config/environment");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// Validation schemas
const createHotelSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "Hotel name must be at least 3 characters"),
    description: zod_1.z.string().optional(),
    location: zod_1.z
        .string()
        .regex(/^-?\d+\.?\d*,-?\d+\.?\d*,.+$/, "Invalid location format"),
    amenities: zod_1.z.array(zod_1.z.string()).optional(),
    publicRules: zod_1.z.string().optional(),
    checkInTime: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Invalid time format")
        .optional(),
    checkOutTime: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Invalid time format")
        .optional(),
    instantBooking: zod_1.z.boolean().optional(),
});
const updateHotelSchema = createHotelSchema.partial();
const searchHotelsSchema = zod_1.z
    .object({
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
    radiusKm: zod_1.z.number().default(10),
    checkIn: zod_1.z.string().datetime().optional(),
    checkOut: zod_1.z.string().datetime().optional(),
    guests: zod_1.z.number().int().positive().optional(),
    minPrice: zod_1.z.number().min(0).optional(),
    maxPrice: zod_1.z.number().min(0).optional(),
    instantBooking: zod_1.z.boolean().optional(),
    minRating: zod_1.z.number().min(0).max(5).optional(),
    accessibility: zod_1.z
        .enum(["wheelchair_accessible", "step_free_entry", "accessible_parking"])
        .optional(),
    north: zod_1.z.number().optional(),
    south: zod_1.z.number().optional(),
    east: zod_1.z.number().optional(),
    west: zod_1.z.number().optional(),
    sortBy: zod_1.z
        .enum(["recommended", "price_asc", "price_desc", "rating_desc"])
        .default("recommended"),
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(50).default(10),
})
    .refine((v) => typeof v.minPrice !== "number" ||
    typeof v.maxPrice !== "number" ||
    v.maxPrice >= v.minPrice, {
    message: "maxPrice must be greater than or equal to minPrice",
    path: ["maxPrice"],
});
const firstOrUndefined = (value) => (Array.isArray(value) ? value[0] : value);
const numberOrUndefined = (value) => {
    const raw = firstOrUndefined(value);
    if (!raw)
        return undefined;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? undefined : parsed;
};
const booleanOrUndefined = (value) => {
    const raw = firstOrUndefined(value);
    if (typeof raw !== "string")
        return undefined;
    if (["true", "1", "yes"].includes(raw.toLowerCase()))
        return true;
    if (["false", "0", "no"].includes(raw.toLowerCase()))
        return false;
    return undefined;
};
const parseSearchParams = (req) => searchHotelsSchema.parse({
    latitude: numberOrUndefined(req.query.latitude ??
        req.query.lat),
    longitude: numberOrUndefined(req.query.longitude ??
        req.query.lng),
    radiusKm: numberOrUndefined(req.query.radiusKm ??
        req.query.radius) ?? 10,
    checkIn: firstOrUndefined(req.query.checkIn),
    checkOut: firstOrUndefined(req.query.checkOut),
    guests: numberOrUndefined(req.query.guests),
    minPrice: numberOrUndefined(req.query.minPrice),
    maxPrice: numberOrUndefined(req.query.maxPrice),
    instantBooking: booleanOrUndefined(req.query.instantBooking),
    minRating: numberOrUndefined(req.query.minRating),
    accessibility: firstOrUndefined(req.query.accessibility),
    north: numberOrUndefined(req.query.north),
    south: numberOrUndefined(req.query.south),
    east: numberOrUndefined(req.query.east),
    west: numberOrUndefined(req.query.west),
    sortBy: firstOrUndefined(req.query.sortBy),
    page: numberOrUndefined(req.query.page) ?? 1,
    limit: numberOrUndefined(req.query.limit) ?? 10,
});
const blockDatesSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    reason: zod_1.z.string().min(1),
});
const calendarRulesSchema = zod_1.z
    .object({
    minStayNights: zod_1.z.number().int().min(1).max(365),
    maxStayNights: zod_1.z.number().int().min(1).max(365),
    advanceNoticeHours: zod_1.z
        .number()
        .int()
        .min(0)
        .max(24 * 60),
    prepTimeHours: zod_1.z
        .number()
        .int()
        .min(0)
        .max(24 * 30),
    allowSameDayCheckIn: zod_1.z.boolean(),
    checkInStartTime: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional()
        .or(zod_1.z.literal("")),
    checkInEndTime: zod_1.z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional()
        .or(zod_1.z.literal("")),
})
    .refine((v) => v.maxStayNights >= v.minStayNights, {
    message: "maxStayNights must be greater than or equal to minStayNights",
    path: ["maxStayNights"],
});
const icalSourceSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(255),
    url: zod_1.z.string().url(),
    enabled: zod_1.z.boolean().optional(),
});
const icalImportSchema = zod_1.z.object({
    icsContent: zod_1.z.string().min(20).optional(),
    sourceUrl: zod_1.z.string().url().optional(),
    reason: zod_1.z.string().min(1).max(255).optional(),
});
const pricingRulesSchema = zod_1.z.object({
    weekdayMultiplier: zod_1.z.number().min(0.5).max(5),
    weekendMultiplier: zod_1.z.number().min(0.5).max(5),
    weeklyDiscountPercent: zod_1.z.number().min(0).max(100),
    monthlyDiscountPercent: zod_1.z.number().min(0).max(100),
    earlyBirdDiscountPercent: zod_1.z.number().min(0).max(100),
    lastMinuteDiscountPercent: zod_1.z.number().min(0).max(100),
    cleaningFee: zod_1.z.number().min(0).max(100000),
});
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
// Create hotel (host only)
router.post("/", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const data = createHotelSchema.parse(req.body);
        const hotel = await hotel_service_1.hotelService.createHotel(req.userId, data);
        res
            .status(201)
            .json((0, response_1.successResponse)(hotel, "Hotel created successfully"));
    }
    catch (error) {
        next(error);
    }
});
const handleSearchHotels = async (req, res, next) => {
    try {
        const params = parseSearchParams(req);
        let userId;
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            try {
                const token = authHeader.slice(7);
                const decoded = jsonwebtoken_1.default.verify(token, environment_1.env.JWT_SECRET);
                userId = decoded.userId;
            }
            catch {
                userId = undefined;
            }
        }
        const result = await hotel_service_1.hotelService.searchHotels({
            ...params,
            checkIn: params.checkIn ? new Date(params.checkIn) : undefined,
            checkOut: params.checkOut ? new Date(params.checkOut) : undefined,
            userId,
        });
        res.json((0, response_1.paginatedResponse)(result.data, result.pagination.page, result.pagination.limit, result.pagination.total));
    }
    catch (error) {
        next(error);
    }
};
// Search hotels (public)
router.get("/search", handleSearchHotels);
router.get("/", handleSearchHotels);
// Get hotel by ID
router.get("/:id", async (req, res, next) => {
    try {
        const hotelId = getParam(req.params.id);
        const hotel = await hotel_service_1.hotelService.getHotelById(hotelId);
        res.json((0, response_1.successResponse)(hotel, "Hotel retrieved"));
    }
    catch (error) {
        next(error);
    }
});
// Update hotel (host only)
router.put("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const data = updateHotelSchema.parse(req.body);
        const hotelId = getParam(req.params.id);
        const hotel = await hotel_service_1.hotelService.updateHotel(hotelId, req.userId, data);
        res.json((0, response_1.successResponse)(hotel, "Hotel updated successfully"));
    }
    catch (error) {
        next(error);
    }
});
// Delete hotel (host only)
router.delete("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const hotelId = getParam(req.params.id);
        const result = await hotel_service_1.hotelService.deleteHotel(hotelId, req.userId);
        res.json((0, response_1.successResponse)(result, "Hotel deleted successfully"));
    }
    catch (error) {
        next(error);
    }
});
// Block dates (host only)
router.post("/:id/block-dates", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const data = blockDatesSchema.parse(req.body);
        const hotelId = getParam(req.params.id);
        const blockedDates = await hotel_service_1.hotelService.blockDates(hotelId, req.userId, {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
        });
        res
            .status(201)
            .json((0, response_1.successResponse)(blockedDates, "Dates blocked successfully"));
    }
    catch (error) {
        next(error);
    }
});
// Get blocked dates
router.get("/:id/block-dates", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), async (req, res, next) => {
    try {
        const hotelId = getParam(req.params.id);
        const blockedDates = await hotel_service_1.hotelService.getBlockedDates(hotelId);
        res.json((0, response_1.successResponse)(blockedDates, "Blocked dates retrieved"));
    }
    catch (error) {
        next(error);
    }
});
router.get("/:id/calendar-rules", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const hotelId = getParam(req.params.id);
        const rules = await hotel_service_1.hotelService.getCalendarRules(hotelId, req.userId);
        res.json((0, response_1.successResponse)(rules, "Calendar rules retrieved"));
    }
    catch (error) {
        next(error);
    }
});
router.put("/:id/calendar-rules", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const hotelId = getParam(req.params.id);
        const parsed = calendarRulesSchema.parse(req.body);
        const rules = await hotel_service_1.hotelService.upsertCalendarRules(hotelId, req.userId, {
            ...parsed,
            checkInStartTime: parsed.checkInStartTime || undefined,
            checkInEndTime: parsed.checkInEndTime || undefined,
        });
        res.json((0, response_1.successResponse)(rules, "Calendar rules updated"));
    }
    catch (error) {
        next(error);
    }
});
router.get("/:id/ical/export", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const hotelId = getParam(req.params.id);
        const ical = await hotel_service_1.hotelService.exportIcal(hotelId, req.userId);
        res.setHeader("Content-Type", "text/calendar; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=hotel-${hotelId}.ics`);
        return res.status(200).send(ical);
    }
    catch (error) {
        next(error);
    }
});
router.get("/:id/ical/sources", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const hotelId = getParam(req.params.id);
        const data = await hotel_service_1.hotelService.getIcalSources(hotelId, req.userId);
        res.json((0, response_1.successResponse)(data, "iCal sources retrieved"));
    }
    catch (error) {
        next(error);
    }
});
router.post("/:id/ical/sources", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const payload = icalSourceSchema.parse(req.body);
        const hotelId = getParam(req.params.id);
        const data = await hotel_service_1.hotelService.addIcalSource(hotelId, req.userId, payload);
        res.status(201).json((0, response_1.successResponse)(data, "iCal source added"));
    }
    catch (error) {
        next(error);
    }
});
router.delete("/:id/ical/sources/:sourceId", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const hotelId = getParam(req.params.id);
        const sourceId = getParam(req.params.sourceId);
        const data = await hotel_service_1.hotelService.deleteIcalSource(hotelId, sourceId, req.userId);
        res.json((0, response_1.successResponse)(data, "iCal source deleted"));
    }
    catch (error) {
        next(error);
    }
});
router.post("/:id/ical/import", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const hotelId = getParam(req.params.id);
        const payload = icalImportSchema.parse(req.body);
        let icsContent = payload.icsContent;
        if (!icsContent && payload.sourceUrl) {
            const response = await fetch(payload.sourceUrl);
            if (!response.ok) {
                return res
                    .status(400)
                    .json((0, response_1.errorResponse)("BAD_REQUEST", "Failed to fetch source URL"));
            }
            icsContent = await response.text();
        }
        if (!icsContent) {
            return res
                .status(400)
                .json((0, response_1.errorResponse)("BAD_REQUEST", "icsContent or sourceUrl is required"));
        }
        const data = await hotel_service_1.hotelService.importFromIcalContent(hotelId, req.userId, icsContent, payload.reason ?? "ical_sync");
        res.status(201).json((0, response_1.successResponse)(data, "iCal imported"));
    }
    catch (error) {
        next(error);
    }
});
router.post("/:id/ical/sources/:sourceId/sync", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const hotelId = getParam(req.params.id);
        const sourceId = getParam(req.params.sourceId);
        const data = await hotel_service_1.hotelService.syncIcalSource(hotelId, sourceId, req.userId);
        res.json((0, response_1.successResponse)(data, "iCal source synced"));
    }
    catch (error) {
        next(error);
    }
});
router.get("/:id/pricing-rules", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const hotelId = getParam(req.params.id);
        const data = await hotel_service_1.hotelService.getPricingRules(hotelId, req.userId);
        res.json((0, response_1.successResponse)(data, "Pricing rules retrieved"));
    }
    catch (error) {
        next(error);
    }
});
router.put("/:id/pricing-rules", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const hotelId = getParam(req.params.id);
        const payload = pricingRulesSchema.parse(req.body);
        const data = await hotel_service_1.hotelService.upsertPricingRules(hotelId, req.userId, payload);
        res.json((0, response_1.successResponse)(data, "Pricing rules updated"));
    }
    catch (error) {
        next(error);
    }
});
// Get my hotels (authenticated host)
router.get("/my", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const hotels = await hotel_service_1.hotelService.getMyHotels(req.userId);
        res.json((0, response_1.successResponse)(hotels, "My hotels retrieved"));
    }
    catch (error) {
        next(error);
    }
});
// Get promoted hotels (public)
router.get("/promoted", async (_req, res, next) => {
    try {
        const hotels = await hotel_service_1.hotelService.getPromotedHotels();
        res.json((0, response_1.successResponse)(hotels, "Promoted hotels retrieved"));
    }
    catch (error) {
        next(error);
    }
});
// Promote a hotel (host/admin only)
router.post("/:id/promote", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const hotelId = getParam(req.params.id);
        const durationDays = Number(req.body.durationDays) || 30;
        const hotel = await hotel_service_1.hotelService.promoteHotel(hotelId, req.userId, durationDays);
        res.json((0, response_1.successResponse)(hotel, "Hotel promoted successfully"));
    }
    catch (error) {
        next(error);
    }
});
// Unpromote a hotel (host/admin only)
router.delete("/:id/promote", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const hotelId = getParam(req.params.id);
        const hotel = await hotel_service_1.hotelService.unpromotedHotel(hotelId, req.userId);
        res.json((0, response_1.successResponse)(hotel, "Hotel unpromoted successfully"));
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
