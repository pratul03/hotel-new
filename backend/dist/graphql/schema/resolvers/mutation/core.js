"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coreMutationResolvers = void 0;
const auth_service_1 = require("../../../../domains/auth/services/auth.service");
const auth_schema_1 = require("../../../../domains/auth/schemas/auth.schema");
const booking_schema_1 = require("../../../../domains/booking/schemas/booking.schema");
const booking_service_1 = require("../../../../domains/booking/services/booking.service");
const hotel_schema_1 = require("../../../../domains/hotel/schemas/hotel.schema");
const hotel_service_1 = require("../../../../domains/hotel/services/hotel.service");
const messages_schema_1 = require("../../../../domains/messages/schemas/messages.schema");
const messages_service_1 = require("../../../../domains/messages/services/messages.service");
const notifications_schema_1 = require("../../../../domains/notifications/schemas/notifications.schema");
const notifications_service_1 = require("../../../../domains/notifications/services/notifications.service");
const payments_schema_1 = require("../../../../domains/payments/schemas/payments.schema");
const payment_service_1 = require("../../../../domains/payments/services/payment.service");
const room_schema_1 = require("../../../../domains/room/schemas/room.schema");
const room_service_1 = require("../../../../domains/room/services/room.service");
const context_1 = require("../../../context");
const helpers_1 = require("../../helpers");
exports.coreMutationResolvers = {
    register: async (_parent, args) => {
        const payload = auth_schema_1.registerSchema.parse(args.input);
        return auth_service_1.authService.register(payload.email, payload.password, payload.name, payload.role);
    },
    login: async (_parent, args) => {
        const payload = auth_schema_1.loginSchema.parse(args.input);
        return auth_service_1.authService.login(payload.email, payload.password);
    },
    createHotel: async (_parent, args, context) => {
        const authUser = (0, context_1.requireRole)(context, ["host", "admin"]);
        const rawLocation = args.input?.location;
        const normalizedLocation = typeof rawLocation === "string" &&
            !/^-?\d+\.?\d*,-?\d+\.?\d*,.+$/.test(rawLocation)
            ? `0,0,${rawLocation}`
            : rawLocation;
        const payload = hotel_schema_1.createHotelSchema.parse({
            ...(args.input || {}),
            location: normalizedLocation,
            publicRules: Array.isArray(args.input?.publicRules)
                ? args.input.publicRules
                    .filter(Boolean)
                    .join("\n")
                : args.input?.publicRules,
            amenities: Array.isArray(args.input?.amenities)
                ? args.input.amenities
                : undefined,
        });
        const hotel = await hotel_service_1.hotelService.createHotel(authUser.userId, payload);
        return (0, helpers_1.normalizeHotel)(hotel);
    },
    updateHotel: async (_parent, args, context) => {
        const authUser = (0, context_1.requireRole)(context, ["host", "admin"]);
        const rawLocation = args.input?.location;
        const normalizedLocation = typeof rawLocation === "string" &&
            !/^-?\d+\.?\d*,-?\d+\.?\d*,.+$/.test(rawLocation)
            ? `0,0,${rawLocation}`
            : rawLocation;
        const parsed = hotel_schema_1.updateHotelSchema.parse({
            ...(args.input || {}),
            location: normalizedLocation,
            publicRules: Array.isArray(args.input?.publicRules)
                ? args.input.publicRules
                    .filter(Boolean)
                    .join("\n")
                : args.input?.publicRules,
        });
        const hotel = await hotel_service_1.hotelService.updateHotel(args.hotelId, authUser.userId, parsed);
        return (0, helpers_1.normalizeHotel)(hotel);
    },
    deleteHotel: async (_parent, args, context) => {
        const authUser = (0, context_1.requireRole)(context, ["host", "admin"]);
        await hotel_service_1.hotelService.deleteHotel(args.hotelId, authUser.userId);
        return { deleted: true, message: "Hotel deleted successfully" };
    },
    promoteHotel: async (_parent, args, context) => {
        const authUser = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = hotel_schema_1.hotelPromoteSchema.parse({
            durationDays: args.durationDays,
        });
        return hotel_service_1.hotelService.promoteHotel(args.hotelId, authUser.userId, parsed.durationDays ?? 30);
    },
    unpromoteHotel: async (_parent, args, context) => {
        const authUser = (0, context_1.requireRole)(context, ["host", "admin"]);
        return hotel_service_1.hotelService.unpromotedHotel(args.hotelId, authUser.userId);
    },
    blockHotelDates: async (_parent, args, context) => {
        const authUser = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = hotel_schema_1.blockDatesSchema.parse(args.input);
        return hotel_service_1.hotelService.blockDates(args.hotelId, authUser.userId, {
            startDate: (0, helpers_1.toDate)(parsed.startDate),
            endDate: (0, helpers_1.toDate)(parsed.endDate),
            reason: parsed.reason,
        });
    },
    upsertHotelCalendarRules: async (_parent, args, context) => {
        const authUser = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = hotel_schema_1.calendarRulesSchema.parse(args.input);
        return hotel_service_1.hotelService.upsertCalendarRules(args.hotelId, authUser.userId, parsed);
    },
    createHotelIcalSource: async (_parent, args, context) => {
        const authUser = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = hotel_schema_1.icalSourceSchema.parse(args.input);
        return hotel_service_1.hotelService.addIcalSource(args.hotelId, authUser.userId, {
            name: parsed.name,
            url: parsed.url,
            enabled: parsed.enabled,
        });
    },
    deleteHotelIcalSource: async (_parent, args, context) => {
        const authUser = (0, context_1.requireRole)(context, ["host", "admin"]);
        await hotel_service_1.hotelService.deleteIcalSource(args.hotelId, args.sourceId, authUser.userId);
        return { deleted: true, message: "iCal source deleted" };
    },
    syncHotelIcalSource: async (_parent, args, context) => {
        const authUser = (0, context_1.requireRole)(context, ["host", "admin"]);
        return hotel_service_1.hotelService.syncIcalSource(args.hotelId, args.sourceId, authUser.userId);
    },
    importHotelIcal: async (_parent, args, context) => {
        const authUser = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = hotel_schema_1.icalImportSchema.parse(args.input);
        if (parsed.icsContent) {
            return hotel_service_1.hotelService.importFromIcalContent(args.hotelId, authUser.userId, parsed.icsContent, parsed.reason);
        }
        if (parsed.sourceUrl) {
            const imported = await hotel_service_1.hotelService.addIcalSource(args.hotelId, authUser.userId, {
                name: "imported-source",
                url: parsed.sourceUrl,
                enabled: true,
            });
            return hotel_service_1.hotelService.syncIcalSource(args.hotelId, imported.id, authUser.userId);
        }
        throw new Error("Either icsContent or sourceUrl is required");
    },
    upsertHotelPricingRules: async (_parent, args, context) => {
        const authUser = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = hotel_schema_1.pricingRulesSchema.parse(args.input);
        return hotel_service_1.hotelService.upsertPricingRules(args.hotelId, authUser.userId, parsed);
    },
    createBooking: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = booking_schema_1.createBookingSchema.parse(args.input);
        return booking_service_1.bookingService.createBooking(auth.userId, {
            ...parsed,
            checkIn: (0, helpers_1.toDate)(parsed.checkIn),
            checkOut: (0, helpers_1.toDate)(parsed.checkOut),
        });
    },
    updateBooking: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = booking_schema_1.updateSchema.parse(args.input);
        return booking_service_1.bookingService.updateBooking(auth.userId, args.bookingId, {
            ...parsed,
            checkIn: parsed.checkIn ? (0, helpers_1.toDate)(parsed.checkIn) : undefined,
            checkOut: parsed.checkOut ? (0, helpers_1.toDate)(parsed.checkOut) : undefined,
        });
    },
    cancelBooking: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return booking_service_1.bookingService.cancelBooking(auth.userId, args.bookingId, args.reason);
    },
    confirmCheckIn: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return booking_service_1.bookingService.confirmCheckIn(auth.userId, args.bookingId);
    },
    confirmCheckOut: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return booking_service_1.bookingService.confirmCheckOut(auth.userId, args.bookingId);
    },
    hostAcceptBooking: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return booking_service_1.bookingService.hostAcceptBooking(auth.userId, args.bookingId);
    },
    hostDeclineBooking: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return booking_service_1.bookingService.hostDeclineBooking(auth.userId, args.bookingId, args.reason);
    },
    hostAlterBooking: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = booking_schema_1.hostAlterSchema.parse(args.input);
        return booking_service_1.bookingService.hostAlterBooking(auth.userId, args.bookingId, {
            ...parsed,
            checkIn: parsed.checkIn ? (0, helpers_1.toDate)(parsed.checkIn) : undefined,
            checkOut: parsed.checkOut ? (0, helpers_1.toDate)(parsed.checkOut) : undefined,
        });
    },
    hostMarkNoShow: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return booking_service_1.bookingService.hostMarkNoShow(auth.userId, args.bookingId, args.notes);
    },
    createRoom: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = room_schema_1.createRoomSchema.parse({
            ...(args.input || {}),
            capacity: args.input?.capacity ??
                args.input?.maxGuests,
        });
        return room_service_1.roomService.createRoom(args.hotelId, auth.userId, parsed);
    },
    updateRoom: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = room_schema_1.updateRoomSchema.parse({
            ...(args.input || {}),
            capacity: args.input?.capacity ??
                args.input?.maxGuests,
        });
        return room_service_1.roomService.updateRoom(args.roomId, auth.userId, parsed);
    },
    deleteRoom: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        await room_service_1.roomService.deleteRoom(args.roomId, auth.userId);
        return { deleted: true, message: "Room deleted successfully" };
    },
    roomPresignedUrl: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        const parsed = room_schema_1.presignedUrlQuerySchema.parse({ fileName: args.fileName });
        return room_service_1.roomService.getPresignedUrl(args.roomId, auth.userId, parsed.fileName);
    },
    deleteRoomImage: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["host", "admin"]);
        return room_service_1.roomService.deleteImage(args.roomId, auth.userId, args.imageKey);
    },
    createPaymentOrder: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = payments_schema_1.createPaymentSchema.parse(args.input);
        const result = await payment_service_1.paymentService.createOrder(auth.userId, parsed.bookingId);
        return {
            idempotent: Boolean(result.idempotent),
            order: result.order,
            payment: result.payment,
        };
    },
    verifyPayment: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = payments_schema_1.verifyPaymentSchema.parse(args.input);
        return payment_service_1.paymentService.verifyPayment(auth.userId, parsed);
    },
    reprocessStalePayments: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["admin"]);
        const parsed = payments_schema_1.reprocessStaleSchema.parse(args.input || {});
        return payment_service_1.paymentService.reprocessStalePayments(auth.userId, parsed);
    },
    upsertFxRate: async (_parent, args, context) => {
        const auth = (0, context_1.requireRole)(context, ["admin"]);
        const parsed = payments_schema_1.fxRateSchema.parse(args.input);
        return payment_service_1.paymentService.upsertFxRate(auth.userId, parsed);
    },
    sendMessage: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = messages_schema_1.sendMessageSchema.parse(args.input);
        const receiverUserId = parsed.receiverUserId || parsed.receiverId;
        return messages_service_1.messageService.sendMessage(auth.userId, receiverUserId, parsed.content, parsed.bookingId, parsed.attachmentUrl, parsed.attachmentType, parsed.escalateToSupport);
    },
    markMessageRead: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const result = await messages_service_1.messageService.markAsRead(auth.userId, args.messageId);
        return { count: result.count };
    },
    markNotificationRead: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const result = await notifications_service_1.notificationService.markRead(auth.userId, args.notificationId);
        return { count: result.count };
    },
    markAllNotificationsRead: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const result = await notifications_service_1.notificationService.markAllRead(auth.userId);
        return { count: result.count };
    },
    updateNotificationPreferences: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = notifications_schema_1.preferencesSchema.parse(args.input);
        return notifications_service_1.notificationService.updatePreferences(auth.userId, parsed);
    },
    deleteNotification: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        await notifications_service_1.notificationService.delete(auth.userId, args.notificationId);
        return { deleted: true, message: "Notification deleted" };
    },
};
