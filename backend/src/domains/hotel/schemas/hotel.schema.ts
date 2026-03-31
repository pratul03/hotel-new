import { z, v } from "../../../utils/validation";

export const createHotelSchema = z.object({
  name: z.coerce
    .string()
    .trim()
    .min(3, "Hotel name must be at least 3 characters")
    .max(200),
  description: v.trimmed(4000).optional(),
  location: z.coerce
    .string()
    .trim()
    .regex(/^-?\d+\.?\d*,-?\d+\.?\d*,.+$/, "Invalid location format"),
  amenities: z.array(v.id()).optional(),
  publicRules: v.trimmed(4000).optional(),
  checkInTime: z.coerce
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format")
    .optional(),
  checkOutTime: z.coerce
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format")
    .optional(),
  instantBooking: v.bool().optional(),
});

export const updateHotelSchema = createHotelSchema.partial();

export const searchHotelsSchema = z
  .object({
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    radiusKm: z.coerce.number().default(10),
    checkIn: v.isoDateTime().optional(),
    checkOut: v.isoDateTime().optional(),
    guests: v.positiveInt().optional(),
    minPrice: v.number(0).optional(),
    maxPrice: v.number(0).optional(),
    instantBooking: v.bool().optional(),
    minRating: v.number(0, 5).optional(),
    accessibility: z
      .enum(["wheelchair_accessible", "step_free_entry", "accessible_parking"])
      .optional(),
    north: z.coerce.number().optional(),
    south: z.coerce.number().optional(),
    east: z.coerce.number().optional(),
    west: z.coerce.number().optional(),
    sortBy: z
      .enum(["recommended", "price_asc", "price_desc", "rating_desc"])
      .default("recommended"),
    page: v.positiveInt().default(1),
    limit: v.positiveInt().max(50).default(10),
  })
  .refine(
    (v) =>
      typeof v.minPrice !== "number" ||
      typeof v.maxPrice !== "number" ||
      v.maxPrice >= v.minPrice,
    {
      message: "maxPrice must be greater than or equal to minPrice",
      path: ["maxPrice"],
    },
  );

export const blockDatesSchema = z.object({
  startDate: v.isoDateTime(),
  endDate: v.isoDateTime(),
  reason: v.id().max(255),
});

export const calendarRulesSchema = z
  .object({
    minStayNights: v.int(1, 365),
    maxStayNights: v.int(1, 365),
    advanceNoticeHours: z.coerce
      .number()
      .int()
      .min(0)
      .max(24 * 60),
    prepTimeHours: z.coerce
      .number()
      .int()
      .min(0)
      .max(24 * 30),
    allowSameDayCheckIn: v.bool(),
    checkInStartTime: z.coerce
      .string()
      .trim()
      .regex(/^\d{2}:\d{2}$/)
      .optional()
      .or(z.literal("")),
    checkInEndTime: z.coerce
      .string()
      .trim()
      .regex(/^\d{2}:\d{2}$/)
      .optional()
      .or(z.literal("")),
  })
  .refine((v) => v.maxStayNights >= v.minStayNights, {
    message: "maxStayNights must be greater than or equal to minStayNights",
    path: ["maxStayNights"],
  });

export const icalSourceSchema = z.object({
  name: v.text(2, 255),
  url: v.url(),
  enabled: v.bool().optional(),
});

export const icalImportSchema = z.object({
  icsContent: v.text(20).optional(),
  sourceUrl: v.url().optional(),
  reason: v.id().max(255).optional(),
});

export const pricingRulesSchema = z.object({
  weekdayMultiplier: v.number(0.5, 5),
  weekendMultiplier: v.number(0.5, 5),
  weeklyDiscountPercent: v.number(0, 100),
  monthlyDiscountPercent: v.number(0, 100),
  earlyBirdDiscountPercent: v.number(0, 100),
  lastMinuteDiscountPercent: v.number(0, 100),
  cleaningFee: v.number(0, 100000),
});

export const verticalQuerySchema = z.object({
  city: v.text(2).optional(),
  category: v.text(2).optional(),
  page: v.int(1, 100).optional(),
  limit: v.int(1, 50).optional(),
});

export const rankingExperimentSchema = z.object({
  enabled: v.bool(),
  experimentName: v.text(3, 120),
  weights: z
    .object({
      quality: v.number(0),
      popularity: v.number(0),
      locationPersonalization: v.number(0),
      price: v.number(0),
    })
    .optional(),
});

export const createExperienceSchema = z.object({
  title: v.text(3, 255),
  description: v.text(10),
  city: v.text(2),
  category: v.text(2),
  durationHours: v.positiveInt(),
  price: v.positiveNumber(),
  currency: z.coerce.string().trim().length(3).optional(),
  hotelId: v.id().optional(),
});

export const createServiceListingSchema = z.object({
  title: v.text(3, 255),
  description: v.text(10),
  city: v.text(2),
  category: v.text(2),
  basePrice: v.positiveNumber(),
  currency: z.coerce.string().trim().length(3).optional(),
  hotelId: v.id().optional(),
});

export const crossVerticalRecommendationsQuerySchema = z.object({
  city: v.text(2).optional(),
});

export const hotelPromoteSchema = z.object({
  durationDays: v.int(1, 365).optional(),
});

export const hotelSchemas = {
  createHotelSchema,
  updateHotelSchema,
  searchHotelsSchema,
  blockDatesSchema,
  calendarRulesSchema,
  icalSourceSchema,
  icalImportSchema,
  pricingRulesSchema,
  verticalQuerySchema,
  rankingExperimentSchema,
  createExperienceSchema,
  createServiceListingSchema,
  crossVerticalRecommendationsQuerySchema,
  hotelPromoteSchema,
};

export default hotelSchemas;
