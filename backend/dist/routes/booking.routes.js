"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const booking_service_1 = require("../services/booking.service");
const utils_1 = require("../utils");
const router = (0, express_1.Router)();
const createBookingSchema = zod_1.z.object({
    roomId: zod_1.z.string().min(1),
    checkIn: zod_1.z.string().datetime(),
    checkOut: zod_1.z.string().datetime(),
    guestCount: zod_1.z.number().int().positive(),
    notes: zod_1.z.string().optional(),
});
const cancelSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
const updateSchema = zod_1.z.object({
    guestCount: zod_1.z.number().int().positive().optional(),
    checkIn: zod_1.z.string().datetime().optional(),
    checkOut: zod_1.z.string().datetime().optional(),
    notes: zod_1.z.string().optional(),
});
const hostDeclineSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
const hostAlterSchema = zod_1.z.object({
    guestCount: zod_1.z.number().int().positive().optional(),
    checkIn: zod_1.z.string().datetime().optional(),
    checkOut: zod_1.z.string().datetime().optional(),
    notes: zod_1.z.string().optional(),
});
const hostNoShowSchema = zod_1.z.object({
    notes: zod_1.z.string().optional(),
});
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
router.post("/", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const userId = req.userId;
    const data = createBookingSchema.parse(req.body);
    const booking = await booking_service_1.bookingService.createBooking(userId, {
        roomId: data.roomId,
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        guestCount: data.guestCount,
        notes: data.notes,
    });
    res.status(201).json((0, utils_1.successResponse)(booking, "Booking created"));
}));
router.get("/me", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const bookings = await booking_service_1.bookingService.getMyBookings(req.userId);
    res.json((0, utils_1.successResponse)(bookings, "Bookings retrieved"));
}));
router.get("/host", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const bookings = await booking_service_1.bookingService.getHostBookings(req.userId);
    res.json((0, utils_1.successResponse)(bookings, "Host bookings retrieved"));
}));
router.get("/:id", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const bookingId = getParam(req.params.id);
    const booking = await booking_service_1.bookingService.getBookingById(req.userId, bookingId);
    res.json((0, utils_1.successResponse)(booking, "Booking retrieved"));
}));
router.patch("/:id/update", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const bookingId = getParam(req.params.id);
    const payload = updateSchema.parse(req.body);
    const booking = await booking_service_1.bookingService.updateBooking(req.userId, bookingId, {
        guestCount: payload.guestCount,
        checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined,
        checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined,
        notes: payload.notes,
    });
    res.json((0, utils_1.successResponse)(booking, "Booking updated"));
}));
router.patch("/:id/cancel", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const { reason } = cancelSchema.parse(req.body);
    const bookingId = getParam(req.params.id);
    const booking = await booking_service_1.bookingService.cancelBooking(req.userId, bookingId, reason);
    res.json((0, utils_1.successResponse)(booking, "Booking cancelled"));
}));
router.get("/:id/cancellation-preview", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const bookingId = getParam(req.params.id);
    const data = await booking_service_1.bookingService.getCancellationPreview(req.userId, bookingId);
    res.json((0, utils_1.successResponse)(data, "Cancellation preview retrieved"));
}));
router.post("/:id/confirm-checkin", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const bookingId = getParam(req.params.id);
    const booking = await booking_service_1.bookingService.confirmCheckIn(req.userId, bookingId);
    res.json((0, utils_1.successResponse)(booking, "Check-in confirmed"));
}));
router.post("/:id/confirm-checkout", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const bookingId = getParam(req.params.id);
    const booking = await booking_service_1.bookingService.confirmCheckOut(req.userId, bookingId);
    res.json((0, utils_1.successResponse)(booking, "Check-out confirmed"));
}));
router.post("/:id/host/accept", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const bookingId = getParam(req.params.id);
    const booking = await booking_service_1.bookingService.hostAcceptBooking(req.userId, bookingId);
    res.json((0, utils_1.successResponse)(booking, "Booking accepted by host"));
}));
router.post("/:id/host/decline", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const bookingId = getParam(req.params.id);
    const payload = hostDeclineSchema.parse(req.body);
    const booking = await booking_service_1.bookingService.hostDeclineBooking(req.userId, bookingId, payload.reason);
    res.json((0, utils_1.successResponse)(booking, "Booking declined by host"));
}));
router.patch("/:id/host/alter", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const bookingId = getParam(req.params.id);
    const payload = hostAlterSchema.parse(req.body);
    const booking = await booking_service_1.bookingService.hostAlterBooking(req.userId, bookingId, {
        guestCount: payload.guestCount,
        checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined,
        checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined,
        notes: payload.notes,
    });
    res.json((0, utils_1.successResponse)(booking, "Booking altered by host"));
}));
router.post("/:id/host/no-show", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(async (req, res) => {
    const bookingId = getParam(req.params.id);
    const payload = hostNoShowSchema.parse(req.body);
    const booking = await booking_service_1.bookingService.hostMarkNoShow(req.userId, bookingId, payload.notes);
    res.json((0, utils_1.successResponse)(booking, "Booking marked as no-show"));
}));
exports.default = router;
