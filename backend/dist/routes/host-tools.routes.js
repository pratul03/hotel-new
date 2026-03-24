"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const utils_1 = require("../utils");
const host_tools_service_1 = require("../services/host-tools.service");
const router = (0, express_1.Router)();
const cancellationSchema = zod_1.z.object({
    policyType: zod_1.z.enum(["flexible", "moderate", "strict"]),
    freeCancellationHours: zod_1.z
        .number()
        .int()
        .min(0)
        .max(30 * 24),
    partialRefundPercent: zod_1.z.number().int().min(0).max(100),
    noShowPenaltyPercent: zod_1.z.number().int().min(0).max(100),
});
const quickReplySchema = zod_1.z.object({
    title: zod_1.z.string().min(2).max(150),
    content: zod_1.z.string().min(2),
    category: zod_1.z.string().max(50).optional(),
});
const scheduledMessageSchema = zod_1.z.object({
    receiverUserId: zod_1.z.string().min(1),
    bookingId: zod_1.z.string().optional(),
    content: zod_1.z.string().min(1),
    sendAt: zod_1.z.string().datetime(),
});
const addCohostSchema = zod_1.z.object({
    cohostUserId: zod_1.z.string().min(1),
    permissions: zod_1.z.array(zod_1.z.string()).optional(),
    revenueSplitPercent: zod_1.z.number().int().min(0).max(100).optional(),
});
const complianceSchema = zod_1.z.object({
    jurisdictionCode: zod_1.z.string().min(2).max(120),
    checklistItems: zod_1.z.array(zod_1.z.object({
        label: zod_1.z.string().min(1),
        completed: zod_1.z.boolean(),
    })),
    status: zod_1.z.enum(["incomplete", "in_review", "completed"]).optional(),
});
const claimSchema = zod_1.z.object({
    hotelId: zod_1.z.string().min(1),
    bookingId: zod_1.z.string().min(1),
    title: zod_1.z.string().min(3).max(255),
    description: zod_1.z.string().min(5),
    amountClaimed: zod_1.z.number().min(0).optional(),
    evidenceUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
});
const listingQualitySchema = zod_1.z.object({
    coverImageUrl: zod_1.z.string().url().optional(),
    guidebook: zod_1.z.string().optional(),
    houseManual: zod_1.z.string().optional(),
    checkInSteps: zod_1.z.string().optional(),
});
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
router.get("/hotels/:hotelId/cancellation-policy", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const hotelId = getParam(req.params.hotelId);
    const data = await host_tools_service_1.hostToolsService.getCancellationPolicy(hotelId, req.userId);
    res.json((0, utils_1.successResponse)(data, "Cancellation policy retrieved"));
}));
router.put("/hotels/:hotelId/cancellation-policy", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const hotelId = getParam(req.params.hotelId);
    const payload = cancellationSchema.parse(req.body);
    const data = await host_tools_service_1.hostToolsService.upsertCancellationPolicy(hotelId, req.userId, payload);
    res.json((0, utils_1.successResponse)(data, "Cancellation policy updated"));
}));
router.get("/quick-replies", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const data = await host_tools_service_1.hostToolsService.listQuickReplies(req.userId);
    res.json((0, utils_1.successResponse)(data, "Quick replies retrieved"));
}));
router.post("/quick-replies", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const payload = quickReplySchema.parse(req.body);
    const data = await host_tools_service_1.hostToolsService.createQuickReply(req.userId, payload);
    res.status(201).json((0, utils_1.successResponse)(data, "Quick reply created"));
}));
router.delete("/quick-replies/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const id = getParam(req.params.id);
    const data = await host_tools_service_1.hostToolsService.deleteQuickReply(req.userId, id);
    res.json((0, utils_1.successResponse)(data, "Quick reply deleted"));
}));
router.get("/scheduled-messages", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const data = await host_tools_service_1.hostToolsService.listScheduledMessages(req.userId);
    res.json((0, utils_1.successResponse)(data, "Scheduled messages retrieved"));
}));
router.post("/scheduled-messages", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const payload = scheduledMessageSchema.parse(req.body);
    const data = await host_tools_service_1.hostToolsService.createScheduledMessage(req.userId, {
        ...payload,
        sendAt: new Date(payload.sendAt),
    });
    res.status(201).json((0, utils_1.successResponse)(data, "Scheduled message created"));
}));
router.post("/scheduled-messages/:id/cancel", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const id = getParam(req.params.id);
    const data = await host_tools_service_1.hostToolsService.cancelScheduledMessage(req.userId, id);
    res.json((0, utils_1.successResponse)(data, "Scheduled message cancelled"));
}));
router.get("/analytics", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const rawDays = Number(req.query.days ?? 30);
    const days = Number.isFinite(rawDays) ? rawDays : 30;
    const data = await host_tools_service_1.hostToolsService.getAnalytics(req.userId, days);
    res.json((0, utils_1.successResponse)(data, "Host analytics retrieved"));
}));
router.get("/hotels/:hotelId/cohosts", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const hotelId = getParam(req.params.hotelId);
    const data = await host_tools_service_1.hostToolsService.listCoHosts(hotelId, req.userId);
    res.json((0, utils_1.successResponse)(data, "Co-hosts retrieved"));
}));
router.post("/hotels/:hotelId/cohosts", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const hotelId = getParam(req.params.hotelId);
    const payload = addCohostSchema.parse(req.body);
    const data = await host_tools_service_1.hostToolsService.addCoHost(hotelId, req.userId, payload);
    res.status(201).json((0, utils_1.successResponse)(data, "Co-host assigned"));
}));
router.delete("/hotels/:hotelId/cohosts/:assignmentId", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const hotelId = getParam(req.params.hotelId);
    const assignmentId = getParam(req.params.assignmentId);
    const data = await host_tools_service_1.hostToolsService.removeCoHost(hotelId, req.userId, assignmentId);
    res.json((0, utils_1.successResponse)(data, "Co-host removed"));
}));
router.get("/hotels/:hotelId/compliance-checklist", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const hotelId = getParam(req.params.hotelId);
    const data = await host_tools_service_1.hostToolsService.getComplianceChecklist(hotelId, req.userId);
    res.json((0, utils_1.successResponse)(data, "Compliance checklist retrieved"));
}));
router.get("/hotels/:hotelId/listing-quality", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const hotelId = getParam(req.params.hotelId);
    const data = await host_tools_service_1.hostToolsService.getListingQuality(hotelId, req.userId);
    res.json((0, utils_1.successResponse)(data, "Listing quality retrieved"));
}));
router.put("/hotels/:hotelId/listing-quality", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const hotelId = getParam(req.params.hotelId);
    const payload = listingQualitySchema.parse(req.body);
    const data = await host_tools_service_1.hostToolsService.upsertListingQuality(hotelId, req.userId, payload);
    res.json((0, utils_1.successResponse)(data, "Listing quality updated"));
}));
router.put("/hotels/:hotelId/compliance-checklist", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const hotelId = getParam(req.params.hotelId);
    const payload = complianceSchema.parse(req.body);
    const data = await host_tools_service_1.hostToolsService.upsertComplianceChecklist(hotelId, req.userId, payload);
    res.json((0, utils_1.successResponse)(data, "Compliance checklist updated"));
}));
router.get("/claims", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const data = await host_tools_service_1.hostToolsService.listClaims(req.userId);
    res.json((0, utils_1.successResponse)(data, "Claims retrieved"));
}));
router.post("/claims", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const payload = claimSchema.parse(req.body);
    const data = await host_tools_service_1.hostToolsService.createClaim(req.userId, payload);
    res.status(201).json((0, utils_1.successResponse)(data, "Claim created"));
}));
exports.default = router;
