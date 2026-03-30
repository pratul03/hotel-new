import { Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { successResponse } from "../../../utils";
import { bookingService } from "../services/booking.service";
import { bookingQueries } from "../queries/booking.queries";
import {
  cancelSchema,
  createBookingSchema,
  hostAlterSchema,
  hostDeclineSchema,
  hostNoShowSchema,
  previewSchema,
  rebookingSchema,
  riskSchema,
  travelDisruptionSchema,
  updateSchema,
} from "../schemas/booking.schema";

export const bookingController = {
  async create(req: AuthenticatedRequest, res: Response) {
    const userId = req.userId as string;
    const payload = createBookingSchema.parse(req.body);

    const booking = await bookingService.createBooking(userId, {
      roomId: payload.roomId,
      checkIn: new Date(payload.checkIn),
      checkOut: new Date(payload.checkOut),
      guestCount: payload.guestCount,
      notes: payload.notes,
    });

    res.status(201).json(successResponse(booking, "Booking created"));
  },

  async getMine(req: AuthenticatedRequest, res: Response) {
    const bookings = await bookingService.getMyBookings(req.userId as string);
    res.json(successResponse(bookings, "Bookings retrieved"));
  },

  async getHost(req: AuthenticatedRequest, res: Response) {
    const bookings = await bookingService.getHostBookings(req.userId as string);
    res.json(successResponse(bookings, "Host bookings retrieved"));
  },

  async getPreview(req: AuthenticatedRequest, res: Response) {
    const payload = previewSchema.parse(req.query);
    const data = await bookingService.getBookingPricePreview({
      roomId: payload.roomId,
      checkIn: new Date(payload.checkIn),
      checkOut: new Date(payload.checkOut),
      guestCount: payload.guestCount,
    });

    res.json(successResponse(data, "Booking price preview retrieved"));
  },

  async getRiskPreview(req: AuthenticatedRequest, res: Response) {
    const payload = riskSchema.parse(req.query);
    const data = await bookingService.getReservationRisk(req.userId as string, {
      roomId: payload.roomId,
      checkIn: new Date(payload.checkIn),
      checkOut: new Date(payload.checkOut),
      guestCount: payload.guestCount,
    });

    res.json(successResponse(data, "Reservation risk preview retrieved"));
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    const bookingId = bookingQueries.id(req);
    const booking = await bookingService.getBookingById(
      req.userId as string,
      bookingId,
    );

    res.json(successResponse(booking, "Booking retrieved"));
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const bookingId = bookingQueries.id(req);
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
  },

  async cancel(req: AuthenticatedRequest, res: Response) {
    const { reason } = cancelSchema.parse(req.body);
    const bookingId = bookingQueries.id(req);
    const booking = await bookingService.cancelBooking(
      req.userId as string,
      bookingId,
      reason,
    );

    res.json(successResponse(booking, "Booking cancelled"));
  },

  async getCancellationPreview(req: AuthenticatedRequest, res: Response) {
    const bookingId = bookingQueries.id(req);
    const data = await bookingService.getCancellationPreview(
      req.userId as string,
      bookingId,
    );

    res.json(successResponse(data, "Cancellation preview retrieved"));
  },

  async getRebookingOptions(req: AuthenticatedRequest, res: Response) {
    const bookingId = bookingQueries.id(req);
    const payload = rebookingSchema.parse(req.body);
    const data = await bookingService.getRebookingOptions(
      req.userId as string,
      bookingId,
      payload.reason,
    );

    res.json(successResponse(data, "Rebooking options retrieved"));
  },

  async simulateTravelDisruption(req: AuthenticatedRequest, res: Response) {
    const bookingId = bookingQueries.id(req);
    const payload = travelDisruptionSchema.parse(req.body);
    const data = await bookingService.assessTravelDisruption(
      req.userId as string,
      bookingId,
      payload,
    );

    res.json(successResponse(data, "Travel disruption simulation generated"));
  },

  async confirmCheckIn(req: AuthenticatedRequest, res: Response) {
    const bookingId = bookingQueries.id(req);
    const booking = await bookingService.confirmCheckIn(
      req.userId as string,
      bookingId,
    );

    res.json(successResponse(booking, "Check-in confirmed"));
  },

  async confirmCheckOut(req: AuthenticatedRequest, res: Response) {
    const bookingId = bookingQueries.id(req);
    const booking = await bookingService.confirmCheckOut(
      req.userId as string,
      bookingId,
    );

    res.json(successResponse(booking, "Check-out confirmed"));
  },

  async hostAccept(req: AuthenticatedRequest, res: Response) {
    const bookingId = bookingQueries.id(req);
    const booking = await bookingService.hostAcceptBooking(
      req.userId as string,
      bookingId,
    );

    res.json(successResponse(booking, "Booking accepted by host"));
  },

  async hostDecline(req: AuthenticatedRequest, res: Response) {
    const bookingId = bookingQueries.id(req);
    const payload = hostDeclineSchema.parse(req.body);
    const booking = await bookingService.hostDeclineBooking(
      req.userId as string,
      bookingId,
      payload.reason,
    );

    res.json(successResponse(booking, "Booking declined by host"));
  },

  async hostAlter(req: AuthenticatedRequest, res: Response) {
    const bookingId = bookingQueries.id(req);
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
  },

  async hostNoShow(req: AuthenticatedRequest, res: Response) {
    const bookingId = bookingQueries.id(req);
    const payload = hostNoShowSchema.parse(req.body);
    const booking = await bookingService.hostMarkNoShow(
      req.userId as string,
      bookingId,
      payload.notes,
    );

    res.json(successResponse(booking, "Booking marked as no-show"));
  },
};

export default bookingController;
