"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const utils_1 = require("../utils");
const support_service_1 = require("../services/support.service");
const router = (0, express_1.Router)();
const createTicketSchema = zod_1.z.object({
    subject: zod_1.z.string().min(3),
    description: zod_1.z.string().min(5),
    priority: zod_1.z.enum(["low", "medium", "high", "urgent"]).optional(),
});
const replySchema = zod_1.z.object({
    reply: zod_1.z.string().min(1),
});
const emergencySchema = zod_1.z.object({
    description: zod_1.z.string().min(5),
    bookingId: zod_1.z.string().min(1).optional(),
    locationHint: zod_1.z.string().min(2).optional(),
});
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
router.post("/tickets", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const payload = createTicketSchema.parse(req.body);
    const ticket = await support_service_1.supportService.createTicket(req.userId, payload.subject, payload.description, payload.priority);
    res.status(201).json((0, utils_1.successResponse)(ticket, "Support ticket created"));
}));
router.get("/tickets", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const tickets = await support_service_1.supportService.getTickets(req.userId);
    res.json((0, utils_1.successResponse)(tickets, "Support tickets fetched"));
}));
router.get("/tickets/:id", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const ticketId = getParam(req.params.id);
    const ticket = await support_service_1.supportService.getTicket(req.userId, ticketId);
    res.json((0, utils_1.successResponse)(ticket, "Support ticket fetched"));
}));
router.post("/tickets/:id/reply", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const ticketId = getParam(req.params.id);
    const payload = replySchema.parse(req.body);
    const ticket = await support_service_1.supportService.replyToTicket(req.userId, ticketId, payload.reply);
    res.json((0, utils_1.successResponse)(ticket, "Reply added to ticket"));
}));
router.post("/emergency", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const payload = emergencySchema.parse(req.body);
    const data = await support_service_1.supportService.createEmergencyTicket(req.userId, payload.description, payload.bookingId, payload.locationHint);
    res.status(201).json((0, utils_1.successResponse)(data, "Emergency request submitted"));
}));
exports.default = router;
