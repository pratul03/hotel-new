"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const utils_1 = require("../utils");
const report_service_1 = require("../services/report.service");
const router = (0, express_1.Router)();
const createSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1),
    description: zod_1.z.string().min(5),
});
const resolveSchema = zod_1.z.object({
    resolution: zod_1.z.string().min(3),
});
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
router.post("/incident", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const payload = createSchema.parse(req.body);
    const data = await report_service_1.reportService.reportIncident(req.userId, payload.bookingId, payload.description);
    res.status(201).json((0, utils_1.successResponse)(data, "Incident reported"));
}));
router.get("/:id", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const id = getParam(req.params.id);
    const data = await report_service_1.reportService.getIncident(req.userId, id);
    res.json((0, utils_1.successResponse)(data, "Incident fetched"));
}));
router.patch("/:id/resolve", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const id = getParam(req.params.id);
    const payload = resolveSchema.parse(req.body);
    const data = await report_service_1.reportService.resolveIncident(req.userId, id, payload.resolution);
    res.json((0, utils_1.successResponse)(data, "Incident resolved"));
}));
exports.default = router;
