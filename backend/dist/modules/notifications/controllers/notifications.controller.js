"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsController = void 0;
const utils_1 = require("../../../utils");
const notifications_queries_1 = require("../queries/notifications.queries");
const notifications_schema_1 = require("../schemas/notifications.schema");
const notifications_service_1 = require("../services/notifications.service");
exports.notificationsController = {
    async list(req, res) {
        const data = await notifications_service_1.notificationService.list(notifications_queries_1.notificationsQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Notifications fetched"));
    },
    async markRead(req, res) {
        const data = await notifications_service_1.notificationService.markRead(notifications_queries_1.notificationsQueries.userId(req), notifications_queries_1.notificationsQueries.id(req));
        res.json((0, utils_1.successResponse)(data, "Notification marked as read"));
    },
    async markAllRead(req, res) {
        const data = await notifications_service_1.notificationService.markAllRead(notifications_queries_1.notificationsQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "All notifications marked as read"));
    },
    async unreadCount(req, res) {
        const data = await notifications_service_1.notificationService.unreadCount(notifications_queries_1.notificationsQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Unread count fetched"));
    },
    async getPreferences(req, res) {
        const data = await notifications_service_1.notificationService.getPreferences(notifications_queries_1.notificationsQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Notification preferences fetched"));
    },
    async updatePreferences(req, res) {
        const payload = notifications_schema_1.preferencesSchema.parse(req.body);
        const data = await notifications_service_1.notificationService.updatePreferences(notifications_queries_1.notificationsQueries.userId(req), payload);
        res.json((0, utils_1.successResponse)(data, "Notification preferences updated"));
    },
    async delete(req, res) {
        const data = await notifications_service_1.notificationService.delete(notifications_queries_1.notificationsQueries.userId(req), notifications_queries_1.notificationsQueries.id(req));
        res.json((0, utils_1.successResponse)(data, "Notification deleted"));
    },
};
exports.default = exports.notificationsController;
