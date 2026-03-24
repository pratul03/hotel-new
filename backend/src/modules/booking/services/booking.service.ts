import { prisma } from "../../../config/database";
import { getRedisClient } from "../../../config/redis";
import { AppError } from "../../../utils";
import { publishEvent } from "../../../utils/eventPublisher";

const LOCK_TTL_SECONDS = 5;
const PENDING_EXPIRES_MINUTES = 10;

type CreateBookingInput = {
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
  notes?: string;
};

type BookingPricePreviewInput = {
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
};

type ReservationRiskInput = {
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
};

const getLockKey = (roomId: string, checkIn: Date, checkOut: Date) =>
  `booking:room:${roomId}:${checkIn.toISOString()}:${checkOut.toISOString()}`;

const calcNights = (checkIn: Date, checkOut: Date) =>
  Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

const computeBookingPricing = ({
  nightlyBasePrice,
  nights,
  serviceFeePercent,
  taxPercent,
}: {
  nightlyBasePrice: number;
  nights: number;
  serviceFeePercent: number;
  taxPercent: number;
}) => {
  const subtotal = nightlyBasePrice * nights;
  const serviceFeeCapPercent = 30;
  const serviceFee = Math.min(
    subtotal * (serviceFeePercent / 100),
    subtotal * (serviceFeeCapPercent / 100),
  );
  const tax = (subtotal + serviceFee) * (taxPercent / 100);
  const total = subtotal + serviceFee + tax;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    serviceFee: Number(serviceFee.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};

export const bookingService = {
  async createBooking(userId: string, payload: CreateBookingInput) {
    if (payload.checkIn >= payload.checkOut) {
      throw new AppError("Check-out must be after check-in", 400);
    }

    const room = await prisma.room.findUnique({
      where: { id: payload.roomId },
      include: { hotel: true },
    });

    if (!room) {
      throw new AppError("Room not found", 404);
    }

    if (payload.guestCount > room.maxGuests) {
      throw new AppError(
        `Guest count exceeds room max limit (${room.maxGuests})`,
        400,
      );
    }

    const redis = await getRedisClient();
    const lockKey = getLockKey(
      payload.roomId,
      payload.checkIn,
      payload.checkOut,
    );
    const lockValue = `${userId}:${Date.now()}`;

    const acquired = await redis.set(lockKey, lockValue, {
      NX: true,
      EX: LOCK_TTL_SECONDS,
    });

    if (!acquired) {
      throw new AppError(
        "Room is being booked. Please try again in a moment.",
        409,
      );
    }

    try {
      const conflictingBlocked = await prisma.blockedDates.findFirst({
        where: {
          roomId: payload.roomId,
          startDate: { lte: payload.checkOut },
          endDate: { gte: payload.checkIn },
        },
      });

      if (conflictingBlocked) {
        throw new AppError("Room is blocked for selected dates", 409);
      }

      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          roomId: payload.roomId,
          checkIn: { lte: payload.checkOut },
          checkOut: { gte: payload.checkIn },
          status: { in: ["pending", "confirmed", "checked_in"] },
        },
      });

      if (conflictingBooking) {
        throw new AppError("Room is already booked for selected dates", 409);
      }

      const nights = calcNights(payload.checkIn, payload.checkOut);
      const feeConfig = await prisma.serviceFeeConfig.findFirst({
        orderBy: { createdAt: "desc" },
      });
      const taxConfig = await prisma.taxConfiguration.findFirst({
        where: { region: "default" },
      });
      const serviceFeePercent = feeConfig?.percentage ?? 13;
      const taxPercent = taxConfig?.taxPercentage ?? 5;
      const pricing = computeBookingPricing({
        nightlyBasePrice: room.basePrice,
        nights,
        serviceFeePercent,
        taxPercent,
      });
      const amount = pricing.total;

      const expiresAt = new Date(
        Date.now() + PENDING_EXPIRES_MINUTES * 60 * 1000,
      );

      const booking = await prisma.$transaction(async (tx: any) => {
        const created = await tx.booking.create({
          data: {
            userId,
            roomId: payload.roomId,
            checkIn: payload.checkIn,
            checkOut: payload.checkOut,
            guestCount: payload.guestCount,
            notes: payload.notes,
            amount,
            status: "pending",
            expiresAt,
          },
        });

        await tx.bookingHistory.create({
          data: {
            bookingId: created.id,
            status: "pending",
            updatedBy: userId,
            notes: "Booking created",
          },
        });

        return created;
      });

      // Fire-and-forget: publish booking.created event before releasing lock
      prisma.booking
        .findUnique({
          where: { id: booking.id },
          include: {
            guest: { select: { id: true, name: true, email: true } },
            room: {
              include: {
                hotel: {
                  include: {
                    owner: { select: { id: true, name: true, email: true } },
                  },
                },
              },
            },
          },
        })
        .then((full) => {
          if (!full) return;
          publishEvent("booking.created", {
            bookingId: full.id,
            guest: full.guest,
            host: full.room.hotel.owner,
            room: { type: full.room.roomType },
            hotel: { name: full.room.hotel.name },
            checkIn: full.checkIn,
            checkOut: full.checkOut,
            amount: full.amount,
            guestCount: full.guestCount,
          });
        })
        .catch(() => {});

      return booking;
    } finally {
      await redis.del(lockKey);
    }
  },

  async getBookingPricePreview(payload: BookingPricePreviewInput) {
    if (payload.checkIn >= payload.checkOut) {
      throw new AppError("Check-out must be after check-in", 400);
    }

    const room = await prisma.room.findUnique({
      where: { id: payload.roomId },
      include: {
        hotel: {
          include: {
            cancellationPolicy: true,
          },
        },
      },
    });

    if (!room) {
      throw new AppError("Room not found", 404);
    }

    if (payload.guestCount > room.maxGuests) {
      throw new AppError(
        `Guest count exceeds room max limit (${room.maxGuests})`,
        400,
      );
    }

    const nights = calcNights(payload.checkIn, payload.checkOut);
    const [feeConfig, taxConfig] = await Promise.all([
      prisma.serviceFeeConfig.findFirst({ orderBy: { createdAt: "desc" } }),
      prisma.taxConfiguration.findFirst({ where: { region: "default" } }),
    ]);

    const serviceFeePercent = feeConfig?.percentage ?? 13;
    const taxPercent = taxConfig?.taxPercentage ?? 5;
    const pricing = computeBookingPricing({
      nightlyBasePrice: room.basePrice,
      nights,
      serviceFeePercent,
      taxPercent,
    });

    return {
      roomId: room.id,
      hotelId: room.hotelId,
      nights,
      guestCount: payload.guestCount,
      nightlyBasePrice: Number(room.basePrice.toFixed(2)),
      pricing,
      cancellationPolicy: room.hotel.cancellationPolicy
        ? {
            policyType: room.hotel.cancellationPolicy.policyType,
            freeCancellationHours:
              room.hotel.cancellationPolicy.freeCancellationHours,
            partialRefundPercent:
              room.hotel.cancellationPolicy.partialRefundPercent,
          }
        : null,
    };
  },

  async getReservationRisk(userId: string, payload: ReservationRiskInput) {
    if (payload.checkIn >= payload.checkOut) {
      throw new AppError("Check-out must be after check-in", 400);
    }

    const [user, room, cancelledBookings] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.room.findUnique({ where: { id: payload.roomId } }),
      prisma.booking.count({
        where: {
          userId,
          status: "cancelled",
        },
      }),
    ]);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!room) {
      throw new AppError("Room not found", 404);
    }

    if (payload.guestCount > room.maxGuests) {
      throw new AppError(
        `Guest count exceeds room max limit (${room.maxGuests})`,
        400,
      );
    }

    const now = new Date();
    const accountAgeDays = Math.max(
      0,
      Math.floor((now.getTime() - user.createdAt.getTime()) / (24 * 3600000)),
    );
    const leadTimeDays = Math.max(
      0,
      Math.floor((payload.checkIn.getTime() - now.getTime()) / (24 * 3600000)),
    );

    const [feeConfig, taxConfig] = await Promise.all([
      prisma.serviceFeeConfig.findFirst({ orderBy: { createdAt: "desc" } }),
      prisma.taxConfiguration.findFirst({ where: { region: "default" } }),
    ]);
    const pricing = computeBookingPricing({
      nightlyBasePrice: room.basePrice,
      nights: calcNights(payload.checkIn, payload.checkOut),
      serviceFeePercent: feeConfig?.percentage ?? 13,
      taxPercent: taxConfig?.taxPercentage ?? 5,
    });

    const factors = {
      unverifiedUser: user.verified ? 0 : 25,
      highCancellationHistory:
        cancelledBookings >= 3 ? 25 : cancelledBookings * 7,
      veryShortLeadTime: leadTimeDays < 2 ? 20 : leadTimeDays < 5 ? 10 : 0,
      highGuestToCapacityRatio:
        payload.guestCount / Math.max(1, room.maxGuests) > 0.9 ? 10 : 0,
      highOrderValue:
        pricing.total > 50000 ? 15 : pricing.total > 25000 ? 8 : 0,
      trustedAccountAge:
        accountAgeDays >= 365 ? -15 : accountAgeDays >= 90 ? -7 : 0,
    };

    const rawScore = Object.values(factors).reduce(
      (sum, value) => sum + value,
      0,
    );
    const riskScore = Math.min(100, Math.max(0, rawScore));

    return {
      userId,
      roomId: payload.roomId,
      riskScore,
      riskLevel: riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low",
      factors,
      recommendation:
        riskScore >= 60
          ? "manual_review"
          : riskScore >= 30
            ? "request_additional_verification"
            : "auto_approve",
      pricing,
    };
  },

  async getRebookingOptions(userId: string, bookingId: string, reason: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    const canAccess =
      booking.userId === userId || booking.room.hotel.ownerId === userId;
    if (!canAccess) {
      throw new AppError("Unauthorized", 403);
    }

    const candidates = await prisma.room.findMany({
      where: {
        hotelId: { not: booking.room.hotelId },
        maxGuests: { gte: booking.guestCount },
      },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      take: 5,
      orderBy: { basePrice: "asc" },
    });

    const options = candidates.map((room) => ({
      roomId: room.id,
      hotelId: room.hotel.id,
      hotelName: room.hotel.name,
      location: room.hotel.location,
      roomType: room.roomType,
      maxGuests: room.maxGuests,
      basePrice: room.basePrice,
      estimatedPriceDifference: Number(
        (room.basePrice - booking.room.basePrice).toFixed(2),
      ),
    }));

    return {
      bookingId,
      reason,
      comparableOptions: options,
      fallbackRefund: {
        eligible: true,
        estimatedRefundAmount: Number(booking.amount.toFixed(2)),
      },
    };
  },

  async createTravelDisruptionCase(
    userId: string,
    bookingId: string,
    payload: {
      eventType:
        | "weather"
        | "transport_strike"
        | "airport_closure"
        | "medical"
        | "government_restriction";
      severity: "low" | "medium" | "high" | "critical";
    },
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { include: { hotel: true } } },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    const canAccess =
      booking.userId === userId || booking.room.hotel.ownerId === userId;
    if (!canAccess) {
      throw new AppError("Unauthorized", 403);
    }

    const baseRefundBySeverity: Record<string, number> = {
      low: 20,
      medium: 45,
      high: 75,
      critical: 100,
    };
    const eventBoost: Record<string, number> = {
      weather: 0,
      transport_strike: 10,
      airport_closure: 15,
      medical: 20,
      government_restriction: 25,
    };

    const rawPercent =
      baseRefundBySeverity[payload.severity] + eventBoost[payload.eventType];
    const refundPercent = Math.min(100, Math.max(0, rawPercent));
    const estimatedRefundAmount = Number(
      ((booking.amount * refundPercent) / 100).toFixed(2),
    );

    const recommendation =
      payload.severity === "critical" || payload.eventType === "medical"
        ? "priority_manual_review"
        : "auto_apply_policy";

    const record = await prisma.travelDisruptionCase.create({
      data: {
        bookingId,
        userId,
        eventType: payload.eventType,
        severity: payload.severity,
        refundPercent,
        estimatedRefundAmount,
        travelCreditPercent: refundPercent < 100 ? 15 : 0,
        recommendation,
      },
    });

    return {
      ...record,
      policyVersion: "travel_disruption_v1",
    };
  },

  async simulateTravelDisruptionPolicyMock(
    userId: string,
    bookingId: string,
    payload: {
      eventType:
        | "weather"
        | "transport_strike"
        | "airport_closure"
        | "medical"
        | "government_restriction";
      severity: "low" | "medium" | "high" | "critical";
    },
  ) {
    return this.createTravelDisruptionCase(userId, bookingId, payload);
  },

  async getReservationRiskMock(userId: string, payload: ReservationRiskInput) {
    return this.getReservationRisk(userId, payload);
  },

  async getRebookingOptionsMock(
    userId: string,
    bookingId: string,
    reason: string,
  ) {
    return this.getRebookingOptions(userId, bookingId, reason);
  },

  async assessTravelDisruption(
    userId: string,
    bookingId: string,
    payload: {
      eventType:
        | "weather"
        | "transport_strike"
        | "airport_closure"
        | "medical"
        | "government_restriction";
      severity: "low" | "medium" | "high" | "critical";
    },
  ) {
    return this.createTravelDisruptionCase(userId, bookingId, payload);
  },

  async getMyBookings(userId: string) {
    return prisma.booking.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            hotel: {
              select: { id: true, name: true, location: true },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getHostBookings(hostId: string) {
    return prisma.booking.findMany({
      where: {
        room: {
          hotel: { ownerId: hostId },
        },
      },
      include: {
        guest: { select: { id: true, name: true, email: true, avatar: true } },
        room: {
          include: {
            hotel: { select: { id: true, name: true, location: true } },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getBookingById(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
        payment: true,
        history: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    const canAccess =
      booking.userId === userId || booking.room.hotel.ownerId === userId;
    if (!canAccess) {
      throw new AppError("Unauthorized", 403);
    }

    return booking;
  },

  async updateBooking(
    userId: string,
    bookingId: string,
    payload: {
      guestCount?: number;
      checkIn?: Date;
      checkOut?: Date;
      notes?: string;
    },
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new AppError("Booking not found", 404);
    if (booking.userId !== userId) throw new AppError("Unauthorized", 403);
    if (!["pending", "confirmed"].includes(booking.status)) {
      throw new AppError("Booking cannot be updated in current status", 400);
    }

    if (
      payload.checkIn &&
      payload.checkOut &&
      payload.checkIn >= payload.checkOut
    ) {
      throw new AppError("Check-out must be after check-in", 400);
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(typeof payload.guestCount === "number" && {
          guestCount: payload.guestCount,
        }),
        ...(payload.checkIn && { checkIn: payload.checkIn }),
        ...(payload.checkOut && { checkOut: payload.checkOut }),
        ...(typeof payload.notes === "string" && { notes: payload.notes }),
      },
    });

    await prisma.bookingHistory.create({
      data: {
        bookingId,
        status: updated.status,
        updatedBy: userId,
        notes: "Booking details updated",
      },
    });

    return updated;
  },

  async cancelBooking(userId: string, bookingId: string, reason?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          include: {
            hotel: {
              include: {
                owner: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        guest: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    const canCancel =
      booking.userId === userId || booking.room.hotel.ownerId === userId;
    if (!canCancel) {
      throw new AppError("Unauthorized to cancel this booking", 403);
    }

    if (["cancelled", "expired", "checked_out"].includes(booking.status)) {
      throw new AppError("Booking cannot be cancelled in current status", 400);
    }

    const cancelledBooking = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "cancelled",
          notes: reason
            ? `${booking.notes || ""}\nCancellation reason: ${reason}`.trim()
            : booking.notes,
        },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId,
          status: "cancelled",
          updatedBy: userId,
          notes: reason || "Booking cancelled",
        },
      });

      return updated;
    });

    // Fire-and-forget: notify guest and host
    publishEvent("booking.cancelled", {
      bookingId,
      guest: (booking as any).guest,
      host: (booking as any).room.hotel.owner,
      hotel: { name: booking.room.hotel.name },
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      reason,
    }).catch(() => {});

    return cancelledBooking;
  },

  async getCancellationPreview(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          include: {
            hotel: {
              include: {
                cancellationPolicy: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    const canAccess =
      booking.userId === userId || booking.room.hotel.ownerId === userId;
    if (!canAccess) {
      throw new AppError("Unauthorized", 403);
    }

    const now = new Date();
    const msUntilCheckIn = booking.checkIn.getTime() - now.getTime();
    const hoursUntilCheckIn = Math.max(0, Math.floor(msUntilCheckIn / 3600000));

    const policy = booking.room.hotel.cancellationPolicy;
    const policyType =
      policy?.policyType || booking.cancellationPolicy || "moderate";

    let refundablePercent = 0;
    if (policy) {
      if (hoursUntilCheckIn >= policy.freeCancellationHours) {
        refundablePercent = 100;
      } else {
        refundablePercent = Math.max(0, policy.partialRefundPercent);
      }
    } else {
      // Default fallback policy behavior for legacy bookings.
      if (policyType === "flexible") {
        refundablePercent = hoursUntilCheckIn >= 24 ? 100 : 50;
      } else if (policyType === "strict") {
        refundablePercent = hoursUntilCheckIn >= 168 ? 50 : 0;
      } else {
        refundablePercent = hoursUntilCheckIn >= 120 ? 100 : 50;
      }
    }

    const totalPaid = booking.amount;
    const nights = calcNights(booking.checkIn, booking.checkOut);
    const [feeConfig, taxConfig] = await Promise.all([
      prisma.serviceFeeConfig.findFirst({ orderBy: { createdAt: "desc" } }),
      prisma.taxConfiguration.findFirst({ where: { region: "default" } }),
    ]);
    const serviceFeePercent = feeConfig?.percentage ?? 13;
    const taxPercent = taxConfig?.taxPercentage ?? 5;
    const pricing = computeBookingPricing({
      nightlyBasePrice: booking.room.basePrice,
      nights,
      serviceFeePercent,
      taxPercent,
    });
    const refundableAmount = Number(
      ((totalPaid * refundablePercent) / 100).toFixed(2),
    );
    const nonRefundableAmount = Number(
      (totalPaid - refundableAmount).toFixed(2),
    );

    return {
      bookingId: booking.id,
      policyType,
      hoursUntilCheckIn,
      nights,
      pricing,
      refundablePercent,
      totalPaid,
      refundableAmount,
      nonRefundableAmount,
      canCancel: !["cancelled", "expired", "checked_out"].includes(
        booking.status,
      ),
    };
  },

  async confirmCheckIn(ownerId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { include: { hotel: true } } },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.room.hotel.ownerId !== ownerId) {
      throw new AppError("Only host can confirm check-in", 403);
    }

    if (booking.status !== "confirmed") {
      throw new AppError("Only confirmed bookings can be checked in", 400);
    }

    const checkedIn = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "checked_in" },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId,
          status: "checked_in",
          updatedBy: ownerId,
          notes: "Guest checked in",
        },
      });

      return updated;
    });

    // Fire-and-forget: notify guest
    prisma.user
      .findUnique({
        where: { id: booking.userId },
        select: { id: true, name: true, email: true },
      })
      .then((guest) => {
        if (!guest) return;
        publishEvent("booking.checked_in", {
          bookingId,
          guest,
          hotel: { name: booking.room.hotel.name },
          checkOut: booking.checkOut,
        });
      })
      .catch(() => {});

    return checkedIn;
  },

  async confirmCheckOut(ownerId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { include: { hotel: true } } },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.room.hotel.ownerId !== ownerId) {
      throw new AppError("Only host can confirm check-out", 403);
    }

    if (booking.status !== "checked_in") {
      throw new AppError("Only checked-in bookings can be checked out", 400);
    }

    const checkedOut = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "checked_out" },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId,
          status: "checked_out",
          updatedBy: ownerId,
          notes: "Guest checked out",
        },
      });

      return updated;
    });

    // Fire-and-forget: notify guest
    prisma.user
      .findUnique({
        where: { id: booking.userId },
        select: { id: true, name: true, email: true },
      })
      .then((guest) => {
        if (!guest) return;
        publishEvent("booking.checked_out", {
          bookingId,
          guest,
          hotel: { name: booking.room.hotel.name },
        });
      })
      .catch(() => {});

    return checkedOut;
  },

  async hostAcceptBooking(ownerId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { include: { hotel: true } } },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }
    if (booking.room.hotel.ownerId !== ownerId) {
      throw new AppError("Only host can accept booking", 403);
    }
    if (booking.status !== "pending") {
      throw new AppError("Only pending bookings can be accepted", 400);
    }

    const accepted = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: "confirmed", expiresAt: null },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId,
          status: "confirmed",
          updatedBy: ownerId,
          notes: "Booking accepted by host",
        },
      });

      return updated;
    });

    return accepted;
  },

  async hostDeclineBooking(
    ownerId: string,
    bookingId: string,
    reason?: string,
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { include: { hotel: true } } },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }
    if (booking.room.hotel.ownerId !== ownerId) {
      throw new AppError("Only host can decline booking", 403);
    }
    if (booking.status !== "pending") {
      throw new AppError("Only pending bookings can be declined", 400);
    }

    const declined = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "cancelled",
          expiresAt: null,
          notes: reason
            ? `${booking.notes || ""}\nHost decline reason: ${reason}`.trim()
            : booking.notes,
        },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId,
          status: "cancelled",
          updatedBy: ownerId,
          notes: reason || "Booking declined by host",
        },
      });

      return updated;
    });

    return declined;
  },

  async hostAlterBooking(
    ownerId: string,
    bookingId: string,
    payload: {
      checkIn?: Date;
      checkOut?: Date;
      guestCount?: number;
      notes?: string;
    },
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: { include: { hotel: true } },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }
    if (booking.room.hotel.ownerId !== ownerId) {
      throw new AppError("Only host can alter booking", 403);
    }
    if (!["pending", "confirmed"].includes(booking.status)) {
      throw new AppError(
        "Only pending or confirmed bookings can be altered",
        400,
      );
    }

    const nextCheckIn = payload.checkIn ?? booking.checkIn;
    const nextCheckOut = payload.checkOut ?? booking.checkOut;
    const nextGuestCount = payload.guestCount ?? booking.guestCount;

    if (nextCheckIn >= nextCheckOut) {
      throw new AppError("Check-out must be after check-in", 400);
    }
    if (nextGuestCount > booking.room.maxGuests) {
      throw new AppError(
        `Guest count exceeds room max limit (${booking.room.maxGuests})`,
        400,
      );
    }

    const blocked = await prisma.blockedDates.findFirst({
      where: {
        roomId: booking.roomId,
        startDate: { lte: nextCheckOut },
        endDate: { gte: nextCheckIn },
      },
    });
    if (blocked) {
      throw new AppError("Room is blocked for selected altered dates", 409);
    }

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        id: { not: bookingId },
        roomId: booking.roomId,
        checkIn: { lte: nextCheckOut },
        checkOut: { gte: nextCheckIn },
        status: { in: ["pending", "confirmed", "checked_in"] },
      },
    });
    if (conflictingBooking) {
      throw new AppError("Room has conflicting booking for altered dates", 409);
    }

    const nights = calcNights(nextCheckIn, nextCheckOut);
    const subtotal = booking.room.basePrice * nights;
    const feeConfig = await prisma.serviceFeeConfig.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const taxConfig = await prisma.taxConfiguration.findFirst({
      where: { region: "default" },
    });
    const serviceFeePercent = feeConfig?.percentage ?? 13;
    const serviceFeeCapPercent = 30;
    const serviceFee = Math.min(
      subtotal * (serviceFeePercent / 100),
      subtotal * (serviceFeeCapPercent / 100),
    );
    const taxPercent = taxConfig?.taxPercentage ?? 5;
    const tax = (subtotal + serviceFee) * (taxPercent / 100);
    const amount = subtotal + serviceFee + tax;

    const altered = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          checkIn: nextCheckIn,
          checkOut: nextCheckOut,
          guestCount: nextGuestCount,
          amount,
          notes: payload.notes !== undefined ? payload.notes : booking.notes,
          status: booking.status === "pending" ? "confirmed" : booking.status,
        },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId,
          status: updated.status,
          updatedBy: ownerId,
          notes: "Booking altered by host",
        },
      });

      return updated;
    });

    return altered;
  },

  async hostMarkNoShow(ownerId: string, bookingId: string, notes?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { include: { hotel: true } } },
    });
    if (!booking) throw new AppError("Booking not found", 404);
    if (booking.room.hotel.ownerId !== ownerId) {
      throw new AppError("Only host can mark no-show", 403);
    }
    if (!["confirmed", "checked_in"].includes(booking.status)) {
      throw new AppError(
        "Only confirmed/checked-in bookings can be marked no-show",
        400,
      );
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "cancelled",
          notes: notes
            ? `${booking.notes || ""}\nMarked no-show: ${notes}`.trim()
            : `${booking.notes || ""}\nMarked no-show`.trim(),
        },
      });

      await tx.bookingHistory.create({
        data: {
          bookingId,
          status: "cancelled",
          updatedBy: ownerId,
          notes: notes || "Guest marked as no-show by host",
        },
      });

      return b;
    });

    return updated;
  },
};

export default bookingService;
