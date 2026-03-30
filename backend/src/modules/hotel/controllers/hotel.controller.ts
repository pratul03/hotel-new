import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { env } from "../../../config/environment";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import {
  errorResponse,
  paginatedResponse,
  successResponse,
} from "../../../utils/response";
import { hotelQueries } from "../queries/hotel.queries";
import {
  blockDatesSchema,
  calendarRulesSchema,
  createExperienceSchema,
  createHotelSchema,
  createServiceListingSchema,
  crossVerticalRecommendationsQuerySchema,
  hotelPromoteSchema,
  icalImportSchema,
  icalSourceSchema,
  pricingRulesSchema,
  rankingExperimentSchema,
  updateHotelSchema,
  verticalQuerySchema,
} from "../schemas/hotel.schema";
import { hotelService } from "../services/hotel.service";

export const hotelController = {
  async create(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const data = createHotelSchema.parse(req.body);
    const hotel = await hotelService.createHotel(userId, data);
    res.status(201).json(successResponse(hotel, "Hotel created successfully"));
  },

  async search(req: Request, res: Response) {
    const params = hotelQueries.searchParams(req);

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
  },

  async listExperiences(req: Request, res: Response) {
    const payload = verticalQuerySchema.parse(req.query);
    const data = await hotelService.listExperiences(payload);
    res.json(successResponse(data, "Experiences marketplace retrieved"));
  },

  async createExperience(req: AuthenticatedRequest, res: Response) {
    const payload = createExperienceSchema.parse(req.body);
    const data = await hotelService.createExperience(
      hotelQueries.userId(req) as string,
      payload,
    );
    res.status(201).json(successResponse(data, "Experience created"));
  },

  async listServicesMarketplace(req: Request, res: Response) {
    const payload = verticalQuerySchema.parse(req.query);
    const data = await hotelService.listServicesMarketplace(payload);
    res.json(successResponse(data, "Services marketplace retrieved"));
  },

  async createServiceListing(req: AuthenticatedRequest, res: Response) {
    const payload = createServiceListingSchema.parse(req.body);
    const data = await hotelService.createServiceListing(
      hotelQueries.userId(req) as string,
      payload,
    );
    res.status(201).json(successResponse(data, "Service listing created"));
  },

  async crossVerticalRecommendations(req: AuthenticatedRequest, res: Response) {
    const payload = crossVerticalRecommendationsQuerySchema.parse(req.query);
    const data = await hotelService.getCrossVerticalRecommendations(
      hotelQueries.userId(req) as string,
      payload.city,
    );
    res.json(successResponse(data, "Cross-vertical recommendations retrieved"));
  },

  async getRankingExperiment(_req: AuthenticatedRequest, res: Response) {
    const data = await hotelService.getRankingExperiment();
    res.json(successResponse(data, "Ranking experiment config retrieved"));
  },

  async updateRankingExperiment(req: AuthenticatedRequest, res: Response) {
    const payload = rankingExperimentSchema.parse(req.body);
    const data = await hotelService.upsertRankingExperiment(
      hotelQueries.userId(req) as string,
      payload,
    );
    res.json(successResponse(data, "Ranking experiment config updated"));
  },

  async getById(req: Request, res: Response) {
    const hotel = await hotelService.getHotelById(hotelQueries.hotelId(req));
    res.json(successResponse(hotel, "Hotel retrieved"));
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const data = updateHotelSchema.parse(req.body);
    const hotel = await hotelService.updateHotel(
      hotelQueries.hotelId(req),
      userId,
      data,
    );
    res.json(successResponse(hotel, "Hotel updated successfully"));
  },

  async delete(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const result = await hotelService.deleteHotel(
      hotelQueries.hotelId(req),
      userId,
    );
    res.json(successResponse(result, "Hotel deleted successfully"));
  },

  async blockDates(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const data = blockDatesSchema.parse(req.body);
    const blockedDates = await hotelService.blockDates(
      hotelQueries.hotelId(req),
      userId,
      {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    );

    res
      .status(201)
      .json(successResponse(blockedDates, "Dates blocked successfully"));
  },

  async getBlockedDates(req: AuthenticatedRequest, res: Response) {
    const blockedDates = await hotelService.getBlockedDates(
      hotelQueries.hotelId(req),
    );
    res.json(successResponse(blockedDates, "Blocked dates retrieved"));
  },

  async getCalendarRules(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const rules = await hotelService.getCalendarRules(
      hotelQueries.hotelId(req),
      userId,
    );
    res.json(successResponse(rules, "Calendar rules retrieved"));
  },

  async upsertCalendarRules(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const parsed = calendarRulesSchema.parse(req.body);
    const rules = await hotelService.upsertCalendarRules(
      hotelQueries.hotelId(req),
      userId,
      {
        ...parsed,
        checkInStartTime: parsed.checkInStartTime || undefined,
        checkInEndTime: parsed.checkInEndTime || undefined,
      },
    );

    res.json(successResponse(rules, "Calendar rules updated"));
  },

  async exportIcal(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const hotelId = hotelQueries.hotelId(req);
    const ical = await hotelService.exportIcal(hotelId, userId);
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=hotel-${hotelId}.ics`,
    );
    res.status(200).send(ical);
  },

  async getIcalSources(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const data = await hotelService.getIcalSources(
      hotelQueries.hotelId(req),
      userId,
    );
    res.json(successResponse(data, "iCal sources retrieved"));
  },

  async addIcalSource(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const payload = icalSourceSchema.parse(req.body);
    const data = await hotelService.addIcalSource(
      hotelQueries.hotelId(req),
      userId,
      {
        name: payload.name,
        url: payload.url as string,
        enabled: payload.enabled,
      },
    );
    res.status(201).json(successResponse(data, "iCal source added"));
  },

  async deleteIcalSource(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const data = await hotelService.deleteIcalSource(
      hotelQueries.hotelId(req),
      hotelQueries.sourceId(req),
      userId,
    );
    res.json(successResponse(data, "iCal source deleted"));
  },

  async importIcal(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const hotelId = hotelQueries.hotelId(req);
    const payload = icalImportSchema.parse(req.body);

    let icsContent = payload.icsContent;
    if (!icsContent && payload.sourceUrl) {
      const response = await fetch(payload.sourceUrl);
      if (!response.ok) {
        res
          .status(400)
          .json(errorResponse("BAD_REQUEST", "Failed to fetch source URL"));
        return;
      }

      icsContent = await response.text();
    }

    if (!icsContent) {
      res
        .status(400)
        .json(
          errorResponse("BAD_REQUEST", "icsContent or sourceUrl is required"),
        );
      return;
    }

    const data = await hotelService.importFromIcalContent(
      hotelId,
      userId,
      icsContent,
      payload.reason ?? "ical_sync",
    );
    res.status(201).json(successResponse(data, "iCal imported"));
  },

  async syncIcalSource(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const data = await hotelService.syncIcalSource(
      hotelQueries.hotelId(req),
      hotelQueries.sourceId(req),
      userId,
    );
    res.json(successResponse(data, "iCal source synced"));
  },

  async getPricingRules(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const data = await hotelService.getPricingRules(
      hotelQueries.hotelId(req),
      userId,
    );
    res.json(successResponse(data, "Pricing rules retrieved"));
  },

  async upsertPricingRules(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const payload = pricingRulesSchema.parse(req.body);
    const data = await hotelService.upsertPricingRules(
      hotelQueries.hotelId(req),
      userId,
      payload,
    );
    res.json(successResponse(data, "Pricing rules updated"));
  },

  async getMyHotels(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const hotels = await hotelService.getMyHotels(userId);
    res.json(successResponse(hotels, "My hotels retrieved"));
  },

  async getPromotedHotels(_req: Request, res: Response) {
    const hotels = await hotelService.getPromotedHotels();
    res.json(successResponse(hotels, "Promoted hotels retrieved"));
  },

  async promote(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const payload = hotelPromoteSchema.parse(req.body);
    const hotel = await hotelService.promoteHotel(
      hotelQueries.hotelId(req),
      userId,
      payload.durationDays ?? 30,
    );
    res.json(successResponse(hotel, "Hotel promoted successfully"));
  },

  async unpromote(req: AuthenticatedRequest, res: Response) {
    const userId = hotelQueries.userId(req);
    if (!userId) {
      res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
      return;
    }

    const hotel = await hotelService.unpromotedHotel(
      hotelQueries.hotelId(req),
      userId,
    );
    res.json(successResponse(hotel, "Hotel unpromoted successfully"));
  },
};

export default hotelController;
