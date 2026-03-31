"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomSchemas = exports.presignedUrlQuerySchema = exports.roomDateRangeQuerySchema = exports.updateRoomSchema = exports.createRoomSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.createRoomSchema = validation_1.z.object({
    roomType: validation_1.v.id(),
    capacity: validation_1.v.positiveInt(),
    maxGuests: validation_1.v.positiveInt(),
    basePrice: validation_1.v.positiveNumber(),
    amenities: validation_1.z.array(validation_1.v.id()).optional(),
});
exports.updateRoomSchema = exports.createRoomSchema.partial();
exports.roomDateRangeQuerySchema = validation_1.z.object({
    checkIn: validation_1.v.isoDateTime(),
    checkOut: validation_1.v.isoDateTime(),
});
exports.presignedUrlQuerySchema = validation_1.z.object({
    fileName: validation_1.v.id().max(255),
});
exports.roomSchemas = {
    createRoomSchema: exports.createRoomSchema,
    updateRoomSchema: exports.updateRoomSchema,
    roomDateRangeQuerySchema: exports.roomDateRangeQuerySchema,
    presignedUrlQuerySchema: exports.presignedUrlQuerySchema,
};
exports.default = exports.roomSchemas;
