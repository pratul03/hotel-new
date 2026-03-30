"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotelController = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const environment_1 = require("../../../config/environment");
const response_1 = require("../../../utils/response");
const hotel_queries_1 = require("../queries/hotel.queries");
const hotel_schema_1 = require("../schemas/hotel.schema");
const hotel_service_1 = require("../services/hotel.service");
exports.hotelController = {
    async create(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const data = hotel_schema_1.createHotelSchema.parse(req.body);
        const hotel = await hotel_service_1.hotelService.createHotel(userId, data);
        res.status(201).json((0, response_1.successResponse)(hotel, "Hotel created successfully"));
    },
    async search(req, res) {
        const params = hotel_queries_1.hotelQueries.searchParams(req);
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
    },
    async listExperiences(req, res) {
        const payload = hotel_schema_1.verticalQuerySchema.parse(req.query);
        const data = await hotel_service_1.hotelService.listExperiences(payload);
        res.json((0, response_1.successResponse)(data, "Experiences marketplace retrieved"));
    },
    async createExperience(req, res) {
        const payload = hotel_schema_1.createExperienceSchema.parse(req.body);
        const data = await hotel_service_1.hotelService.createExperience(hotel_queries_1.hotelQueries.userId(req), payload);
        res.status(201).json((0, response_1.successResponse)(data, "Experience created"));
    },
    async listServicesMarketplace(req, res) {
        const payload = hotel_schema_1.verticalQuerySchema.parse(req.query);
        const data = await hotel_service_1.hotelService.listServicesMarketplace(payload);
        res.json((0, response_1.successResponse)(data, "Services marketplace retrieved"));
    },
    async createServiceListing(req, res) {
        const payload = hotel_schema_1.createServiceListingSchema.parse(req.body);
        const data = await hotel_service_1.hotelService.createServiceListing(hotel_queries_1.hotelQueries.userId(req), payload);
        res.status(201).json((0, response_1.successResponse)(data, "Service listing created"));
    },
    async crossVerticalRecommendations(req, res) {
        const payload = hotel_schema_1.crossVerticalRecommendationsQuerySchema.parse(req.query);
        const data = await hotel_service_1.hotelService.getCrossVerticalRecommendations(hotel_queries_1.hotelQueries.userId(req), payload.city);
        res.json((0, response_1.successResponse)(data, "Cross-vertical recommendations retrieved"));
    },
    async getRankingExperiment(_req, res) {
        const data = await hotel_service_1.hotelService.getRankingExperiment();
        res.json((0, response_1.successResponse)(data, "Ranking experiment config retrieved"));
    },
    async updateRankingExperiment(req, res) {
        const payload = hotel_schema_1.rankingExperimentSchema.parse(req.body);
        const data = await hotel_service_1.hotelService.upsertRankingExperiment(hotel_queries_1.hotelQueries.userId(req), payload);
        res.json((0, response_1.successResponse)(data, "Ranking experiment config updated"));
    },
    async getById(req, res) {
        const hotel = await hotel_service_1.hotelService.getHotelById(hotel_queries_1.hotelQueries.hotelId(req));
        res.json((0, response_1.successResponse)(hotel, "Hotel retrieved"));
    },
    async update(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const data = hotel_schema_1.updateHotelSchema.parse(req.body);
        const hotel = await hotel_service_1.hotelService.updateHotel(hotel_queries_1.hotelQueries.hotelId(req), userId, data);
        res.json((0, response_1.successResponse)(hotel, "Hotel updated successfully"));
    },
    async delete(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const result = await hotel_service_1.hotelService.deleteHotel(hotel_queries_1.hotelQueries.hotelId(req), userId);
        res.json((0, response_1.successResponse)(result, "Hotel deleted successfully"));
    },
    async blockDates(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const data = hotel_schema_1.blockDatesSchema.parse(req.body);
        const blockedDates = await hotel_service_1.hotelService.blockDates(hotel_queries_1.hotelQueries.hotelId(req), userId, {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
        });
        res
            .status(201)
            .json((0, response_1.successResponse)(blockedDates, "Dates blocked successfully"));
    },
    async getBlockedDates(req, res) {
        const blockedDates = await hotel_service_1.hotelService.getBlockedDates(hotel_queries_1.hotelQueries.hotelId(req));
        res.json((0, response_1.successResponse)(blockedDates, "Blocked dates retrieved"));
    },
    async getCalendarRules(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const rules = await hotel_service_1.hotelService.getCalendarRules(hotel_queries_1.hotelQueries.hotelId(req), userId);
        res.json((0, response_1.successResponse)(rules, "Calendar rules retrieved"));
    },
    async upsertCalendarRules(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const parsed = hotel_schema_1.calendarRulesSchema.parse(req.body);
        const rules = await hotel_service_1.hotelService.upsertCalendarRules(hotel_queries_1.hotelQueries.hotelId(req), userId, {
            ...parsed,
            checkInStartTime: parsed.checkInStartTime || undefined,
            checkInEndTime: parsed.checkInEndTime || undefined,
        });
        res.json((0, response_1.successResponse)(rules, "Calendar rules updated"));
    },
    async exportIcal(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const hotelId = hotel_queries_1.hotelQueries.hotelId(req);
        const ical = await hotel_service_1.hotelService.exportIcal(hotelId, userId);
        res.setHeader("Content-Type", "text/calendar; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=hotel-${hotelId}.ics`);
        res.status(200).send(ical);
    },
    async getIcalSources(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const data = await hotel_service_1.hotelService.getIcalSources(hotel_queries_1.hotelQueries.hotelId(req), userId);
        res.json((0, response_1.successResponse)(data, "iCal sources retrieved"));
    },
    async addIcalSource(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const payload = hotel_schema_1.icalSourceSchema.parse(req.body);
        const data = await hotel_service_1.hotelService.addIcalSource(hotel_queries_1.hotelQueries.hotelId(req), userId, {
            name: payload.name,
            url: payload.url,
            enabled: payload.enabled,
        });
        res.status(201).json((0, response_1.successResponse)(data, "iCal source added"));
    },
    async deleteIcalSource(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const data = await hotel_service_1.hotelService.deleteIcalSource(hotel_queries_1.hotelQueries.hotelId(req), hotel_queries_1.hotelQueries.sourceId(req), userId);
        res.json((0, response_1.successResponse)(data, "iCal source deleted"));
    },
    async importIcal(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const hotelId = hotel_queries_1.hotelQueries.hotelId(req);
        const payload = hotel_schema_1.icalImportSchema.parse(req.body);
        let icsContent = payload.icsContent;
        if (!icsContent && payload.sourceUrl) {
            const response = await fetch(payload.sourceUrl);
            if (!response.ok) {
                res
                    .status(400)
                    .json((0, response_1.errorResponse)("BAD_REQUEST", "Failed to fetch source URL"));
                return;
            }
            icsContent = await response.text();
        }
        if (!icsContent) {
            res
                .status(400)
                .json((0, response_1.errorResponse)("BAD_REQUEST", "icsContent or sourceUrl is required"));
            return;
        }
        const data = await hotel_service_1.hotelService.importFromIcalContent(hotelId, userId, icsContent, payload.reason ?? "ical_sync");
        res.status(201).json((0, response_1.successResponse)(data, "iCal imported"));
    },
    async syncIcalSource(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const data = await hotel_service_1.hotelService.syncIcalSource(hotel_queries_1.hotelQueries.hotelId(req), hotel_queries_1.hotelQueries.sourceId(req), userId);
        res.json((0, response_1.successResponse)(data, "iCal source synced"));
    },
    async getPricingRules(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const data = await hotel_service_1.hotelService.getPricingRules(hotel_queries_1.hotelQueries.hotelId(req), userId);
        res.json((0, response_1.successResponse)(data, "Pricing rules retrieved"));
    },
    async upsertPricingRules(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const payload = hotel_schema_1.pricingRulesSchema.parse(req.body);
        const data = await hotel_service_1.hotelService.upsertPricingRules(hotel_queries_1.hotelQueries.hotelId(req), userId, payload);
        res.json((0, response_1.successResponse)(data, "Pricing rules updated"));
    },
    async getMyHotels(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const hotels = await hotel_service_1.hotelService.getMyHotels(userId);
        res.json((0, response_1.successResponse)(hotels, "My hotels retrieved"));
    },
    async getPromotedHotels(_req, res) {
        const hotels = await hotel_service_1.hotelService.getPromotedHotels();
        res.json((0, response_1.successResponse)(hotels, "Promoted hotels retrieved"));
    },
    async promote(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const payload = hotel_schema_1.hotelPromoteSchema.parse(req.body);
        const hotel = await hotel_service_1.hotelService.promoteHotel(hotel_queries_1.hotelQueries.hotelId(req), userId, payload.durationDays ?? 30);
        res.json((0, response_1.successResponse)(hotel, "Hotel promoted successfully"));
    },
    async unpromote(req, res) {
        const userId = hotel_queries_1.hotelQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const hotel = await hotel_service_1.hotelService.unpromotedHotel(hotel_queries_1.hotelQueries.hotelId(req), userId);
        res.json((0, response_1.successResponse)(hotel, "Hotel unpromoted successfully"));
    },
};
exports.default = exports.hotelController;
