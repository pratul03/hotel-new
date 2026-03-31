"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDate = exports.toMetadataEntries = exports.toUnknownArray = exports.toStringRecord = exports.normalizeRoom = exports.normalizeHotel = exports.toIsoString = exports.toArray = void 0;
const toArray = (value) => {
    if (Array.isArray(value)) {
        return value.map(String);
    }
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(String) : [];
        }
        catch {
            return [];
        }
    }
    return [];
};
exports.toArray = toArray;
const toRuleArray = (value) => {
    if (Array.isArray(value)) {
        return value
            .map(String)
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (typeof value === "string") {
        const asJsonArray = toArray(value);
        if (asJsonArray.length > 0)
            return asJsonArray;
        return value
            .split(/\n|,/)
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};
const toDisplayLocation = (value) => {
    if (typeof value !== "string")
        return "";
    const parts = value.split(",");
    if (parts.length >= 3) {
        return parts.slice(2).join(",").trim();
    }
    return value;
};
const toIsoString = (value) => {
    if (!value)
        return null;
    if (value instanceof Date)
        return value.toISOString();
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
exports.toIsoString = toIsoString;
const normalizeHotel = (hotel) => ({
    ...hotel,
    location: toDisplayLocation(hotel.location),
    amenities: toArray(hotel.amenities),
    publicRules: toRuleArray(hotel.publicRules),
    createdAt: toIsoString(hotel.createdAt),
    updatedAt: toIsoString(hotel.updatedAt),
    promotedUntil: toIsoString(hotel.promotedUntil),
});
exports.normalizeHotel = normalizeHotel;
const normalizeRoom = (room) => ({
    ...room,
    amenities: toArray(room.amenities),
    images: toArray(room.images),
    createdAt: toIsoString(room.createdAt),
    updatedAt: toIsoString(room.updatedAt),
});
exports.normalizeRoom = normalizeRoom;
const toStringRecord = (value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [
            String(k),
            String(v ?? ""),
        ]));
    }
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [String(k), String(v ?? "")]));
            }
        }
        catch {
            return {};
        }
    }
    return {};
};
exports.toStringRecord = toStringRecord;
const toUnknownArray = (value) => {
    if (Array.isArray(value))
        return value;
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    return [];
};
exports.toUnknownArray = toUnknownArray;
const toMetadataEntries = (value) => Object.entries(toStringRecord(value)).map(([key, entryValue]) => ({
    key,
    value: entryValue,
}));
exports.toMetadataEntries = toMetadataEntries;
const toDate = (value) => new Date(value);
exports.toDate = toDate;
