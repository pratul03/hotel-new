"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomQueries = void 0;
const room_schema_1 = require("../schemas/room.schema");
class RoomQueries {
    static getParam(value) {
        return Array.isArray(value) ? value[0] || "" : value || "";
    }
    static userId(req) {
        return req.userId;
    }
    static id(req) {
        return this.getParam(req.params.id);
    }
    static hotelId(req) {
        return this.getParam(req.params.hotelId);
    }
    static imageKey(req) {
        return this.getParam(req.params.imageKey);
    }
    static dateRange(req) {
        const payload = room_schema_1.roomDateRangeQuerySchema.parse(req.query);
        return {
            checkIn: new Date(payload.checkIn),
            checkOut: new Date(payload.checkOut),
        };
    }
    static fileName(req) {
        const payload = room_schema_1.presignedUrlQuerySchema.parse(req.query);
        return payload.fileName;
    }
}
exports.roomQueries = RoomQueries;
exports.default = exports.roomQueries;
