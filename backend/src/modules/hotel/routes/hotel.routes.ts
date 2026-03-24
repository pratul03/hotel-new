import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "../../../middleware/authMiddleware";
import { hotelService } from "../services/hotel.service";
import { env } from "../../../config/environment";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "../../../utils/response";

const router = Router();

// Validation schemas
const createHotelSchema = z.object({
  name: z.string().min(3, "Hotel name must be at least 3 characters"),
  description: z.string().optional(),
  location: z
    .string()
    .regex(/^-?\d+\.?\d*,-?\d+\.?\d*,.+$/, "Invalid location format"),
  amenities: z.array(z.string()).optional(),
  publicRules: z.string().optional(),
  checkInTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format")
    .optional(),
  checkOutTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format")
    .optional(),
  instantBooking: z.boolean().optional(),
});

const updateHotelSchema = createHotelSchema.partial();

const searchHotelsSchema = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
    radiusKm: z.number().default(10),
    checkIn: z.string().datetime().optional(),
    checkOut: z.string().datetime().optional(),
    guests: z.number().int().positive().optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    instantBooking: z.boolean().optional(),
    minRating: z.number().min(0).max(5).optional(),
    accessibility: z
      .enum(["wheelchair_accessible", "step_free_entry", "accessible_parking"])
      .optional(),
    north: z.number().optional(),
    south: z.number().optional(),
    east: z.number().optional(),
    west: z.number().optional(),
    sortBy: z
      .enum(["recommended", "price_asc", "price_desc", "rating_desc"])
      .default("recommended"),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(50).default(10),
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

const firstOrUndefined = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

const numberOrUndefined = (
  value: string | string[] | undefined,
): number | undefined => {
  const raw = firstOrUndefined(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const booleanOrUndefined = (
  value: string | string[] | undefined,
): boolean | undefined => {
  const raw = firstOrUndefined(value);
  if (typeof raw !== "string") return undefined;
  if (["true", "1", "yes"].includes(raw.toLowerCase())) return true;
  if (["false", "0", "no"].includes(raw.toLowerCase())) return false;
  return undefined;
};

const parseSearchParams = (req: Request) =>
  searchHotelsSchema.parse({
    latitude: numberOrUndefined(
      (req.query.latitude as string | string[] | undefined) ??
        (req.query.lat as string | string[] | undefined),
    ),
    longitude: numberOrUndefined(
      (req.query.longitude as string | string[] | undefined) ??
        (req.query.lng as string | string[] | undefined),
    ),
    radiusKm:
      numberOrUndefined(
        (req.query.radiusKm as string | string[] | undefined) ??
          (req.query.radius as string | string[] | undefined),
      ) ?? 10,
    checkIn: firstOrUndefined(
      req.query.checkIn as string | string[] | undefined,
    ),
    checkOut: firstOrUndefined(
      req.query.checkOut as string | string[] | undefined,
    ),
    guests: numberOrUndefined(
      req.query.guests as string | string[] | undefined,
    ),
    minPrice: numberOrUndefined(
      req.query.minPrice as string | string[] | undefined,
    ),
    maxPrice: numberOrUndefined(
      req.query.maxPrice as string | string[] | undefined,
    ),
    instantBooking: booleanOrUndefined(
      req.query.instantBooking as string | string[] | undefined,
    ),
    minRating: numberOrUndefined(
      req.query.minRating as string | string[] | undefined,
    ),
    accessibility: firstOrUndefined(
      req.query.accessibility as string | string[] | undefined,
    ),
    north: numberOrUndefined(req.query.north as string | string[] | undefined),
    south: numberOrUndefined(req.query.south as string | string[] | undefined),
    east: numberOrUndefined(req.query.east as string | string[] | undefined),
    west: numberOrUndefined(req.query.west as string | string[] | undefined),
    sortBy: firstOrUndefined(req.query.sortBy as string | string[] | undefined),
    page:
      numberOrUndefined(req.query.page as string | string[] | undefined) ?? 1,
    limit:
      numberOrUndefined(req.query.limit as string | string[] | undefined) ?? 10,
  });

const blockDatesSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(1),
});

const calendarRulesSchema = z
  .object({
    minStayNights: z.number().int().min(1).max(365),
    maxStayNights: z.number().int().min(1).max(365),
    advanceNoticeHours: z
      .number()
      .int()
      .min(0)
      .max(24 * 60),
    prepTimeHours: z
      .number()
      .int()
      .min(0)
      .max(24 * 30),
    allowSameDayCheckIn: z.boolean(),
    checkInStartTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional()
      .or(z.literal("")),
    checkInEndTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional()
      .or(z.literal("")),
  })
  .refine((v) => v.maxStayNights >= v.minStayNights, {
    message: "maxStayNights must be greater than or equal to minStayNights",
    path: ["maxStayNights"],
  });

const icalSourceSchema = z.object({
  name: z.string().min(2).max(255),
  url: z.string().url(),
  enabled: z.boolean().optional(),
});

const icalImportSchema = z.object({
  icsContent: z.string().min(20).optional(),
  sourceUrl: z.string().url().optional(),
  reason: z.string().min(1).max(255).optional(),
});

