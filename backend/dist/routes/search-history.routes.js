"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const utils_1 = require("../utils");
const searchHistory_service_1 = require("../services/searchHistory.service");
const router = (0, express_1.Router)();
const createSchema = zod_1.z.object({
    queryLocation: zod_1.z.string().min(1),
    checkIn: zod_1.z.string().datetime().optional(),
    checkOut: zod_1.z.string().datetime().optional(),
    guests: zod_1.z.number().int().positive().optional(),
});
router.post('/', authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const payload = createSchema.parse(req.body);
    const data = await searchHistory_service_1.searchHistoryService.add(req.userId, {
        queryLocation: payload.queryLocation,
        checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined,
        checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined,
        guests: payload.guests,
    });
    res.status(201).json((0, utils_1.successResponse)(data, 'Search history entry created'));
}));
router.get('/', authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const data = await searchHistory_service_1.searchHistoryService.list(req.userId);
    res.json((0, utils_1.successResponse)(data, 'Search history fetched'));
}));
router.delete('/', authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const data = await searchHistory_service_1.searchHistoryService.clear(req.userId);
    res.json((0, utils_1.successResponse)(data, 'Search history cleared'));
}));
exports.default = router;
