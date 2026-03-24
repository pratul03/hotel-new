"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const utils_1 = require("../utils");
const notification_service_1 = require("../services/notification.service");
const router = (0, express_1.Router)();
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
const preferencesSchema = zod_1.z.object({
    inApp: zod_1.z.boolean().optional(),
    email: zod_1.z.boolean().optional(),
    push: zod_1.z.boolean().optional(),
    booking: zod_1.z.boolean().optional(),
    message: zod_1.z.boolean().optional(),
    payment: zod_1.z.boolean().optional(),
    marketing: zod_1.z.boolean().optional(),
});
router.get("/", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const data = await notification_service_1.notificationService.list(req.userId);
    res.json((0, utils_1.successResponse)(data, "Notifications fetched"));
}));
router.patch("/:id/read", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const id = getParam(req.params.id);
    const data = await notification_service_1.notificationService.markRead(req.userId, id);
    res.json((0, utils_1.successResponse)(data, "Notification marked as read"));
}));
router.patch("/read-all", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const data = await notification_service_1.notificationService.markAllRead(req.userId);
    res.json((0, utils_1.successResponse)(data, "All notifications marked as read"));
}));
router.get("/unread-count", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const data = await notification_service_1.notificationService.unreadCount(req.userId);
    res.json((0, utils_1.successResponse)(data, "Unread count fetched"));
}));
router.get("/preferences", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const data = await notification_service_1.notificationService.getPreferences(req.userId);
    res.json((0, utils_1.successResponse)(data, "Notification preferences fetched"));
}));
router.put("/preferences", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const payload = preferencesSchema.parse(req.body);
    const data = await notification_service_1.notificationService.updatePreferences(req.userId, payload);
    res.json((0, utils_1.successResponse)(data, "Notification preferences updated"));
}));
router.delete("/:id", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const id = getParam(req.params.id);
    const data = await notification_service_1.notificationService.delete(req.userId, id);
    res.json((0, utils_1.successResponse)(data, "Notification deleted"));
}));
exports.default = router;
