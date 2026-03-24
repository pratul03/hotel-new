import { prisma } from "../../../config/database";
import { AppError } from "../../../utils";

type IncidentStatus = "open" | "investigating" | "resolved" | "closed";

const INCIDENT_STATUSES: IncidentStatus[] = [
  "open",
  "investigating",
  "resolved",
  "closed",
];

export const reportService = {
  async reportIncident(userId: string, bookingId: string, description: string) {
    return prisma.incidentReport.create({
      data: {
        bookingId,
        reportedByUserId: userId,
        description,
      },
    });
  },

  async getIncident(userId: string, incidentId: string) {
    const incident = await prisma.incidentReport.findUnique({
      where: { id: incidentId },
      include: {
        booking: {
          include: {
            room: {
              include: {
                hotel: true,
              },
            },
          },
        },
      },
    });

    if (!incident) throw new AppError("Incident not found", 404);

    const canView =
      incident.reportedByUserId === userId ||
      incident.booking.userId === userId ||
      incident.booking.room.hotel.ownerId === userId;

    if (!canView) throw new AppError("Unauthorized", 403);

    return incident;
  },

  async listIncidents(
    userId: string,
    filters?: { status?: IncidentStatus; bookingId?: string },
  ) {
    const actor = await prisma.user.findUnique({ where: { id: userId } });
    if (!actor) {
      throw new AppError("Unauthorized", 403);
    }

    const baseWhere: Record<string, unknown> = {};

    if (filters?.status && INCIDENT_STATUSES.includes(filters.status)) {
      baseWhere.status = filters.status;
    }

    if (filters?.bookingId) {
      baseWhere.bookingId = filters.bookingId;
    }

    if (actor.role === "admin") {
      return prisma.incidentReport.findMany({
        where: baseWhere,
        include: {
          reportedBy: { select: { id: true, name: true, email: true } },
          booking: {
            select: {
              id: true,
              userId: true,
              room: {
                select: {
                  hotel: { select: { id: true, name: true, ownerId: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (actor.role === "host") {
      return prisma.incidentReport.findMany({
        where: {
          ...baseWhere,
          OR: [
            { reportedByUserId: userId },
            {
              booking: {
                room: {
                  hotel: {
                    ownerId: userId,
                  },
                },
              },
            },
          ],
        },
        include: {
          reportedBy: { select: { id: true, name: true, email: true } },
          booking: {
            select: {
              id: true,
              userId: true,
              room: {
                select: {
                  hotel: { select: { id: true, name: true, ownerId: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return prisma.incidentReport.findMany({
      where: {
        ...baseWhere,
        OR: [{ reportedByUserId: userId }, { booking: { userId } }],
      },
      include: {
        reportedBy: { select: { id: true, name: true, email: true } },
        booking: {
          select: {
            id: true,
            userId: true,
            room: {
              select: {
                hotel: { select: { id: true, name: true, ownerId: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async updateIncidentStatus(
    actorUserId: string,
    incidentId: string,
    status: IncidentStatus,
    resolution?: string,
  ) {
    if (!INCIDENT_STATUSES.includes(status)) {
      throw new AppError("Invalid incident status", 400);
    }

    const actor = await prisma.user.findUnique({ where: { id: actorUserId } });
    if (!actor) {
      throw new AppError("Unauthorized", 403);
    }

    const incident = await prisma.incidentReport.findUnique({
      where: { id: incidentId },
      include: {
        booking: {
          include: {
            room: {
              include: {
                hotel: true,
              },
            },
          },
        },
      },
    });

    if (!incident) {
      throw new AppError("Incident not found", 404);
    }

    const isAdmin = actor.role === "admin";
    const isIncidentHost = incident.booking.room.hotel.ownerId === actorUserId;
    if (!isAdmin && !isIncidentHost) {
      throw new AppError("Only admin or host can update incident status", 403);
    }

    if (status === "resolved" && !resolution?.trim()) {
      throw new AppError("Resolution is required when resolving incident", 400);
    }

    return prisma.incidentReport.update({
      where: { id: incidentId },
      data: {
        status,
        ...(resolution ? { resolution } : {}),
        resolvedAt: status === "resolved" ? new Date() : null,
      },
    });
  },

  async resolveIncident(
    adminUserId: string,
    incidentId: string,
    resolution: string,
  ) {
    const admin = await prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.role !== "admin") {
      throw new AppError("Only admin can resolve incidents", 403);
    }

    return this.updateIncidentStatus(
      adminUserId,
      incidentId,
      "resolved",
      resolution,
    );
  },

  async getAirCoverBoard(userId: string) {
    const incidents = await this.listIncidents(userId);
    const emergencyTickets = await prisma.supportTicket.findMany({
      where: {
        userId,
        priority: "urgent",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const chargebackCases = await prisma.chargebackCase.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return {
      generatedAt: new Date().toISOString(),
      incidents,
      emergencyTickets,
      chargebackCases: chargebackCases.map((item) => ({
        ...item,
        evidenceUrls: JSON.parse(item.evidenceUrls || "[]"),
        timeline: JSON.parse(item.timeline || "[]"),
      })),
    };
  },

  async createOffPlatformFeeCase(
    userId: string,
    payload: {
      bookingId: string;
      description: string;
      evidenceUrls?: string[];
    },
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId },
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

    const created = await prisma.offPlatformFeeCase.create({
      data: {
        bookingId: payload.bookingId,
        reporterUserId: userId,
        description: payload.description,
        evidenceUrls: JSON.stringify(payload.evidenceUrls ?? []),
      },
    });

    return {
      ...created,
      evidenceUrls: JSON.parse(created.evidenceUrls || "[]"),
    };
  },

  async listOffPlatformFeeCases(userId: string) {
    const items = await prisma.offPlatformFeeCase.findMany({
      where: {
        reporterUserId: userId,
      },
      orderBy: { createdAt: "desc" },
    });

    return items.map((item) => ({
      ...item,
      evidenceUrls: JSON.parse(item.evidenceUrls || "[]"),
    }));
  },
};

export default reportService;
