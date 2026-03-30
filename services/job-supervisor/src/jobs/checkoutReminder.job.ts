/**
 * Job: Check-in & Check-out Reminders
 * Schedule: Every hour
 *
 * Publishes reminders for:
 *   - Confirmed bookings checking in tomorrow (checkin.reminder)
 *   - Checked-in bookings checking out tomorrow (checkout.reminder)
 */

import { prisma } from "../config/database";
import { getPublisher } from "../config/redis";
import { EVENT_CHANNEL, createJobResult } from "../types";

const startOfTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const runCheckoutReminderJob = async (): Promise<void> => {
  const startedAt = new Date();
  const tracker = createJobResult("CheckoutReminder", startedAt);
  const tomorrow = { gte: startOfTomorrow(), lte: endOfTomorrow() };
  let processed = 0;
  const errors: string[] = [];

  const publisher = await getPublisher();

  // Check-in reminders: confirmed bookings whose checkIn is tomorrow
  const checkingInTomorrow = await prisma.booking.findMany({
    where: { status: "confirmed", checkIn: tomorrow },
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

  for (const booking of checkingInTomorrow) {
    try {
      const checkInMessage = JSON.stringify({
        type: "checkin.reminder",
        data: {
          bookingId: booking.id,
          guest: booking.guest,
          hotel: {
            name: booking.room.hotel.name,
            checkInTime: booking.room.hotel.checkInTime,
          },
          checkIn: booking.checkIn,
        },
        timestamp: new Date().toISOString(),
      });

      await publisher.publish(EVENT_CHANNEL, checkInMessage);
      processed++;
    } catch (err: any) {
      errors.push(`CheckIn reminder for booking ${booking.id}: ${err.message}`);
    }
  }

  // Check-out reminders: checked-in bookings whose checkOut is tomorrow
  const checkingOutTomorrow = await prisma.booking.findMany({
    where: { status: "checked_in", checkOut: tomorrow },
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

  for (const booking of checkingOutTomorrow) {
    try {
      const checkOutMessage = JSON.stringify({
        type: "checkout.reminder",
        data: {
          bookingId: booking.id,
          guest: booking.guest,
          hotel: {
            name: booking.room.hotel.name,
            checkOutTime: booking.room.hotel.checkOutTime,
          },
          checkOut: booking.checkOut,
        },
        timestamp: new Date().toISOString(),
      });

      await publisher.publish(EVENT_CHANNEL, checkOutMessage);
      processed++;
    } catch (err: any) {
      errors.push(
        `CheckOut reminder for booking ${booking.id}: ${err.message}`,
      );
    }
  }

  tracker.finalize(processed, errors.length, errors);
};
