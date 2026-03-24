"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const utils_1 = require("../utils");
const message_service_1 = require("../services/message.service");
const router = (0, express_1.Router)();
const sendMessageSchema = zod_1.z
    .object({
    receiverUserId: zod_1.z.string().min(1).optional(),
    receiverId: zod_1.z.string().min(1).optional(),
    content: zod_1.z.string().min(1),
    bookingId: zod_1.z.string().optional(),
    attachmentUrl: zod_1.z.string().url().optional(),
    attachmentType: zod_1.z.enum(["image", "pdf", "file"]).optional(),
    escalateToSupport: zod_1.z.boolean().optional(),
})
    .refine((v) => Boolean(v.receiverUserId || v.receiverId), {
    message: "receiverUserId or receiverId is required",
    path: ["receiverUserId"],
});
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
router.post("/", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const payload = sendMessageSchema.parse(req.body);
    const msg = await message_service_1.messageService.sendMessage(req.userId, (payload.receiverUserId || payload.receiverId), payload.content, payload.bookingId, payload.attachmentUrl, payload.attachmentType, payload.escalateToSupport);
    res.status(201).json((0, utils_1.successResponse)(msg, "Message sent"));
}));
router.get("/thread/:userId", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const otherUserId = getParam(req.params.userId);
    const thread = await message_service_1.messageService.getThread(req.userId, otherUserId);
    res.json((0, utils_1.successResponse)(thread, "Thread fetched"));
}));
router.get("/:userId", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const otherUserId = getParam(req.params.userId);
    const thread = await message_service_1.messageService.getThread(req.userId, otherUserId);
    res.json((0, utils_1.successResponse)(thread, "Thread fetched"));
}));
router.get("/conversations", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const data = await message_service_1.messageService.getConversations(req.userId);
    res.json((0, utils_1.successResponse)(data, "Conversations fetched"));
}));
router.patch("/:id/read", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const messageId = getParam(req.params.id);
    const data = await message_service_1.messageService.markAsRead(req.userId, messageId);
    res.json((0, utils_1.successResponse)(data, "Message marked as read"));
}));
router.get("/unread-count", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const data = await message_service_1.messageService.getUnreadCount(req.userId);
    res.json((0, utils_1.successResponse)(data, "Unread count fetched"));
}));
exports.default = router;