const pricingRulesSchema = z.object({
  weekdayMultiplier: z.number().min(0.5).max(5),
  weekendMultiplier: z.number().min(0.5).max(5),
  weeklyDiscountPercent: z.number().min(0).max(100),
  monthlyDiscountPercent: z.number().min(0).max(100),
  earlyBirdDiscountPercent: z.number().min(0).max(100),
  lastMinuteDiscountPercent: z.number().min(0).max(100),
  cleaningFee: z.number().min(0).max(100000),
});

const verticalQuerySchema = z.object({
  city: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  page: z.coerce.number().int().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const rankingExperimentSchema = z.object({
  enabled: z.boolean(),
  experimentName: z.string().min(3).max(120),
  weights: z
    .object({
      quality: z.number().min(0),
      popularity: z.number().min(0),
      locationPersonalization: z.number().min(0),
      price: z.number().min(0),
    })
    .optional(),
});

const createExperienceSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10),
  city: z.string().min(2),
  category: z.string().min(2),
  durationHours: z.number().int().positive(),
  price: z.number().positive(),
  currency: z.string().length(3).optional(),
  hotelId: z.string().min(1).optional(),
});

const createServiceListingSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10),
  city: z.string().min(2),
  category: z.string().min(2),
  basePrice: z.number().positive(),
  currency: z.string().length(3).optional(),
  hotelId: z.string().min(1).optional(),
});

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";

// Create hotel (host only)
router.post(
  "/",
  authenticate,
  requireRole(["host"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const data = createHotelSchema.parse(req.body);
      const hotel = await hotelService.createHotel(req.userId, data);

      res
        .status(201)
        .json(successResponse(hotel, "Hotel created successfully"));
    } catch (error) {
      next(error);
    }
  },
);

const handleSearchHotels = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const params = parseSearchParams(req);

    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, env.JWT_SECRET) as {
          userId?: string;
        };
        userId = decoded.userId;
      } catch {
        userId = undefined;
      }
    }

    const result = await hotelService.searchHotels({
      ...params,
      checkIn: params.checkIn ? new Date(params.checkIn) : undefined,
      checkOut: params.checkOut ? new Date(params.checkOut) : undefined,
      userId,
    });

    res.json(
      paginatedResponse(
        result.data,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
      ),
    );
  } catch (error) {
    next(error);
  }
};

// Search hotels (public)
router.get("/search", handleSearchHotels);
router.get("/", handleSearchHotels);

router.get(
  "/experiences",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = verticalQuerySchema.parse(req.query);
      const data = await hotelService.listExperiences(payload);
      res.json(successResponse(data, "Experiences marketplace retrieved"));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/experiences",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = createExperienceSchema.parse(req.body);
      const data = await hotelService.createExperience(
        req.userId as string,
        payload,
      );
      res.status(201).json(successResponse(data, "Experience created"));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/services-marketplace",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = verticalQuerySchema.parse(req.query);
      const data = await hotelService.listServicesMarketplace(payload);
      res.json(successResponse(data, "Services marketplace retrieved"));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/services-marketplace",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = createServiceListingSchema.parse(req.body);
      const data = await hotelService.createServiceListing(
        req.userId as string,
        payload,
      );
      res.status(201).json(successResponse(data, "Service listing created"));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/recommendations/cross-vertical",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = z
        .object({ city: z.string().min(2).optional() })
        .parse(req.query);
      const data = await hotelService.getCrossVerticalRecommendations(
        req.userId as string,
        payload.city,
      );
      res.json(
        successResponse(data, "Cross-vertical recommendations retrieved"),
      );
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/ranking-experiment",
  authenticate,
  requireRole(["admin"]),
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await hotelService.getRankingExperiment();
      res.json(successResponse(data, "Ranking experiment config retrieved"));
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  "/ranking-experiment",
  authenticate,
  requireRole(["admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const payload = rankingExperimentSchema.parse(req.body);
      const data = await hotelService.upsertRankingExperiment(
        req.userId as string,
        payload,
      );
      res.json(successResponse(data, "Ranking experiment config updated"));
    } catch (error) {
      next(error);
    }
  },
);

// Get hotel by ID
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hotelId = getParam(req.params.id as string | string[] | undefined);
    const hotel = await hotelService.getHotelById(hotelId);
    res.json(successResponse(hotel, "Hotel retrieved"));
  } catch (error) {
    next(error);
  }
});

// Update hotel (host only)
router.put(
  "/:id",
  authenticate,
  requireRole(["host"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const data = updateHotelSchema.parse(req.body);
      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const hotel = await hotelService.updateHotel(hotelId, req.userId, data);

      res.json(successResponse(hotel, "Hotel updated successfully"));
    } catch (error) {
      next(error);
    }
  },
);

// Delete hotel (host only)
router.delete(
  "/:id",
  authenticate,
  requireRole(["host"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const result = await hotelService.deleteHotel(hotelId, req.userId);

      res.json(successResponse(result, "Hotel deleted successfully"));
    } catch (error) {
      next(error);
    }
  },
);

