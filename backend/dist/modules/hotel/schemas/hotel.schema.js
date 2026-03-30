"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotelSchemas = exports.hotelPromoteSchema = exports.crossVerticalRecommendationsQuerySchema = exports.createServiceListingSchema = exports.createExperienceSchema = exports.rankingExperimentSchema = exports.verticalQuerySchema = exports.pricingRulesSchema = exports.icalImportSchema = exports.icalSourceSchema = exports.calendarRulesSchema = exports.blockDatesSchema = exports.searchHotelsSchema = exports.updateHotelSchema = exports.createHotelSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.createHotelSchema = validation_1.z.object({
    name: validation_1.z.coerce
        .string()
        .trim()
        .min(3, "Hotel name must be at least 3 characters")
        .max(200),
    description: validation_1.v.trimmed(4000).optional(),
    location: validation_1.z.coerce
        .string()
        .trim()
        .regex(/^-?\d+\.?\d*,-?\d+\.?\d*,.+$/, "Invalid location format"),
    amenities: validation_1.z.array(validation_1.v.id()).optional(),
    publicRules: validation_1.v.trimmed(4000).optional(),
    checkInTime: validation_1.z.coerce
        .string()
        .trim()
        .regex(/^\d{2}:\d{2}$/, "Invalid time format")
        .optional(),
    checkOutTime: validation_1.z.coerce
        .string()
        .trim()
        .regex(/^\d{2}:\d{2}$/, "Invalid time format")
        .optional(),
    instantBooking: validation_1.v.bool().optional(),
});
exports.updateHotelSchema = exports.createHotelSchema.partial();
exports.searchHotelsSchema = validation_1.z
    .object({
    latitude: validation_1.z.coerce.number(),
    longitude: validation_1.z.coerce.number(),
    radiusKm: validation_1.z.coerce.number().default(10),
    checkIn: validation_1.v.isoDateTime().optional(),
    checkOut: validation_1.v.isoDateTime().optional(),
    guests: validation_1.v.positiveInt().optional(),
    minPrice: validation_1.v.number(0).optional(),
    maxPrice: validation_1.v.number(0).optional(),
    instantBooking: validation_1.v.bool().optional(),
    minRating: validation_1.v.number(0, 5).optional(),
    accessibility: validation_1.z
        .enum(["wheelchair_accessible", "step_free_entry", "accessible_parking"])
        .optional(),
    north: validation_1.z.coerce.number().optional(),
    south: validation_1.z.coerce.number().optional(),
    east: validation_1.z.coerce.number().optional(),
    west: validation_1.z.coerce.number().optional(),
    sortBy: validation_1.z
        .enum(["recommended", "price_asc", "price_desc", "rating_desc"])
        .default("recommended"),
    page: validation_1.v.positiveInt().default(1),
    limit: validation_1.v.positiveInt().max(50).default(10),
})
    .refine((v) => typeof v.minPrice !== "number" ||
    typeof v.maxPrice !== "number" ||
    v.maxPrice >= v.minPrice, {
    message: "maxPrice must be greater than or equal to minPrice",
    path: ["maxPrice"],
});
exports.blockDatesSchema = validation_1.z.object({
    startDate: validation_1.v.isoDateTime(),
    endDate: validation_1.v.isoDateTime(),
    reason: validation_1.v.id().max(255),
});
exports.calendarRulesSchema = validation_1.z
    .object({
    minStayNights: validation_1.v.int(1, 365),
    maxStayNights: validation_1.v.int(1, 365),
    advanceNoticeHours: validation_1.z.coerce
        .number()
        .int()
        .min(0)
        .max(24 * 60),
    prepTimeHours: validation_1.z.coerce
        .number()
        .int()
        .min(0)
        .max(24 * 30),
    allowSameDayCheckIn: validation_1.v.bool(),
    checkInStartTime: validation_1.z.coerce
        .string()
        .trim()
        .regex(/^\d{2}:\d{2}$/)
        .optional()
        .or(validation_1.z.literal("")),
    checkInEndTime: validation_1.z.coerce
        .string()
        .trim()
        .regex(/^\d{2}:\d{2}$/)
        .optional()
        .or(validation_1.z.literal("")),
})
    .refine((v) => v.maxStayNights >= v.minStayNights, {
    message: "maxStayNights must be greater than or equal to minStayNights",
    path: ["maxStayNights"],
});
exports.icalSourceSchema = validation_1.z.object({
    name: validation_1.v.text(2, 255),
    url: validation_1.v.url(),
    enabled: validation_1.v.bool().optional(),
});
exports.icalImportSchema = validation_1.z.object({
    icsContent: validation_1.v.text(20).optional(),
    sourceUrl: validation_1.v.url().optional(),
    reason: validation_1.v.id().max(255).optional(),
});
exports.pricingRulesSchema = validation_1.z.object({
    weekdayMultiplier: validation_1.v.number(0.5, 5),
    weekendMultiplier: validation_1.v.number(0.5, 5),
    weeklyDiscountPercent: validation_1.v.number(0, 100),
    monthlyDiscountPercent: validation_1.v.number(0, 100),
    earlyBirdDiscountPercent: validation_1.v.number(0, 100),
    lastMinuteDiscountPercent: validation_1.v.number(0, 100),
    cleaningFee: validation_1.v.number(0, 100000),
});
exports.verticalQuerySchema = validation_1.z.object({
    city: validation_1.v.text(2).optional(),
    category: validation_1.v.text(2).optional(),
    page: validation_1.v.int(1, 100).optional(),
    limit: validation_1.v.int(1, 50).optional(),
});
exports.rankingExperimentSchema = validation_1.z.object({
    enabled: validation_1.v.bool(),
    experimentName: validation_1.v.text(3, 120),
    weights: validation_1.z
        .object({
        quality: validation_1.v.number(0),
        popularity: validation_1.v.number(0),
        locationPersonalization: validation_1.v.number(0),
        price: validation_1.v.number(0),
    })
        .optional(),
});
exports.createExperienceSchema = validation_1.z.object({
    title: validation_1.v.text(3, 255),
    description: validation_1.v.text(10),
    city: validation_1.v.text(2),
    category: validation_1.v.text(2),
    durationHours: validation_1.v.positiveInt(),
    price: validation_1.v.positiveNumber(),
    currency: validation_1.z.coerce.string().trim().length(3).optional(),
    hotelId: validation_1.v.id().optional(),
});
exports.createServiceListingSchema = validation_1.z.object({
    title: validation_1.v.text(3, 255),
    description: validation_1.v.text(10),
    city: validation_1.v.text(2),
    category: validation_1.v.text(2),
    basePrice: validation_1.v.positiveNumber(),
    currency: validation_1.z.coerce.string().trim().length(3).optional(),
    hotelId: validation_1.v.id().optional(),
});
exports.crossVerticalRecommendationsQuerySchema = validation_1.z.object({
    city: validation_1.v.text(2).optional(),
});
exports.hotelPromoteSchema = validation_1.z.object({
    durationDays: validation_1.v.int(1, 365).optional(),
});
exports.hotelSchemas = {
    createHotelSchema: exports.createHotelSchema,
    updateHotelSchema: exports.updateHotelSchema,
    searchHotelsSchema: exports.searchHotelsSchema,
    blockDatesSchema: exports.blockDatesSchema,
    calendarRulesSchema: exports.calendarRulesSchema,
    icalSourceSchema: exports.icalSourceSchema,
    icalImportSchema: exports.icalImportSchema,
    pricingRulesSchema: exports.pricingRulesSchema,
    verticalQuerySchema: exports.verticalQuerySchema,
    rankingExperimentSchema: exports.rankingExperimentSchema,
    createExperienceSchema: exports.createExperienceSchema,
    createServiceListingSchema: exports.createServiceListingSchema,
    crossVerticalRecommendationsQuerySchema: exports.crossVerticalRecommendationsQuerySchema,
    hotelPromoteSchema: exports.hotelPromoteSchema,
};
exports.default = exports.hotelSchemas;
