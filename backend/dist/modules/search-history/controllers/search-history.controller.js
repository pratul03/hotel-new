"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchhistoryController = void 0;
const utils_1 = require("../../../utils");
const search_history_queries_1 = require("../queries/search-history.queries");
const search_history_schema_1 = require("../schemas/search-history.schema");
const search_history_service_1 = require("../services/search-history.service");
exports.searchhistoryController = {
    async create(req, res) {
        const payload = search_history_schema_1.createSchema.parse(req.body);
        const data = await search_history_service_1.searchHistoryService.add(search_history_queries_1.searchhistoryQueries.userId(req), {
            queryLocation: payload.queryLocation,
            checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined,
            checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined,
            guests: payload.guests,
        });
        res.status(201).json((0, utils_1.successResponse)(data, "Search history entry created"));
    },
    async list(req, res) {
        const data = await search_history_service_1.searchHistoryService.list(search_history_queries_1.searchhistoryQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Search history fetched"));
    },
    async clear(req, res) {
        const data = await search_history_service_1.searchHistoryService.clear(search_history_queries_1.searchhistoryQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Search history cleared"));
    },
};
exports.default = exports.searchhistoryController;
