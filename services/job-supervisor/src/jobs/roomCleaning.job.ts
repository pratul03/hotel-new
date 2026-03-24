/**
 * Job: Room Cleaning Status
 * Schedule: Every 30 minutes
 *
 * Finds bookings that checked out more than 2 hours ago and logs them
 * as needing cleaning. Publishes a system log event for monitoring.
 */

import { prisma } from "../config/database";
import { createJobResult } from "../types";

export const runRoomCleaningJob = async (): Promise<void> => {
  const startedAt = new Date();
  const tracker = createJobResult("RoomCleaning", startedAt);

  // Find bookings checked out 2+ hours ago
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const recentCheckouts = await prisma.booking.findMany({
    where: {
      status: "checked_out",
      updatedAt: { gte: twoHoursAgo, lte: new Date() },
    },
    include: {
      room: {
        include: {
          hotel: { select: { id: true, name: true, ownerId: true } },
        },
      },
    },
  });

  if (recentCheckouts.length) {
    console.log(
      `[RoomCleaning] ${recentCheckouts.length} room(s) may need cleaning — rooms:`,
      recentCheckouts
        .map((b) => `${b.room.hotel.name} (Room ${b.roomId})`)
        .join(", "),
    );
  }

  tracker.finalize(recentCheckouts.length);
};
