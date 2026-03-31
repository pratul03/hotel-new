"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingSchemas = exports.travelDisruptionSchema = exports.rebookingSchema = exports.hostNoShowSchema = exports.hostAlterSchema = exports.hostDeclineSchema = exports.updateSchema = exports.cancelSchema = exports.riskSchema = exports.previewSchema = exports.createBookingSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.createBookingSchema = validation_1.z.object({
    roomId: validation_1.v.id(),
    checkIn: validation_1.v.isoDateTime(),
    checkOut: validation_1.v.isoDateTime(),
    guestCount: validation_1.v.positiveInt(),
    notes: validation_1.v.text(1, 1000).optional(),
});
exports.previewSchema = validation_1.z.object({
    roomId: validation_1.v.id(),
    checkIn: validation_1.v.isoDateTime(),
    checkOut: validation_1.v.isoDateTime(),
    guestCount: validation_1.v.positiveInt().default(1),
});
exports.riskSchema = validation_1.z.object({
    roomId: validation_1.v.id(),
    checkIn: validation_1.v.isoDateTime(),
    checkOut: validation_1.v.isoDateTime(),
    guestCount: validation_1.v.positiveInt().default(1),
});
exports.cancelSchema = validation_1.z.object({
    reason: validation_1.v.text(2, 500).optional(),
});
exports.updateSchema = validation_1.z.object({
    guestCount: validation_1.v.positiveInt().optional(),
    checkIn: validation_1.v.isoDateTime().optional(),
    checkOut: validation_1.v.isoDateTime().optional(),
    notes: validation_1.v.text(1, 1000).optional(),
});
exports.hostDeclineSchema = validation_1.z.object({
    reason: validation_1.v.text(2, 500).optional(),
});
exports.hostAlterSchema = validation_1.z.object({
    guestCount: validation_1.v.positiveInt().optional(),
    checkIn: validation_1.v.isoDateTime().optional(),
    checkOut: validation_1.v.isoDateTime().optional(),
    notes: validation_1.v.text(1, 1000).optional(),
});
exports.hostNoShowSchema = validation_1.z.object({
    notes: validation_1.v.text(1, 1000).optional(),
});
exports.rebookingSchema = validation_1.z.object({
    reason: validation_1.v.text(3, 500),
});
exports.travelDisruptionSchema = validation_1.z.object({
    eventType: validation_1.z.enum([
        "weather",
        "transport_strike",
        "airport_closure",
        "medical",
        "government_restriction",
    ]),
    severity: validation_1.z.enum(["low", "medium", "high", "critical"]),
});
exports.bookingSchemas = {
    createBookingSchema: exports.createBookingSchema,
    previewSchema: exports.previewSchema,
    riskSchema: exports.riskSchema,
    cancelSchema: exports.cancelSchema,
    updateSchema: exports.updateSchema,
    hostDeclineSchema: exports.hostDeclineSchema,
    hostAlterSchema: exports.hostAlterSchema,
    hostNoShowSchema: exports.hostNoShowSchema,
    rebookingSchema: exports.rebookingSchema,
    travelDisruptionSchema: exports.travelDisruptionSchema,
};
exports.default = exports.bookingSchemas;
