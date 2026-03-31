"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coreQueryResolvers = void 0;
const auth_service_1 = require("../../../../domains/auth/services/auth.service");
const booking_schema_1 = require("../../../../domains/booking/schemas/booking.schema");
const booking_service_1 = require("../../../../domains/booking/services/booking.service");
const hotel_schema_1 = require("../../../../domains/hotel/schemas/hotel.schema");
const hotel_service_1 = require("../../../../domains/hotel/services/hotel.service");
const messages_service_1 = require("../../../../domains/messages/services/messages.service");
const notifications_service_1 = require("../../../../domains/notifications/services/notifications.service");
const payment_service_1 = require("../../../../domains/payments/services/payment.service");
const room_service_1 = require("../../../../domains/room/services/room.service");
const room_schema_1 = require("../../../../domains/room/schemas/room.schema");
const context_1 = require("../../../context");
const helpers_1 = require("../../helpers");
exports.coreQueryResolvers = {
    me: async (_parent, _args, context) => {
        const authUser = (0, context_1.requireAuth)(context);
        return auth_service_1.authService.getCurrentUser(authUser.userId);
    },
    hotelById: async (_parent, args) => {
        const hotel = await hotel_service_1.hotelService.getHotelById(args.id);
        return (0, helpers_1.normalizeHotel)(hotel);
    },
    searchHotels: async (_parent, args, context) => {
        const payload = hotel_schema_1.searchHotelsSchema.parse(args.input);
        const result = await hotel_service_1.hotelService.searchHotels({
            ...payload,
            checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined,
            checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined,
            userId: context.authUser?.userId,
        });
        return {
            data: result.data.map((hotel) => (0, helpers_1.normalizeHotel)(hotel)),
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            pages: result.pagination.pages,
        };
    },
    myBookings: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return booking_service_1.bookingService.getMyBookings(auth.userId);
    },
    hostBookings: async (_parent, _args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return booking_service_1.bookingService.getHostBookings(auth.userId);
    },
    bookingById: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return booking_service_1.bookingService.getBookingById(auth.userId, args.bookingId);
    },
    bookingCancellationPreview: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return booking_service_1.bookingService.getCancellationPreview(auth.userId, args.bookingId);
    },
    bookingPricePreview: async (_parent, args) => {
        const parsed = booking_schema_1.previewSchema.parse(args.input);
        return booking_service_1.bookingService.getBookingPricePreview({
            ...parsed,
            checkIn: (0, helpers_1.toDate)(parsed.checkIn),
            checkOut: (0, helpers_1.toDate)(parsed.checkOut),
        });
    },
    reservationRisk: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = booking_schema_1.riskSchema.parse(args.input);
        return booking_service_1.bookingService.getReservationRisk(auth.userId, {
            ...parsed,
            checkIn: (0, helpers_1.toDate)(parsed.checkIn),
            checkOut: (0, helpers_1.toDate)(parsed.checkOut),
        });
    },
    rebookingOptions: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = booking_schema_1.rebookingSchema.parse({ reason: args.reason });
        return booking_service_1.bookingService.getRebookingOptions(auth.userId, args.bookingId, parsed.reason);
    },
    roomById: async (_parent, args) => {
        return room_service_1.roomService.getRoomById(args.roomId);
    },
    myHotels: async (_parent, _args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const hotels = await hotel_service_1.hotelService.getMyHotels(auth.userId);
        return hotels.map((hotel) => (0, helpers_1.normalizeHotel)(hotel));
    },
    promotedHotels: async (_parent, args) => {
        const limit = typeof args.limit === "number" && args.limit > 0
            ? Math.min(args.limit, 50)
            : 8;
        const hotels = await hotel_service_1.hotelService.getPromotedHotels(limit);
        return hotels.map((hotel) => (0, helpers_1.normalizeHotel)(hotel));
    },
    hotelBlockedDates: async (_parent, args, context) => {
        (0, context_1.requireRole)(context, ["host", "admin"]);
        return hotel_service_1.hotelService.getBlockedDates(args.hotelId);
    },
    hotelCalendarRules: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return hotel_service_1.hotelService.getCalendarRules(args.hotelId, auth.userId);
    },
    hotelIcalSources: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return hotel_service_1.hotelService.getIcalSources(args.hotelId, auth.userId);
    },
    hotelPricingRules: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return hotel_service_1.hotelService.getPricingRules(args.hotelId, auth.userId);
    },
    roomAvailability: async (_parent, args) => {
        const parsed = room_schema_1.roomDateRangeQuerySchema.parse(args.input);
        return room_service_1.roomService.checkAvailability(args.roomId, (0, helpers_1.toDate)(parsed.checkIn), (0, helpers_1.toDate)(parsed.checkOut));
    },
    roomPricing: async (_parent, args) => {
        const parsed = room_schema_1.roomDateRangeQuerySchema.parse(args.input);
        return room_service_1.roomService.getPricing(args.roomId, {
            checkIn: (0, helpers_1.toDate)(parsed.checkIn),
            checkOut: (0, helpers_1.toDate)(parsed.checkOut),
        });
    },
    paymentById: async (_parent, args) => {
        return payment_service_1.paymentService.getById(args.paymentId);
    },
    paymentByBooking: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return payment_service_1.paymentService.getByBooking(auth.userId, args.bookingId);
    },
    paymentQueueSummary: async (_parent, _args, context) => {
        (0, context_1.requireRole)(context, ["admin"]);
        return payment_service_1.paymentService.getPaymentQueueSummary();
    },
    fxRates: async () => payment_service_1.paymentService.listFxRates(),
    messageThread: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return messages_service_1.messageService.getThread(auth.userId, args.otherUserId);
    },
    conversations: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return messages_service_1.messageService.getConversations(auth.userId);
    },
    unreadMessagesCount: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return messages_service_1.messageService.getUnreadCount(auth.userId);
    },
    notifications: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return notifications_service_1.notificationService.list(auth.userId);
    },
    unreadNotificationsCount: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return notifications_service_1.notificationService.unreadCount(auth.userId);
    },
    notificationPreferences: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return notifications_service_1.notificationService.getPreferences(auth.userId);
    },
};
