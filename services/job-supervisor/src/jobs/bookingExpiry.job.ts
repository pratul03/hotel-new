/**
 * Job: Booking Expiry
 * Schedule: Every 5 minutes
 *
 * Finds PENDING bookings whose expiresAt has passed, marks them EXPIRED,
 * creates a BookingHistory entry, and publishes a booking.expired event.
 */

import { prisma } from "../config/database";
import { getPublisher } from "../config/redis";
import { EVENT_CHANNEL, createJobResult } from "../types";

export const runBookingExpiryJob = async (): Promise<void> => {
  const startedAt = new Date();
  const tracker = createJobResult("BookingExpiry", startedAt);
  let processed = 0;
  const errors: string[] = [];

  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: "pending",
      expiresAt: { lte: new Date() },
    },
    include: {
      guest: { select: { id: true, name: true, email: true } },
      room: {
        include: {
          hotel: {
            select: { name: true, checkInTime: true, checkOutTime: true },
          },
        },
      },
    },
  });

  if (!expiredBookings.length) {
    tracker.finalize(0);
    return;
  }

  const publisher = await getPublisher();

  for (const booking of expiredBookings) {
    try {
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: booking.id },
          data: { status: "expired" },
        }),
        prisma.bookingHistory.create({
          data: {
            bookingId: booking.id,
            status: "expired",
            updatedBy: "system",
            notes: "Auto-expired: payment not completed within 10 minutes",
          },
        }),
      ]);

      const message = JSON.stringify({
        type: "booking.expired",
        data: {
          bookingId: booking.id,
          guest: booking.guest,
          hotel: { name: booking.room.hotel.name },
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
        },
        timestamp: new Date().toISOString(),
      });

      await publisher.publish(EVENT_CHANNEL, message);

      processed++;
    } catch (err: any) {
      errors.push(`Booking ${booking.id}: ${err.message}`);
      console.error(`[BookingExpiry] Failed for booking ${booking.id}:`, err);
    }
  }

  tracker.finalize(processed, errors.length, errors);
};
