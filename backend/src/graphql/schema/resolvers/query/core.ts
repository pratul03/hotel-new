import { authService } from "../../../../domains/auth/services/auth.service";
import {
  previewSchema,
  riskSchema,
  rebookingSchema,
} from "../../../../domains/booking/schemas/booking.schema";
import { bookingService } from "../../../../domains/booking/services/booking.service";
import { searchHotelsSchema } from "../../../../domains/hotel/schemas/hotel.schema";
import { hotelService } from "../../../../domains/hotel/services/hotel.service";
import { messageService } from "../../../../domains/messages/services/messages.service";
import { notificationService } from "../../../../domains/notifications/services/notifications.service";
import { paymentService } from "../../../../domains/payments/services/payment.service";
import { roomService } from "../../../../domains/room/services/room.service";
import { roomDateRangeQuerySchema } from "../../../../domains/room/schemas/room.schema";
import { GraphQLContext, requireAuth, requireRole } from "../../../context";

import {
  SearchHotelsArgs,
  CreateBookingArgs,
  RoomDateRangeArgs,
  HotelLike,
  normalizeHotel,
  toDate,
} from "../../helpers";

export const coreQueryResolvers = {
  me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    const authUser = requireAuth(context);
    return authService.getCurrentUser(authUser.userId);
  },

  hotelById: async (_parent: unknown, args: { id: string }) => {
    const hotel = await hotelService.getHotelById(args.id);
    return normalizeHotel(hotel as HotelLike);
  },

  searchHotels: async (
    _parent: unknown,
    args: SearchHotelsArgs,
    context: GraphQLContext,
  ) => {
    const payload = searchHotelsSchema.parse(args.input);
    const result = await hotelService.searchHotels({
      ...payload,
      checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined,
      checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined,
      userId: context.authUser?.userId,
    });

    return {
      data: result.data.map((hotel) => normalizeHotel(hotel as HotelLike)),
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      pages: result.pagination.pages,
    };
  },

  myBookings: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return bookingService.getMyBookings(auth.userId);
  },

  hostBookings: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return bookingService.getHostBookings(auth.userId);
  },

  bookingById: async (
    _parent: unknown,
    args: { bookingId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return bookingService.getBookingById(auth.userId, args.bookingId);
  },

  bookingCancellationPreview: async (
    _parent: unknown,
    args: { bookingId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return bookingService.getCancellationPreview(auth.userId, args.bookingId);
  },

  bookingPricePreview: async (_parent: unknown, args: CreateBookingArgs) => {
    const parsed = previewSchema.parse(args.input);
    return bookingService.getBookingPricePreview({
      ...parsed,
      checkIn: toDate(parsed.checkIn),
      checkOut: toDate(parsed.checkOut),
    });
  },

  reservationRisk: async (
    _parent: unknown,
    args: CreateBookingArgs,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = riskSchema.parse(args.input);
    return bookingService.getReservationRisk(auth.userId, {
      ...parsed,
      checkIn: toDate(parsed.checkIn),
      checkOut: toDate(parsed.checkOut),
    });
  },

  rebookingOptions: async (
    _parent: unknown,
    args: { bookingId: string; reason: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = rebookingSchema.parse({ reason: args.reason });
    return bookingService.getRebookingOptions(
      auth.userId,
      args.bookingId,
      parsed.reason,
    );
  },

  roomById: async (_parent: unknown, args: { roomId: string }) => {
    return roomService.getRoomById(args.roomId);
  },

  myHotels: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    const hotels = await hotelService.getMyHotels(auth.userId);
    return hotels.map((hotel) => normalizeHotel(hotel as HotelLike));
  },

  promotedHotels: async (_parent: unknown, args: { limit?: number }) => {
    const limit =
      typeof args.limit === "number" && args.limit > 0
        ? Math.min(args.limit, 50)
        : 8;
    const hotels = await hotelService.getPromotedHotels(limit);
    return hotels.map((hotel) => normalizeHotel(hotel as HotelLike));
  },

  hotelBlockedDates: async (
    _parent: unknown,
    args: { hotelId: string },
    context: GraphQLContext,
  ) => {
    requireRole(context, ["host", "admin"]);
    return hotelService.getBlockedDates(args.hotelId);
  },

  hotelCalendarRules: async (
    _parent: unknown,
    args: { hotelId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return hotelService.getCalendarRules(args.hotelId, auth.userId);
  },

  hotelIcalSources: async (
    _parent: unknown,
    args: { hotelId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return hotelService.getIcalSources(args.hotelId, auth.userId);
  },

  hotelPricingRules: async (
    _parent: unknown,
    args: { hotelId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["host", "admin"]);
    return hotelService.getPricingRules(args.hotelId, auth.userId);
  },

  roomAvailability: async (_parent: unknown, args: RoomDateRangeArgs) => {
    const parsed = roomDateRangeQuerySchema.parse(args.input);
    return roomService.checkAvailability(
      args.roomId,
      toDate(parsed.checkIn),
      toDate(parsed.checkOut),
    );
  },

  roomPricing: async (_parent: unknown, args: RoomDateRangeArgs) => {
    const parsed = roomDateRangeQuerySchema.parse(args.input);
    return roomService.getPricing(args.roomId, {
      checkIn: toDate(parsed.checkIn),
      checkOut: toDate(parsed.checkOut),
    });
  },

  paymentById: async (_parent: unknown, args: { paymentId: string }) => {
    return paymentService.getById(args.paymentId);
  },

  paymentByBooking: async (
    _parent: unknown,
    args: { bookingId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return paymentService.getByBooking(auth.userId, args.bookingId);
  },

  paymentQueueSummary: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    requireRole(context, ["admin"]);
    return paymentService.getPaymentQueueSummary();
  },

  fxRates: async () => paymentService.listFxRates(),

  messageThread: async (
    _parent: unknown,
    args: { otherUserId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return messageService.getThread(auth.userId, args.otherUserId);
  },

  conversations: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return messageService.getConversations(auth.userId);
  },

  unreadMessagesCount: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return messageService.getUnreadCount(auth.userId);
  },

  notifications: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return notificationService.list(auth.userId);
  },

  unreadNotificationsCount: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return notificationService.unreadCount(auth.userId);
  },

  notificationPreferences: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return notificationService.getPreferences(auth.userId);
  },
};
