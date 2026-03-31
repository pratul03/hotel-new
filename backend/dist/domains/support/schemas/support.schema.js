"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportSchemas = exports.opsDashboardQuerySchema = exports.routingConsoleQuerySchema = exports.escalationSchema = exports.emergencySchema = exports.replySchema = exports.createTicketSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.createTicketSchema = validation_1.z.object({
    subject: validation_1.v.text(3, 255),
    description: validation_1.v.text(5),
    priority: validation_1.z.enum(["low", "medium", "high", "urgent"]).optional(),
});
exports.replySchema = validation_1.z.object({
    reply: validation_1.v.id(),
});
exports.emergencySchema = validation_1.z.object({
    description: validation_1.v.text(5),
    bookingId: validation_1.v.id().optional(),
    locationHint: validation_1.v.text(2).optional(),
});
exports.escalationSchema = validation_1.z.object({
    stage: validation_1.z.enum([
        "pending_contact",
        "active_response",
        "local_authority_notified",
        "follow_up",
        "closed",
    ]),
    notes: validation_1.v.text(2).optional(),
});
exports.routingConsoleQuerySchema = validation_1.z.object({
    days: validation_1.v.int(1, 180).optional(),
});
exports.opsDashboardQuerySchema = validation_1.z.object({
    days: validation_1.v.int(1, 365).optional(),
});
exports.supportSchemas = {
    createTicketSchema: exports.createTicketSchema,
    replySchema: exports.replySchema,
    emergencySchema: exports.emergencySchema,
    escalationSchema: exports.escalationSchema,
    routingConsoleQuerySchema: exports.routingConsoleQuerySchema,
    opsDashboardQuerySchema: exports.opsDashboardQuerySchema,
};
exports.default = exports.supportSchemas;
