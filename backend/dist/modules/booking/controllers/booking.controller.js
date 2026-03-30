"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingController = void 0;
const utils_1 = require("../../../utils");
const booking_service_1 = require("../services/booking.service");
const booking_queries_1 = require("../queries/booking.queries");
const booking_schema_1 = require("../schemas/booking.schema");
exports.bookingController = {
    async create(req, res) {
        const userId = req.userId;
        const payload = booking_schema_1.createBookingSchema.parse(req.body);
        const booking = await booking_service_1.bookingService.createBooking(userId, {
            roomId: payload.roomId,
            checkIn: new Date(payload.checkIn),
            checkOut: new Date(payload.checkOut),
            guestCount: payload.guestCount,
            notes: payload.notes,
        });
        res.status(201).json((0, utils_1.successResponse)(booking, "Booking created"));
    },
    async getMine(req, res) {
        const bookings = await booking_service_1.bookingService.getMyBookings(req.userId);
        res.json((0, utils_1.successResponse)(bookings, "Bookings retrieved"));
    },
    async getHost(req, res) {
        const bookings = await booking_service_1.bookingService.getHostBookings(req.userId);
        res.json((0, utils_1.successResponse)(bookings, "Host bookings retrieved"));
    },
    async getPreview(req, res) {
        const payload = booking_schema_1.previewSchema.parse(req.query);
        const data = await booking_service_1.bookingService.getBookingPricePreview({
            roomId: payload.roomId,
            checkIn: new Date(payload.checkIn),
            checkOut: new Date(payload.checkOut),
            guestCount: payload.guestCount,
        });
        res.json((0, utils_1.successResponse)(data, "Booking price preview retrieved"));
    },
    async getRiskPreview(req, res) {
        const payload = booking_schema_1.riskSchema.parse(req.query);
        const data = await booking_service_1.bookingService.getReservationRisk(req.userId, {
            roomId: payload.roomId,
            checkIn: new Date(payload.checkIn),
            checkOut: new Date(payload.checkOut),
            guestCount: payload.guestCount,
        });
        res.json((0, utils_1.successResponse)(data, "Reservation risk preview retrieved"));
    },
    async getById(req, res) {
        const bookingId = booking_queries_1.bookingQueries.id(req);
        const booking = await booking_service_1.bookingService.getBookingById(req.userId, bookingId);
        res.json((0, utils_1.successResponse)(booking, "Booking retrieved"));
    },
    async update(req, res) {
        const bookingId = booking_queries_1.bookingQueries.id(req);
        const payload = booking_schema_1.updateSchema.parse(req.body);
        const booking = await booking_service_1.bookingService.updateBooking(req.userId, bookingId, {
            guestCount: payload.guestCount,
            checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined,
            checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined,
            notes: payload.notes,
        });
        res.json((0, utils_1.successResponse)(booking, "Booking updated"));
    },
    async cancel(req, res) {
        const { reason } = booking_schema_1.cancelSchema.parse(req.body);
        const bookingId = booking_queries_1.bookingQueries.id(req);
        const booking = await booking_service_1.bookingService.cancelBooking(req.userId, bookingId, reason);
        res.json((0, utils_1.successResponse)(booking, "Booking cancelled"));
    },
    async getCancellationPreview(req, res) {
        const bookingId = booking_queries_1.bookingQueries.id(req);
        const data = await booking_service_1.bookingService.getCancellationPreview(req.userId, bookingId);
        res.json((0, utils_1.successResponse)(data, "Cancellation preview retrieved"));
    },
    async getRebookingOptions(req, res) {
        const bookingId = booking_queries_1.bookingQueries.id(req);
        const payload = booking_schema_1.rebookingSchema.parse(req.body);
        const data = await booking_service_1.bookingService.getRebookingOptions(req.userId, bookingId, payload.reason);
        res.json((0, utils_1.successResponse)(data, "Rebooking options retrieved"));
    },
    async simulateTravelDisruption(req, res) {
        const bookingId = booking_queries_1.bookingQueries.id(req);
        const payload = booking_schema_1.travelDisruptionSchema.parse(req.body);
        const data = await booking_service_1.bookingService.assessTravelDisruption(req.userId, bookingId, payload);
        res.json((0, utils_1.successResponse)(data, "Travel disruption simulation generated"));
    },
    async confirmCheckIn(req, res) {
        const bookingId = booking_queries_1.bookingQueries.id(req);
        const booking = await booking_service_1.bookingService.confirmCheckIn(req.userId, bookingId);
        res.json((0, utils_1.successResponse)(booking, "Check-in confirmed"));
    },
    async confirmCheckOut(req, res) {
        const bookingId = booking_queries_1.bookingQueries.id(req);
        const booking = await booking_service_1.bookingService.confirmCheckOut(req.userId, bookingId);
        res.json((0, utils_1.successResponse)(booking, "Check-out confirmed"));
    },
    async hostAccept(req, res) {
        const bookingId = booking_queries_1.bookingQueries.id(req);
        const booking = await booking_service_1.bookingService.hostAcceptBooking(req.userId, bookingId);
        res.json((0, utils_1.successResponse)(booking, "Booking accepted by host"));
    },
    async hostDecline(req, res) {
        const bookingId = booking_queries_1.bookingQueries.id(req);
        const payload = booking_schema_1.hostDeclineSchema.parse(req.body);
        const booking = await booking_service_1.bookingService.hostDeclineBooking(req.userId, bookingId, payload.reason);
        res.json((0, utils_1.successResponse)(booking, "Booking declined by host"));
    },
    async hostAlter(req, res) {
        const bookingId = booking_queries_1.bookingQueries.id(req);
        const payload = booking_schema_1.hostAlterSchema.parse(req.body);
        const booking = await booking_service_1.bookingService.hostAlterBooking(req.userId, bookingId, {
            guestCount: payload.guestCount,
            checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined,
            checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined,
            notes: payload.notes,
        });
        res.json((0, utils_1.successResponse)(booking, "Booking altered by host"));
    },
    async hostNoShow(req, res) {
        const bookingId = booking_queries_1.bookingQueries.id(req);
        const payload = booking_schema_1.hostNoShowSchema.parse(req.body);
        const booking = await booking_service_1.bookingService.hostMarkNoShow(req.userId, bookingId, payload.notes);
        res.json((0, utils_1.successResponse)(booking, "Booking marked as no-show"));
    },
};
exports.default = exports.bookingController;
