import { Router, Response } from "express";
import { z } from "zod";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "../../../middleware/authMiddleware";
import { bookingService } from "../services/booking.service";
import { catchAsync, successResponse } from "../../../utils";

const router = Router();

const createBookingSchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guestCount: z.number().int().positive(),
  notes: z.string().optional(),
});

const previewSchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guestCount: z.coerce.number().int().positive().default(1),
});

const riskSchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guestCount: z.coerce.number().int().positive().default(1),
});

const cancelSchema = z.object({
  reason: z.string().optional(),
});

const updateSchema = z.object({
  guestCount: z.number().int().positive().optional(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const hostDeclineSchema = z.object({
  reason: z.string().optional(),
});

const hostAlterSchema = z.object({
  guestCount: z.number().int().positive().optional(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const hostNoShowSchema = z.object({
  notes: z.string().optional(),
});

const rebookingSchema = z.object({
  reason: z.string().min(3),
});

const travelDisruptionSchema = z.object({
  eventType: z.enum([
    "weather",
    "transport_strike",
    "airport_closure",
    "medical",
    "government_restriction",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";

router.post(
  "/",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as string;
    const data = createBookingSchema.parse(req.body);

    const booking = await bookingService.createBooking(userId, {
      roomId: data.roomId,
      checkIn: new Date(data.checkIn),
      checkOut: new Date(data.checkOut),
      guestCount: data.guestCount,
      notes: data.notes,
    });

    res.status(201).json(successResponse(booking, "Booking created"));
  }),
);

router.get(
  "/me",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookings = await bookingService.getMyBookings(req.userId as string);
    res.json(successResponse(bookings, "Bookings retrieved"));
  }),
);

router.get(
  "/host",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookings = await bookingService.getHostBookings(req.userId as string);
    res.json(successResponse(bookings, "Host bookings retrieved"));
  }),
);

router.get(
  "/preview",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = previewSchema.parse(req.query);
    const data = await bookingService.getBookingPricePreview({
      roomId: payload.roomId,
      checkIn: new Date(payload.checkIn),
      checkOut: new Date(payload.checkOut),
      guestCount: payload.guestCount,
    });
    res.json(successResponse(data, "Booking price preview retrieved"));
  }),
);

router.get(
  "/risk-preview",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = riskSchema.parse(req.query);
    const data = await bookingService.getReservationRisk(req.userId as string, {
      roomId: payload.roomId,
      checkIn: new Date(payload.checkIn),
      checkOut: new Date(payload.checkOut),
      guestCount: payload.guestCount,
    });
    res.json(successResponse(data, "Reservation risk preview retrieved"));
  }),
);

router.get(
  "/:id",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getParam(req.params.id as string | string[] | undefined);
    const booking = await bookingService.getBookingById(
      req.userId as string,
      bookingId,
    );
    res.json(successResponse(booking, "Booking retrieved"));
  }),
);

router.patch(
  "/:id/update",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getParam(req.params.id as string | string[] | undefined);
    const payload = updateSchema.parse(req.body);

    const booking = await bookingService.updateBooking(
      req.userId as string,
      bookingId,
      {
        guestCount: payload.guestCount,
        checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined,
        checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined,
        notes: payload.notes,
      },
    );

    res.json(successResponse(booking, "Booking updated"));
  }),
);

router.patch(
  "/:id/cancel",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { reason } = cancelSchema.parse(req.body);
    const bookingId = getParam(req.params.id as string | string[] | undefined);
    const booking = await bookingService.cancelBooking(
      req.userId as string,
      bookingId,
      reason,
    );
    res.json(successResponse(booking, "Booking cancelled"));
  }),
);

router.get(
  "/:id/cancellation-preview",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getParam(req.params.id as string | string[] | undefined);
    const data = await bookingService.getCancellationPreview(
      req.userId as string,
      bookingId,
    );
    res.json(successResponse(data, "Cancellation preview retrieved"));
  }),
);

router.post(
  "/:id/rebooking-options",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getParam(req.params.id as string | string[] | undefined);
    const payload = rebookingSchema.parse(req.body);
    const data = await bookingService.getRebookingOptions(
      req.userId as string,
      bookingId,
      payload.reason,
    );
    res.json(successResponse(data, "Rebooking options retrieved"));
  }),
);

router.post(
  "/:id/travel-disruption-simulate",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getParam(req.params.id as string | string[] | undefined);
    const payload = travelDisruptionSchema.parse(req.body);
    const data = await bookingService.assessTravelDisruption(
      req.userId as string,
      bookingId,
      payload,
    );
    res.json(successResponse(data, "Travel disruption simulation generated"));
  }),
);

router.post(
  "/:id/confirm-checkin",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getParam(req.params.id as string | string[] | undefined);
    const booking = await bookingService.confirmCheckIn(
      req.userId as string,
      bookingId,
    );
    res.json(successResponse(booking, "Check-in confirmed"));
  }),
);

router.post(
  "/:id/confirm-checkout",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getParam(req.params.id as string | string[] | undefined);
    const booking = await bookingService.confirmCheckOut(
      req.userId as string,
      bookingId,
    );
    res.json(successResponse(booking, "Check-out confirmed"));
  }),
);

router.post(
  "/:id/host/accept",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getParam(req.params.id as string | string[] | undefined);
    const booking = await bookingService.hostAcceptBooking(
      req.userId as string,
      bookingId,
    );
    res.json(successResponse(booking, "Booking accepted by host"));
  }),
);

router.post(
  "/:id/host/decline",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getParam(req.params.id as string | string[] | undefined);
    const payload = hostDeclineSchema.parse(req.body);
    const booking = await bookingService.hostDeclineBooking(
      req.userId as string,
      bookingId,
      payload.reason,
    );
    res.json(successResponse(booking, "Booking declined by host"));
  }),
);

router.patch(
  "/:id/host/alter",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getParam(req.params.id as string | string[] | undefined);
    const payload = hostAlterSchema.parse(req.body);
    const booking = await bookingService.hostAlterBooking(
      req.userId as string,
      bookingId,
      {
        guestCount: payload.guestCount,
        checkIn: payload.checkIn ? new Date(payload.checkIn) : undefined,
        checkOut: payload.checkOut ? new Date(payload.checkOut) : undefined,
        notes: payload.notes,
      },
    );
    res.json(successResponse(booking, "Booking altered by host"));
  }),
);

router.post(
  "/:id/host/no-show",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = getParam(req.params.id as string | string[] | undefined);
    const payload = hostNoShowSchema.parse(req.body);
    const booking = await bookingService.hostMarkNoShow(
      req.userId as string,
      bookingId,
      payload.notes,
    );
    res.json(successResponse(booking, "Booking marked as no-show"));
  }),
);

export default router;

