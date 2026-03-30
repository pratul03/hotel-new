"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesQueries = void 0;
class MessagesQueries {
    static getParam(value) {
        return Array.isArray(value) ? value[0] || "" : value || "";
    }
    static userId(req) {
        return req.userId;
    }
    static messageId(req) {
        return this.getParam(req.params.id);
    }
    static otherUserId(req) {
        return this.getParam(req.params.userId);
    }
}
exports.messagesQueries = MessagesQueries;
exports.default = exports.messagesQueries;
