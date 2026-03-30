"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesController = void 0;
const utils_1 = require("../../../utils");
const messages_queries_1 = require("../queries/messages.queries");
const messages_schema_1 = require("../schemas/messages.schema");
const messages_service_1 = require("../services/messages.service");
exports.messagesController = {
    async sendMessage(req, res) {
        const payload = messages_schema_1.sendMessageSchema.parse(req.body);
        const msg = await messages_service_1.messageService.sendMessage(messages_queries_1.messagesQueries.userId(req), (payload.receiverUserId || payload.receiverId), payload.content, payload.bookingId, payload.attachmentUrl, payload.attachmentType, payload.escalateToSupport);
        res.status(201).json((0, utils_1.successResponse)(msg, "Message sent"));
    },
    async getThread(req, res) {
        const thread = await messages_service_1.messageService.getThread(messages_queries_1.messagesQueries.userId(req), messages_queries_1.messagesQueries.otherUserId(req));
        res.json((0, utils_1.successResponse)(thread, "Thread fetched"));
    },
    async getConversations(req, res) {
        const data = await messages_service_1.messageService.getConversations(messages_queries_1.messagesQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Conversations fetched"));
    },
    async markAsRead(req, res) {
        const data = await messages_service_1.messageService.markAsRead(messages_queries_1.messagesQueries.userId(req), messages_queries_1.messagesQueries.messageId(req));
        res.json((0, utils_1.successResponse)(data, "Message marked as read"));
    },
    async unreadCount(req, res) {
        const data = await messages_service_1.messageService.getUnreadCount(messages_queries_1.messagesQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Unread count fetched"));
    },
};
exports.default = exports.messagesController;
