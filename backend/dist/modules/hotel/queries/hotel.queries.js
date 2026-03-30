"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotelQueries = void 0;
const hotel_schema_1 = require("../schemas/hotel.schema");
class HotelQueries {
    static getParam(value) {
        return Array.isArray(value) ? value[0] || "" : value || "";
    }
    static userId(req) {
        return req.userId;
    }
    static hotelId(req) {
        return this.getParam(req.params.id);
    }
    static sourceId(req) {
        return this.getParam(req.params.sourceId);
    }
    static firstOrUndefined(value) {
        return Array.isArray(value) ? value[0] : value;
    }
    static numberOrUndefined(value) {
        const raw = this.firstOrUndefined(value);
        if (!raw)
            return undefined;
        const parsed = Number(raw);
        return Number.isNaN(parsed) ? undefined : parsed;
    }
    static booleanOrUndefined(value) {
        const raw = this.firstOrUndefined(value);
        if (typeof raw !== "string")
            return undefined;
        if (["true", "1", "yes"].includes(raw.toLowerCase()))
            return true;
        if (["false", "0", "no"].includes(raw.toLowerCase()))
            return false;
        return undefined;
    }
    static searchParams(req) {
        return hotel_schema_1.searchHotelsSchema.parse({
            latitude: this.numberOrUndefined(req.query.latitude ??
                req.query.lat),
            longitude: this.numberOrUndefined(req.query.longitude ??
                req.query.lng),
            radiusKm: this.numberOrUndefined(req.query.radiusKm ??
                req.query.radius) ?? 10,
            checkIn: this.firstOrUndefined(req.query.checkIn),
            checkOut: this.firstOrUndefined(req.query.checkOut),
            guests: this.numberOrUndefined(req.query.guests),
            minPrice: this.numberOrUndefined(req.query.minPrice),
            maxPrice: this.numberOrUndefined(req.query.maxPrice),
            instantBooking: this.booleanOrUndefined(req.query.instantBooking),
            minRating: this.numberOrUndefined(req.query.minRating),
            accessibility: this.firstOrUndefined(req.query.accessibility),
            north: this.numberOrUndefined(req.query.north),
            south: this.numberOrUndefined(req.query.south),
            east: this.numberOrUndefined(req.query.east),
            west: this.numberOrUndefined(req.query.west),
            sortBy: this.firstOrUndefined(req.query.sortBy),
            page: this.numberOrUndefined(req.query.page) ?? 1,
            limit: this.numberOrUndefined(req.query.limit) ?? 10,
        });
    }
}
exports.hotelQueries = HotelQueries;
exports.default = exports.hotelQueries;
