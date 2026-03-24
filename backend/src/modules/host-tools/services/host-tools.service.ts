import { prisma } from "../../../config/database";
import { AppError } from "../../../utils";

const ALLOWED_COHOST_PERMISSIONS = new Set([
  "calendar",
  "messaging",
  "reservations",
  "pricing",
  "cleaning",
  "reviews",
]);

const ensureHotelOwner = async (hotelId: string, hostId: string) => {
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel || hotel.ownerId !== hostId) {
    throw new AppError("Unauthorized", 403);
  }
  return hotel;
};

export const hostToolsService = {
  async getCancellationPolicy(hotelId: string, hostId: string) {
    await ensureHotelOwner(hotelId, hostId);
    return prisma.hotelCancellationPolicy.findUnique({ where: { hotelId } });
  },

  async upsertCancellationPolicy(
    hotelId: string,
    hostId: string,
    payload: {
      policyType: "flexible" | "moderate" | "strict";
      freeCancellationHours: number;
      partialRefundPercent: number;
      noShowPenaltyPercent: number;
    },
  ) {
    await ensureHotelOwner(hotelId, hostId);
    return prisma.hotelCancellationPolicy.upsert({
      where: { hotelId },
      update: payload,
      create: { hotelId, ...payload },
    });
  },

  async listQuickReplies(hostId: string) {
    return prisma.quickReplyTemplate.findMany({
      where: { userId: hostId },
      orderBy: { updatedAt: "desc" },
    });
  },

  async createQuickReply(
    hostId: string,
    payload: { title: string; content: string; category?: string },
  ) {
    return prisma.quickReplyTemplate.create({
      data: {
        userId: hostId,
        title: payload.title,
        content: payload.content,
        category: payload.category ?? "general",
      },
    });
  },

  async deleteQuickReply(hostId: string, templateId: string) {
    const template = await prisma.quickReplyTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template || template.userId !== hostId) {
      throw new AppError("Quick reply template not found", 404);
    }
    await prisma.quickReplyTemplate.delete({ where: { id: templateId } });
    return { id: templateId };
  },

  async listScheduledMessages(hostId: string) {
    return prisma.scheduledMessage.findMany({
      where: { senderUserId: hostId },
      orderBy: { sendAt: "asc" },
      include: {
        receiver: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async createScheduledMessage(
    hostId: string,
    payload: {
      receiverUserId: string;
      bookingId?: string;
      content: string;
      sendAt: Date;
    },
  ) {
    if (payload.sendAt <= new Date()) {
      throw new AppError("sendAt must be in the future", 400);
    }

    return prisma.scheduledMessage.create({
      data: {
        senderUserId: hostId,
        receiverUserId: payload.receiverUserId,
        bookingId: payload.bookingId,
        content: payload.content,
        sendAt: payload.sendAt,
        status: "scheduled",
      },
    });
  },

  async cancelScheduledMessage(hostId: string, id: string) {
    const message = await prisma.scheduledMessage.findUnique({ where: { id } });
    if (!message || message.senderUserId !== hostId) {
      throw new AppError("Scheduled message not found", 404);
    }
    if (message.status !== "scheduled") {
      throw new AppError("Only scheduled messages can be cancelled", 400);
    }

    return prisma.scheduledMessage.update({
      where: { id },
      data: { status: "cancelled" },
    });
  },

  async getAnalytics(hostId: string, rangeDays: number = 30) {
    const safeDays = Math.min(Math.max(rangeDays, 7), 365);
    const start = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: start },
        room: { hotel: { ownerId: hostId } },
      },
      select: {
        id: true,
        status: true,
        amount: true,
        checkIn: true,
        checkOut: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const checkedOut = bookings.filter(
      (b) => b.status === "checked_out",
    ).length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const revenue = bookings
      .filter((b) =>
        ["confirmed", "checked_in", "checked_out"].includes(b.status),
      )
      .reduce((s, b) => s + b.amount, 0);

    const leadTimes = bookings
      .filter((b) => b.checkIn > b.createdAt)
      .map((b) =>
        Math.ceil(
          (b.checkIn.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
    const avgLeadTimeDays =
      leadTimes.length > 0
        ? leadTimes.reduce((s, v) => s + v, 0) / leadTimes.length
        : 0;

    const reviewAgg = await prisma.review.aggregate({
      where: {
        receiverId: hostId,
        createdAt: { gte: start },
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const occupancyNights = bookings
      .filter((b) =>
        ["confirmed", "checked_in", "checked_out"].includes(b.status),
      )
      .reduce((sum, b) => {
        const nights = Math.max(
          1,
          Math.ceil(
            (b.checkOut.getTime() - b.checkIn.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );
        return sum + nights;
      }, 0);

    const roomsCount = await prisma.room.count({
      where: { hotel: { ownerId: hostId } },
    });
    const occupancyRate =
      roomsCount > 0 ? occupancyNights / (roomsCount * safeDays) : 0;

    const dailyMap = new Map<
      string,
      { date: string; bookings: number; confirmed: number; revenue: number }
    >();

    for (const booking of bookings) {
      const date = booking.createdAt.toISOString().slice(0, 10);
      const current =
        dailyMap.get(date) ||
        ({
          date,
          bookings: 0,
          confirmed: 0,
          revenue: 0,
        } as const);

      const isRevenueStatus = [
        "confirmed",
        "checked_in",
        "checked_out",
      ].includes(booking.status);

      dailyMap.set(date, {
        date,
        bookings: current.bookings + 1,
        confirmed: current.confirmed + Number(booking.status === "confirmed"),
        revenue: Number(
          (current.revenue + (isRevenueStatus ? booking.amount : 0)).toFixed(2),
        ),
      });
    }

    const dailySnapshots = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return {
      rangeDays: safeDays,
      totals: {
        bookings: total,
        confirmed,
        checkedOut,
        cancelled,
        conversionRate: total > 0 ? confirmed / total : 0,
        cancellationRate: total > 0 ? cancelled / total : 0,
        revenue,
        avgLeadTimeDays,
        avgRating: reviewAgg._avg.rating ?? 0,
        reviewsCount: reviewAgg._count.rating,
        occupancyRate,
      },
      dailySnapshots,
    };
  },

  async getListingQuality(hotelId: string, hostId: string) {
    await ensureHotelOwner(hotelId, hostId);
    return prisma.hotelListingToolkit.findUnique({ where: { hotelId } });
  },

  async upsertListingQuality(
    hotelId: string,
    hostId: string,
    payload: {
      coverImageUrl?: string;
      guidebook?: string;
      houseManual?: string;
      checkInSteps?: string;
    },
  ) {
    const hotel = await ensureHotelOwner(hotelId, hostId);

    const checklist = [
      Boolean(hotel.description && hotel.description.trim().length > 40),
      Boolean(hotel.amenities && hotel.amenities !== "[]"),
      Boolean(payload.coverImageUrl && payload.coverImageUrl.trim()),
      Boolean(payload.guidebook && payload.guidebook.trim().length > 20),
      Boolean(payload.houseManual && payload.houseManual.trim().length > 20),
      Boolean(payload.checkInSteps && payload.checkInSteps.trim().length > 10),
    ];
    const completenessScore = Math.round(
      (checklist.filter(Boolean).length / checklist.length) * 100,
    );

    return prisma.hotelListingToolkit.upsert({
      where: { hotelId },
      update: {
        ...payload,
        completenessScore,
      },
      create: {
        hotelId,
        ...payload,
        completenessScore,
      },
    });
  },

  async listCoHosts(hotelId: string, hostId: string) {
    await ensureHotelOwner(hotelId, hostId);
    return prisma.coHostAssignment.findMany({
      where: { hotelId },
      include: {
        cohost: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async addCoHost(
    hotelId: string,
    hostId: string,
    payload: {
      cohostUserId: string;
      permissions?: string[];
      revenueSplitPercent?: number;
    },
  ) {
    await ensureHotelOwner(hotelId, hostId);

    if (payload.cohostUserId === hostId) {
      throw new AppError("Host cannot assign self as co-host", 400);
    }

    const cohost = await prisma.user.findUnique({
      where: { id: payload.cohostUserId },
      select: { id: true, role: true },
    });

    if (!cohost) {
      throw new AppError("Co-host user not found", 404);
    }

    if (!["host", "admin"].includes(cohost.role)) {
      throw new AppError("Co-host must be a host or admin account", 400);
    }

    const normalizedPermissions = Array.from(
      new Set(
        (payload.permissions ?? []).map((item) => item.trim().toLowerCase()),
      ),
    ).filter(Boolean);

    if (!normalizedPermissions.length) {
      throw new AppError("At least one co-host permission is required", 400);
    }

    const invalidPermission = normalizedPermissions.find(
      (perm) => !ALLOWED_COHOST_PERMISSIONS.has(perm),
    );
    if (invalidPermission) {
      throw new AppError(
        `Invalid co-host permission: ${invalidPermission}`,
        400,
      );
    }

    const existingAssignments = await prisma.coHostAssignment.findMany({
      where: { hotelId },
      select: {
        cohostUserId: true,
        revenueSplitPercent: true,
      },
    });

    const maxAssignments = 5;
    const alreadyAssigned = existingAssignments.some(
      (item) => item.cohostUserId === payload.cohostUserId,
    );
    if (!alreadyAssigned && existingAssignments.length >= maxAssignments) {
      throw new AppError("Maximum co-host assignments reached", 400);
    }

    const requestedSplit = payload.revenueSplitPercent ?? 0;
    const otherSplitTotal = existingAssignments
      .filter((item) => item.cohostUserId !== payload.cohostUserId)
      .reduce((sum, item) => sum + item.revenueSplitPercent, 0);
    if (otherSplitTotal + requestedSplit > 100) {
      throw new AppError("Total co-host revenue split cannot exceed 100%", 400);
    }

    return prisma.coHostAssignment.upsert({
      where: {
        hotelId_cohostUserId: {
          hotelId,
          cohostUserId: payload.cohostUserId,
        },
      },
      update: {
        permissions: JSON.stringify(normalizedPermissions),
        revenueSplitPercent: requestedSplit,
      },
      create: {
        hotelId,
        hostUserId: hostId,
        cohostUserId: payload.cohostUserId,
        permissions: JSON.stringify(normalizedPermissions),
        revenueSplitPercent: requestedSplit,
      },
    });
  },

  async removeCoHost(hotelId: string, hostId: string, assignmentId: string) {
    await ensureHotelOwner(hotelId, hostId);
    const assignment = await prisma.coHostAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment || assignment.hotelId !== hotelId) {
      throw new AppError("Co-host assignment not found", 404);
    }

    await prisma.coHostAssignment.delete({ where: { id: assignmentId } });
    return { id: assignmentId };
  },

  async getComplianceChecklist(hotelId: string, hostId: string) {
    await ensureHotelOwner(hotelId, hostId);
    return prisma.hotelComplianceChecklist.findUnique({ where: { hotelId } });
  },

  async upsertComplianceChecklist(
    hotelId: string,
    hostId: string,
    payload: {
      jurisdictionCode: string;
      checklistItems: Array<{ label: string; completed: boolean }>;
      status?: "incomplete" | "in_review" | "completed";
    },
  ) {
    await ensureHotelOwner(hotelId, hostId);
    return prisma.hotelComplianceChecklist.upsert({
      where: { hotelId },
      update: {
        jurisdictionCode: payload.jurisdictionCode,
        checklistItems: JSON.stringify(payload.checklistItems),
        status: payload.status ?? "incomplete",
      },
      create: {
        hotelId,
        jurisdictionCode: payload.jurisdictionCode,
        checklistItems: JSON.stringify(payload.checklistItems),
        status: payload.status ?? "incomplete",
      },
    });
  },

  async listClaims(hostId: string) {
    return prisma.hostClaim.findMany({
      where: { hostUserId: hostId },
      include: {
        hotel: { select: { id: true, name: true } },
        booking: { select: { id: true, checkIn: true, checkOut: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async createClaim(
    hostId: string,
    payload: {
      hotelId: string;
      bookingId: string;
      title: string;
      description: string;
      amountClaimed?: number;
      evidenceUrls?: string[];
    },
  ) {
    await ensureHotelOwner(payload.hotelId, hostId);

    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: { room: { include: { hotel: true } } },
    });
    if (!booking || booking.room.hotel.id !== payload.hotelId) {
      throw new AppError("Booking not found for this hotel", 404);
    }

    return prisma.hostClaim.create({
      data: {
        hotelId: payload.hotelId,
        bookingId: payload.bookingId,
        hostUserId: hostId,
        title: payload.title,
        description: payload.description,
        amountClaimed: payload.amountClaimed ?? 0,
        evidenceUrls: JSON.stringify(payload.evidenceUrls ?? []),
      },
    });
  },

  async adjudicateClaim(
    adminUserId: string,
    claimId: string,
    payload: {
      status: "reviewing" | "approved" | "rejected" | "settled";
      resolutionNote?: string;
    },
  ) {
    const actor = await prisma.user.findUnique({ where: { id: adminUserId } });
    if (!actor || actor.role !== "admin") {
      throw new AppError("Only admins can adjudicate claims", 403);
    }

    const claim = await prisma.hostClaim.findUnique({ where: { id: claimId } });
    if (!claim) {
      throw new AppError("Claim not found", 404);
    }

    const suffix = payload.resolutionNote
      ? `\n[adjudication_note]${payload.resolutionNote}`
      : "";

    return prisma.hostClaim.update({
      where: { id: claimId },
      data: {
        status: payload.status,
        resolutionNote:
          claim.resolutionNote && claim.resolutionNote.trim().length > 0
            ? `${claim.resolutionNote}${suffix}`
            : (payload.resolutionNote ?? null),
      },
      include: {
        hotel: { select: { id: true, name: true } },
        booking: { select: { id: true, checkIn: true, checkOut: true } },
      },
    });
  },

  async exportComplianceAudit(hostId: string, days = 90) {
    const safeDays = Math.max(1, Math.min(days, 365));
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - safeDays);

    const [checklists, claims] = await Promise.all([
      prisma.hotelComplianceChecklist.findMany({
        where: { hotel: { ownerId: hostId } },
        include: { hotel: { select: { id: true, name: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.hostClaim.findMany({
        where: {
          hostUserId: hostId,
          createdAt: { gte: windowStart },
        },
        include: { hotel: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const csvLines = [
      "recordType,hotelId,hotelName,status,referenceId,timestamp",
      ...checklists.map(
        (item) =>
          `compliance,${item.hotel.id},${JSON.stringify(item.hotel.name)},${item.status},${item.id},${item.updatedAt.toISOString()}`,
      ),
      ...claims.map(
        (item) =>
          `claim,${item.hotel.id},${JSON.stringify(item.hotel.name)},${item.status},${item.id},${item.createdAt.toISOString()}`,
      ),
    ];

    return {
      generatedAt: new Date().toISOString(),
      lookbackDays: safeDays,
      totals: {
        complianceRecords: checklists.length,
        claims: claims.length,
      },
      records: {
        checklists,
        claims,
      },
      csv: csvLines.join("\n"),
    };
  },

  async exportComplianceAuditMock(hostId: string, days = 90) {
    return this.exportComplianceAudit(hostId, days);
  },
};

export default hostToolsService;