// Block dates (host only)
router.post(
  "/:id/block-dates",
  authenticate,
  requireRole(["host"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const data = blockDatesSchema.parse(req.body);
      const hotelId = getParam(req.params.id as string | string[] | undefined);

      const blockedDates = await hotelService.blockDates(hotelId, req.userId, {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });

      res
        .status(201)
        .json(successResponse(blockedDates, "Dates blocked successfully"));
    } catch (error) {
      next(error);
    }
  },
);

// Get blocked dates
router.get(
  "/:id/block-dates",
  authenticate,
  requireRole(["host"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const blockedDates = await hotelService.getBlockedDates(hotelId);
      res.json(successResponse(blockedDates, "Blocked dates retrieved"));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id/calendar-rules",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const rules = await hotelService.getCalendarRules(hotelId, req.userId);
      res.json(successResponse(rules, "Calendar rules retrieved"));
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  "/:id/calendar-rules",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const parsed = calendarRulesSchema.parse(req.body);

      const rules = await hotelService.upsertCalendarRules(
        hotelId,
        req.userId,
        {
          ...parsed,
          checkInStartTime: parsed.checkInStartTime || undefined,
          checkInEndTime: parsed.checkInEndTime || undefined,
        },
      );

      res.json(successResponse(rules, "Calendar rules updated"));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id/ical/export",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const ical = await hotelService.exportIcal(hotelId, req.userId);
      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=hotel-${hotelId}.ics`,
      );
      return res.status(200).send(ical);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id/ical/sources",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const data = await hotelService.getIcalSources(hotelId, req.userId);
      res.json(successResponse(data, "iCal sources retrieved"));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/ical/sources",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const payload = icalSourceSchema.parse(req.body);
      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const data = await hotelService.addIcalSource(
        hotelId,
        req.userId,
        payload,
      );
      res.status(201).json(successResponse(data, "iCal source added"));
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:id/ical/sources/:sourceId",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const sourceId = getParam(
        req.params.sourceId as string | string[] | undefined,
      );
      const data = await hotelService.deleteIcalSource(
        hotelId,
        sourceId,
        req.userId,
      );
      res.json(successResponse(data, "iCal source deleted"));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/ical/import",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const payload = icalImportSchema.parse(req.body);

      let icsContent = payload.icsContent;
      if (!icsContent && payload.sourceUrl) {
        const response = await fetch(payload.sourceUrl);
        if (!response.ok) {
          return res
            .status(400)
            .json(errorResponse("BAD_REQUEST", "Failed to fetch source URL"));
        }
        icsContent = await response.text();
      }

      if (!icsContent) {
        return res
          .status(400)
          .json(
            errorResponse("BAD_REQUEST", "icsContent or sourceUrl is required"),
          );
      }

      const data = await hotelService.importFromIcalContent(
        hotelId,
        req.userId,
        icsContent,
        payload.reason ?? "ical_sync",
      );
      res.status(201).json(successResponse(data, "iCal imported"));
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/ical/sources/:sourceId/sync",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const sourceId = getParam(
        req.params.sourceId as string | string[] | undefined,
      );
      const data = await hotelService.syncIcalSource(
        hotelId,
        sourceId,
        req.userId,
      );
      res.json(successResponse(data, "iCal source synced"));
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id/pricing-rules",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }
      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const data = await hotelService.getPricingRules(hotelId, req.userId);
      res.json(successResponse(data, "Pricing rules retrieved"));
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  "/:id/pricing-rules",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }
      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const payload = pricingRulesSchema.parse(req.body);
      const data = await hotelService.upsertPricingRules(
        hotelId,
        req.userId,
        payload,
      );
      res.json(successResponse(data, "Pricing rules updated"));
    } catch (error) {
      next(error);
    }
  },
);

// Get my hotels (authenticated host)
router.get(
  "/my",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }
      const hotels = await hotelService.getMyHotels(req.userId);
      res.json(successResponse(hotels, "My hotels retrieved"));
    } catch (error) {
      next(error);
    }
  },
);

// Get promoted hotels (public)
router.get(
  "/promoted",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const hotels = await hotelService.getPromotedHotels();
      res.json(successResponse(hotels, "Promoted hotels retrieved"));
    } catch (error) {
      next(error);
    }
  },
);

// Promote a hotel (host/admin only)
router.post(
  "/:id/promote",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }
      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const durationDays = Number(req.body.durationDays) || 30;
      const hotel = await hotelService.promoteHotel(
        hotelId,
        req.userId,
        durationDays,
      );
      res.json(successResponse(hotel, "Hotel promoted successfully"));
    } catch (error) {
      next(error);
    }
  },
);

// Unpromote a hotel (host/admin only)
router.delete(
  "/:id/promote",
  authenticate,
  requireRole(["host", "admin"]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }
      const hotelId = getParam(req.params.id as string | string[] | undefined);
      const hotel = await hotelService.unpromotedHotel(hotelId, req.userId);
      res.json(successResponse(hotel, "Hotel unpromoted successfully"));
    } catch (error) {
      next(error);
    }
  },
);

export default router;

