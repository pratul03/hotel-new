import { authService } from "../../../../domains/auth/services/auth.service";
import {
  loginSchema,
  registerSchema,
} from "../../../../domains/auth/schemas/auth.schema";
import {
  createBookingSchema,
  hostAlterSchema,
  updateSchema,
} from "../../../../domains/booking/schemas/booking.schema";
import { bookingService } from "../../../../domains/booking/services/booking.service";
import {
  blockDatesSchema,
  calendarRulesSchema,
  createHotelSchema,
  hotelPromoteSchema,
  icalImportSchema,
  icalSourceSchema,
  pricingRulesSchema,
  updateHotelSchema,
} from "../../../../domains/hotel/schemas/hotel.schema";
import { hotelService } from "../../../../domains/hotel/services/hotel.service";
import { sendMessageSchema } from "../../../../domains/messages/schemas/messages.schema";
import { messageService } from "../../../../domains/messages/services/messages.service";
import { preferencesSchema } from "../../../../domains/notifications/schemas/notifications.schema";
import { notificationService } from "../../../../domains/notifications/services/notifications.service";
import {
  createPaymentSchema,
  fxRateSchema,
  reprocessStaleSchema,
  verifyPaymentSchema,
} from "../../../../domains/payments/schemas/payments.schema";
import { paymentService } from "../../../../domains/payments/services/payment.service";
import {
  createRoomSchema,
  presignedUrlQuerySchema,
  updateRoomSchema,
} from "../../../../domains/room/schemas/room.schema";
import { roomService } from "../../../../domains/room/services/room.service";
import { GraphQLContext, requireAuth, requireRole } from "../../../context";

import {
  CreateHotelArgs,
  HotelLike,
  normalizeHotel,
  toDate,
} from "../../helpers";
import { setAuthCookies } from "../../../../domains/auth/services/authCookies.service";

