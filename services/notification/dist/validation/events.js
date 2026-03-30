"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAppEvent = void 0;
const isRecord = (value) => typeof value === "object" && value !== null;
const isString = (value) => typeof value === "string";
const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
const hasString = (obj, key) => isString(obj[key]) && obj[key].trim().length > 0;
const isIsoDate = (value) => isString(value) && !Number.isNaN(Date.parse(value));
const isUserInfo = (value) => {
    if (!isRecord(value))
        return false;
    return (hasString(value, "id") &&
        hasString(value, "name") &&
        hasString(value, "email"));
};
const isHotelInfo = (value) => {
    if (!isRecord(value))
        return false;
    return hasString(value, "name");
};
const hasBookingWindow = (data) => hasString(data, "bookingId") &&
    isIsoDate(data.checkIn) &&
    isIsoDate(data.checkOut);
const validators = {
    "booking.created": (data) => {
        if (!isRecord(data))
            return false;
        return (hasBookingWindow(data) &&
            isUserInfo(data.guest) &&
            isUserInfo(data.host) &&
            isRecord(data.room) &&
            hasString(data.room, "type") &&
            isHotelInfo(data.hotel) &&
            isNumber(data.amount) &&
            isNumber(data.guestCount));
    },
    "booking.confirmed": (data) => {
        if (!isRecord(data))
            return false;
        return (hasBookingWindow(data) &&
            isUserInfo(data.guest) &&
            isHotelInfo(data.hotel) &&
            isNumber(data.amount));
    },
    "booking.cancelled": (data) => {
        if (!isRecord(data))
            return false;
        const reasonValid = data.reason === undefined || isString(data.reason);
        return (hasBookingWindow(data) &&
            isUserInfo(data.guest) &&
            isUserInfo(data.host) &&
            isHotelInfo(data.hotel) &&
            reasonValid);
    },
    "booking.checked_in": (data) => {
        if (!isRecord(data))
            return false;
        return (hasString(data, "bookingId") &&
            isUserInfo(data.guest) &&
            isHotelInfo(data.hotel) &&
            isIsoDate(data.checkOut));
    },
    "booking.checked_out": (data) => {
        if (!isRecord(data))
            return false;
        return (hasString(data, "bookingId") &&
            isUserInfo(data.guest) &&
            isHotelInfo(data.hotel));
    },
    "booking.expired": (data) => {
        if (!isRecord(data))
            return false;
        return (hasBookingWindow(data) &&
            isUserInfo(data.guest) &&
            isHotelInfo(data.hotel));
    },
    "payment.success": (data) => {
        if (!isRecord(data))
            return false;
        return (hasString(data, "bookingId") &&
            hasString(data, "paymentId") &&
            isUserInfo(data.guest) &&
            isNumber(data.amount) &&
            isHotelInfo(data.hotel));
    },
    "payment.failed": (data) => {
        if (!isRecord(data))
            return false;
        return (hasString(data, "bookingId") &&
            isUserInfo(data.guest) &&
            isNumber(data.amount));
    },
    "message.new": (data) => {
        if (!isRecord(data))
            return false;
        const bookingIdValid = data.bookingId === undefined || isString(data.bookingId);
        return (hasString(data, "messageId") &&
            isUserInfo(data.sender) &&
            isUserInfo(data.receiver) &&
            hasString(data, "content") &&
            bookingIdValid);
    },
    "review.created": (data) => {
        if (!isRecord(data))
            return false;
        const commentValid = data.comment === undefined || isString(data.comment);
        return (hasString(data, "reviewId") &&
            isUserInfo(data.sender) &&
            isUserInfo(data.receiver) &&
            isNumber(data.rating) &&
            hasString(data, "bookingId") &&
            commentValid);
    },
    "checkin.reminder": (data) => {
        if (!isRecord(data) || !isRecord(data.hotel))
            return false;
        return (hasString(data, "bookingId") &&
            isUserInfo(data.guest) &&
            hasString(data.hotel, "name") &&
            hasString(data.hotel, "checkInTime") &&
            isIsoDate(data.checkIn));
    },
    "checkout.reminder": (data) => {
        if (!isRecord(data) || !isRecord(data.hotel))
            return false;
        return (hasString(data, "bookingId") &&
            isUserInfo(data.guest) &&
            hasString(data.hotel, "name") &&
            hasString(data.hotel, "checkOutTime") &&
            isIsoDate(data.checkOut));
    },
    "superhost.updated": (data) => {
        if (!isRecord(data))
            return false;
        return (hasString(data, "userId") &&
            isUserInfo(data.host) &&
            hasString(data, "status") &&
            hasString(data, "previousStatus"));
    },
    "incident.escalated": (data) => {
        if (!isRecord(data))
            return false;
        return (hasString(data, "incidentId") &&
            hasString(data, "bookingId") &&
            hasString(data, "reporterName") &&
            hasString(data, "description") &&
            isIsoDate(data.createdAt) &&
            hasString(data, "adminEmail"));
    },
};
const parseAppEvent = (payload) => {
    if (!isRecord(payload))
        return null;
    if (!hasString(payload, "type") || !hasString(payload, "timestamp"))
        return null;
    const type = payload.type;
    const validator = validators[type];
    if (!validator)
        return null;
    if (!validator(payload.data))
        return null;
    if (!isIsoDate(payload.timestamp))
        return null;
    return {
        type,
        data: payload.data,
        timestamp: payload.timestamp,
    };
};
exports.parseAppEvent = parseAppEvent;