export const coreMutationResolvers = {
  register: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const payload = registerSchema.parse(args.input);
    const result = await authService.register(
      payload.email,
      payload.password,
      payload.name,
      payload.role,
    );

    setAuthCookies(context.res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    return {
      user: result.user,
      token: result.token,
    };
  },

  login: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const payload = loginSchema.parse(args.input);
    const result = await authService.login(payload.email, payload.password);

    setAuthCookies(context.res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    return {
      user: result.user,
      token: result.token,
    };
  },

  createHotel: async (
    _parent: unknown,
    args: CreateHotelArgs,
    context: GraphQLContext,
  ) => {
    const authUser = requireRole(context, ["host", "admin"]);
    const rawLocation = (args.input as Record<string, unknown>)?.location;
    const normalizedLocation =
      typeof rawLocation === "string" &&
      !/^-?\d+\.?\d*,-?\d+\.?\d*,.+$/.test(rawLocation)
        ? `0,0,${rawLocation}`
        : rawLocation;

    const payload = createHotelSchema.parse({
      ...((args.input as Record<string, unknown>) || {}),
      location: normalizedLocation,
      publicRules: Array.isArray(
        (args.input as Record<string, unknown>)?.publicRules,
      )
        ? ((args.input as Record<string, unknown>).publicRules as string[])
            .filter(Boolean)
            .join("\n")
        : (args.input as Record<string, unknown>)?.publicRules,
      amenities: Array.isArray(
        (args.input as Record<string, unknown>)?.amenities,
      )
        ? (args.input as Record<string, unknown>).amenities
        : undefined,
    });
    const hotel = await hotelService.createHotel(authUser.userId, payload);
    return normalizeHotel(hotel as HotelLike);
  },

  updateHotel: async (
    _parent: unknown,
    args: { hotelId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const authUser = requireRole(context, ["host", "admin"]);
    const rawLocation = (args.input as Record<string, unknown>)?.location;
    const normalizedLocation =
      typeof rawLocation === "string" &&
      !/^-?\d+\.?\d*,-?\d+\.?\d*,.+$/.test(rawLocation)
        ? `0,0,${rawLocation}`
        : rawLocation;

    const parsed = updateHotelSchema.parse({
      ...((args.input as Record<string, unknown>) || {}),
      location: normalizedLocation,
      publicRules: Array.isArray(
        (args.input as Record<string, unknown>)?.publicRules,
      )
        ? ((args.input as Record<string, unknown>).publicRules as string[])
            .filter(Boolean)
            .join("\n")
        : (args.input as Record<string, unknown>)?.publicRules,
    });
    const hotel = await hotelService.updateHotel(
      args.hotelId,
      authUser.userId,
      parsed,
    );
    return normalizeHotel(hotel as HotelLike);
  },

  deleteHotel: async (
    _parent: unknown,
    args: { hotelId: string },
    context: GraphQLContext,
  ) => {
    const authUser = requireRole(context, ["host", "admin"]);
    await hotelService.deleteHotel(args.hotelId, authUser.userId);
    return { deleted: true, message: "Hotel deleted successfully" };
  },

  promoteHotel: async (
    _parent: unknown,
    args: { hotelId: string; durationDays?: number },
    context: GraphQLContext,
  ) => {
    const authUser = requireRole(context, ["host", "admin"]);
    const parsed = hotelPromoteSchema.parse({
      durationDays: args.durationDays,
    });
    return hotelService.promoteHotel(
      args.hotelId,
      authUser.userId,
      parsed.durationDays ?? 30,
    );
  },

  unpromoteHotel: async (
    _parent: unknown,
    args: { hotelId: string },
    context: GraphQLContext,
  ) => {
    const authUser = requireRole(context, ["host", "admin"]);
    return hotelService.unpromotedHotel(args.hotelId, authUser.userId);
  },

  blockHotelDates: async (
    _parent: unknown,
    args: { hotelId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const authUser = requireRole(context, ["host", "admin"]);
    const parsed = blockDatesSchema.parse(args.input);
    return hotelService.blockDates(args.hotelId, authUser.userId, {
      startDate: toDate(parsed.startDate),
      endDate: toDate(parsed.endDate),
      reason: parsed.reason,
    });
  },

  upsertHotelCalendarRules: async (
    _parent: unknown,
    args: { hotelId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const authUser = requireRole(context, ["host", "admin"]);
    const parsed = calendarRulesSchema.parse(args.input);
    return hotelService.upsertCalendarRules(
      args.hotelId,
      authUser.userId,
      parsed,
    );
  },

  createHotelIcalSource: async (
    _parent: unknown,
    args: { hotelId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const authUser = requireRole(context, ["host", "admin"]);
    const parsed = icalSourceSchema.parse(args.input);
    return hotelService.addIcalSource(args.hotelId, authUser.userId, {
      name: parsed.name,
      url: parsed.url as string,
      enabled: parsed.enabled,
    });
  },

  deleteHotelIcalSource: async (
    _parent: unknown,
    args: { hotelId: string; sourceId: string },
    context: GraphQLContext,
  ) => {
    const authUser = requireRole(context, ["host", "admin"]);
    await hotelService.deleteIcalSource(
      args.hotelId,
      args.sourceId,
      authUser.userId,
    );
    return { deleted: true, message: "iCal source deleted" };
  },

  syncHotelIcalSource: async (
    _parent: unknown,
    args: { hotelId: string; sourceId: string },
    context: GraphQLContext,
  ) => {
    const authUser = requireRole(context, ["host", "admin"]);
    return hotelService.syncIcalSource(
      args.hotelId,
      args.sourceId,
      authUser.userId,
    );
  },

  importHotelIcal: async (
    _parent: unknown,
    args: { hotelId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const authUser = requireRole(context, ["host", "admin"]);
    const parsed = icalImportSchema.parse(args.input);

    if (parsed.icsContent) {
      return hotelService.importFromIcalContent(
        args.hotelId,
        authUser.userId,
        parsed.icsContent,
        parsed.reason,
      );
    }

    if (parsed.sourceUrl) {
      const imported = await hotelService.addIcalSource(
        args.hotelId,
        authUser.userId,
        {
          name: "imported-source",
          url: parsed.sourceUrl,
          enabled: true,
        },
      );
      return hotelService.syncIcalSource(
        args.hotelId,
        imported.id,
        authUser.userId,
      );
    }

    throw new Error("Either icsContent or sourceUrl is required");
  },

  upsertHotelPricingRules: async (
    _parent: unknown,
    args: { hotelId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const authUser = requireRole(context, ["host", "admin"]);
    const parsed = pricingRulesSchema.parse(args.input);
    return hotelService.upsertPricingRules(
      args.hotelId,
      authUser.userId,
      parsed,
    );
  },

  createBooking: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = createBookingSchema.parse(args.input);
    return bookingService.createBooking(auth.userId, {
      ...parsed,
      checkIn: toDate(parsed.checkIn),
      checkOut: toDate(parsed.checkOut),
    });
  },

  updateBooking: async (
    _parent: unknown,
    args: { bookingId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = updateSchema.parse(args.input);
    return bookingService.updateBooking(auth.userId, args.bookingId, {
      ...parsed,
      checkIn: parsed.checkIn ? toDate(parsed.checkIn) : undefined,
      checkOut: parsed.checkOut ? toDate(parsed.checkOut) : undefined,
    });
  },

  cancelBooking: async (
    _parent: unknown,
    args: { bookingId: string; reason?: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return bookingService.cancelBooking(
      auth.userId,
      args.bookingId,
      args.reason,
    );
  },

  confirmCheckIn: async (
    _parent: unknown,
    args: { bookingId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return bookingService.confirmCheckIn(auth.userId, args.bookingId);
  },

  confirmCheckOut: async (
    _parent: unknown,
    args: { bookingId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return bookingService.confirmCheckOut(auth.userId, args.bookingId);
  },

  hostAcceptBooking: async (
    _parent: unknown,
    args: { bookingId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return bookingService.hostAcceptBooking(auth.userId, args.bookingId);
  },

  hostDeclineBooking: async (
    _parent: unknown,
    args: { bookingId: string; reason?: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return bookingService.hostDeclineBooking(
      auth.userId,
      args.bookingId,
      args.reason,
    );
  },

  hostAlterBooking: async (
    _parent: unknown,
    args: { bookingId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = hostAlterSchema.parse(args.input);
    return bookingService.hostAlterBooking(auth.userId, args.bookingId, {
      ...parsed,
      checkIn: parsed.checkIn ? toDate(parsed.checkIn) : undefined,
      checkOut: parsed.checkOut ? toDate(parsed.checkOut) : undefined,
    });
  },

  hostMarkNoShow: async (
    _parent: unknown,
    args: { bookingId: string; notes?: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return bookingService.hostMarkNoShow(
      auth.userId,
      args.bookingId,
      args.notes,
    );
  },

  createRoom: async (
    _parent: unknown,
    args: { hotelId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = createRoomSchema.parse({
      ...((args.input as Record<string, unknown>) || {}),
      capacity:
        (args.input as Record<string, unknown>)?.capacity ??
        (args.input as Record<string, unknown>)?.maxGuests,
    });
    return roomService.createRoom(args.hotelId, auth.userId, parsed);
  },

  updateRoom: async (
    _parent: unknown,
    args: { roomId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = updateRoomSchema.parse({
      ...((args.input as Record<string, unknown>) || {}),
      capacity:
        (args.input as Record<string, unknown>)?.capacity ??
        (args.input as Record<string, unknown>)?.maxGuests,
    });
    return roomService.updateRoom(args.roomId, auth.userId, parsed);
  },

  deleteRoom: async (
    _parent: unknown,
    args: { roomId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    await roomService.deleteRoom(args.roomId, auth.userId);
    return { deleted: true, message: "Room deleted successfully" };
  },

  roomPresignedUrl: async (
    _parent: unknown,
    args: { roomId: string; fileName: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const parsed = presignedUrlQuerySchema.parse({ fileName: args.fileName });
    return roomService.getPresignedUrl(
      args.roomId,
      auth.userId,
      parsed.fileName,
    );
  },

  deleteRoomImage: async (
    _parent: unknown,
    args: { roomId: string; imageKey: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return roomService.deleteImage(args.roomId, auth.userId, args.imageKey);
  },

  createPaymentOrder: async (
    _parent: unknown,
    args: { input: { bookingId: string } },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = createPaymentSchema.parse(args.input);
    const result = await paymentService.createOrder(
      auth.userId,
      parsed.bookingId,
    );
    return {
      idempotent: Boolean((result as Record<string, unknown>).idempotent),
      order: (result as Record<string, unknown>).order,
      payment: (result as Record<string, unknown>).payment,
    };
  },

  verifyPayment: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = verifyPaymentSchema.parse(args.input);
    return paymentService.verifyPayment(auth.userId, parsed);
  },

  reprocessStalePayments: async (
    _parent: unknown,
    args: { input?: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["admin"]);
    const parsed = reprocessStaleSchema.parse(args.input || {});
    return paymentService.reprocessStalePayments(auth.userId, parsed);
  },

  upsertFxRate: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["admin"]);
    const parsed = fxRateSchema.parse(args.input);
    return paymentService.upsertFxRate(auth.userId, parsed);
  },

  sendMessage: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = sendMessageSchema.parse(args.input);
    const receiverUserId = parsed.receiverUserId || parsed.receiverId;
    return messageService.sendMessage(
      auth.userId,
      receiverUserId as string,
      parsed.content,
      parsed.bookingId,
      parsed.attachmentUrl,
      parsed.attachmentType,
      parsed.escalateToSupport,
    );
  },

  markMessageRead: async (
    _parent: unknown,
    args: { messageId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const result = await messageService.markAsRead(auth.userId, args.messageId);
    return { count: result.count };
  },

  markNotificationRead: async (
    _parent: unknown,
    args: { notificationId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const result = await notificationService.markRead(
      auth.userId,
      args.notificationId,
    );
    return { count: result.count };
  },

  markAllNotificationsRead: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const result = await notificationService.markAllRead(auth.userId);
    return { count: result.count };
  },

  updateNotificationPreferences: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = preferencesSchema.parse(args.input);
    return notificationService.updatePreferences(auth.userId, parsed);
  },

  deleteNotification: async (
    _parent: unknown,
    args: { notificationId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    await notificationService.delete(auth.userId, args.notificationId);
    return { deleted: true, message: "Notification deleted" };
  },
};
