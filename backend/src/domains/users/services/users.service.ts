import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/database";
import { AppError } from "../../../utils";

const LOYALTY_TIERS = [
  {
    name: "Explorer",
    minStays: 0,
    minSpend: 0,
    benefits: ["Saved wishlists", "Price alerts", "Standard support"],
  },
  {
    name: "Silver",
    minStays: 5,
    minSpend: 25000,
    benefits: [
      "Priority support queue",
      "Early access deals",
      "Faster issue handling",
    ],
  },
  {
    name: "Gold",
    minStays: 10,
    minSpend: 75000,
    benefits: [
      "Premium support queue",
      "Special promotions",
      "Booking flexibility offers",
    ],
  },
  {
    name: "Platinum",
    minStays: 20,
    minSpend: 150000,
    benefits: [
      "Top-tier support",
      "Exclusive partner offers",
      "Highest priority case handling",
    ],
  },
] as const;

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  verified: true,
  superhost: true,
  responseRate: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type AdminUserRecord = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;

const getAdminHealthStatus = (
  verified: boolean,
  superhost: boolean,
  responseRate: number | null,
) => {
  if (superhost || (verified && typeof responseRate === "number" && responseRate >= 80)) {
    return "healthy" as const;
  }

  if (verified || (typeof responseRate === "number" && responseRate >= 70)) {
    return "watch" as const;
  }

  return "needs_attention" as const;
};

const mapAdminUserRow = (
  user: AdminUserRecord,
  metrics: {
    listingsCount: number;
    promotedListingsCount: number;
    lastActivityAt: Date | null;
  },
) => {
  const responseRate =
    typeof user.responseRate === "number" ? user.responseRate : null;

  return {
    ...user,
    responseRate,
    listingsCount: metrics.listingsCount,
    promotedListingsCount: metrics.promotedListingsCount,
    lastActivityAt: (metrics.lastActivityAt ?? user.updatedAt).toISOString(),
    health: getAdminHealthStatus(user.verified, user.superhost, responseRate),
  };
};

export const userService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        verified: true,
        superhost: true,
        responseRate: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async updateProfile(
    userId: string,
    data: { name?: string; avatar?: string },
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(typeof data.name === "string" && { name: data.name }),
        ...(typeof data.avatar === "string" && { avatar: data.avatar }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        verified: true,
        superhost: true,
        responseRate: true,
      },
    });
  },

  async addDocument(userId: string, documentType: string, docUrl: string) {
    return prisma.userDocument.create({
      data: {
        userId,
        documentType,
        docUrl,
      },
    });
  },

  async listDocuments(userId: string) {
    return prisma.userDocument.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async deleteDocument(userId: string, docId: string) {
    const doc = await prisma.userDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.userId !== userId) {
      throw new AppError("Document not found", 404);
    }

    await prisma.userDocument.delete({ where: { id: docId } });
    return { deleted: true };
  },

  async listUsersForAdmin(input: {
    search?: string;
    role?: "guest" | "host" | "admin";
    verified?: boolean;
    superhost?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = input.page ?? 1;
    const limit = input.limit ?? 100;
    const search = input.search?.trim();

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (input.role) {
      where.role = input.role;
    }

    if (typeof input.verified === "boolean") {
      where.verified = input.verified;
    }

    if (typeof input.superhost === "boolean") {
      where.superhost = input.superhost;
    }

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: adminUserSelect,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const pages = total === 0 ? 0 : Math.ceil(total / limit);

    if (users.length === 0) {
      return {
        data: [],
        total,
        page,
        limit,
        pages,
      };
    }

    const userIds = users.map((user) => user.id);

    const [listingStats, promotedListingStats] = await Promise.all([
      prisma.hotel.groupBy({
        by: ["ownerId"],
        where: { ownerId: { in: userIds } },
        _count: { _all: true },
        _max: { updatedAt: true },
      }),
      prisma.hotel.groupBy({
        by: ["ownerId"],
        where: {
          ownerId: { in: userIds },
          isPromoted: true,
        },
        _count: { _all: true },
      }),
    ]);

    const listingMap = new Map(
      listingStats.map((item) => [
        item.ownerId,
        {
          listingsCount: item._count._all,
          lastActivityAt: item._max.updatedAt,
        },
      ]),
    );

    const promotedMap = new Map(
      promotedListingStats.map((item) => [item.ownerId, item._count._all]),
    );

    return {
      data: users.map((user) => {
        const listingMetrics = listingMap.get(user.id);

        return mapAdminUserRow(user, {
          listingsCount: listingMetrics?.listingsCount ?? 0,
          promotedListingsCount: promotedMap.get(user.id) ?? 0,
          lastActivityAt: listingMetrics?.lastActivityAt ?? null,
        });
      }),
      total,
      page,
      limit,
      pages,
    };
  },

  async updateUserByAdmin(
    adminUserId: string,
    userId: string,
    input: {
      role?: "guest" | "host" | "admin";
      verified?: boolean;
      superhost?: boolean;
    },
  ) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existing) {
      throw new AppError("User not found", 404);
    }

    if (
      adminUserId === userId &&
      typeof input.role === "string" &&
      input.role !== "admin"
    ) {
      throw new AppError("You cannot remove your own admin access", 400);
    }

    const data: Prisma.UserUpdateInput = {
      ...(typeof input.role === "string" && { role: input.role }),
      ...(typeof input.verified === "boolean" && { verified: input.verified }),
      ...(typeof input.superhost === "boolean" && {
        superhost: input.superhost,
      }),
    };

    if (Object.keys(data).length === 0) {
      throw new AppError("No user moderation changes supplied", 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: adminUserSelect,
    });

    const [listingsCount, promotedListingsCount, listingAggregate] =
      await Promise.all([
        prisma.hotel.count({ where: { ownerId: userId } }),
        prisma.hotel.count({
          where: {
            ownerId: userId,
            isPromoted: true,
          },
        }),
        prisma.hotel.aggregate({
          where: { ownerId: userId },
          _max: { updatedAt: true },
        }),
      ]);

    return mapAdminUserRow(updatedUser, {
      listingsCount,
      promotedListingsCount,
      lastActivityAt: listingAggregate._max.updatedAt,
    });
  },

  async getHostVerification(userId: string) {
    const hostVerification = await prisma.hostVerification.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            superhost: true,
            responseRate: true,
          },
        },
      },
    });

    if (!hostVerification) {
      throw new AppError("Host verification record not found", 404);
    }

    return hostVerification;
  },

  async getLoyaltySummary(userId: string) {
    const [bookings, searchCount] = await Promise.all([
      prisma.booking.findMany({
        where: {
          userId,
          status: {
            in: ["confirmed", "checked_in", "checked_out"],
          },
        },
        select: {
          amount: true,
        },
      }),
      prisma.searchHistory.count({ where: { userId } }),
    ]);

    const stays = bookings.length;
    const totalSpent = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const rewardPoints = Math.floor(totalSpent / 100) + stays * 50;
    const currentTierIndex = LOYALTY_TIERS.reduce((best, tier, index) => {
      const qualifiesByStays = stays >= tier.minStays;
      const qualifiesBySpend = totalSpent >= tier.minSpend;
      return qualifiesByStays || qualifiesBySpend ? index : best;
    }, 0);

    const tier = LOYALTY_TIERS[currentTierIndex].name;
    const nextTier = LOYALTY_TIERS[currentTierIndex + 1] || null;

    const referralCode = `MYBNB-${userId.slice(0, 6).toUpperCase()}`;

    return {
      tier,
      benefits: LOYALTY_TIERS[currentTierIndex].benefits,
      rewardPoints,
      totalSpent: Number(totalSpent.toFixed(2)),
      completedStays: stays,
      nextTierTarget: nextTier
        ? {
            tier: nextTier.name,
            staysRequired: Math.max(0, nextTier.minStays - stays),
            spendRequired: Number(
              Math.max(0, nextTier.minSpend - totalSpent).toFixed(2),
            ),
          }
        : null,
      referralCode,
      personalizationSignals: {
        searches: searchCount,
      },
    };
  },

  async getIdentityVerification(userId: string) {
    const [user, documents] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          verified: true,
        },
      }),
      prisma.userDocument.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const hasGovId = documents.some((d) =>
      ["passport", "drivers_license", "aadhaar", "national_id"].includes(
        d.documentType,
      ),
    );
    const hasAddressProof = documents.some((d) =>
      ["utility_bill", "bank_statement", "rental_agreement"].includes(
        d.documentType,
      ),
    );
    const hasRejected = documents.some((d) => d.status === "rejected");
    const hasVerifiedDoc = documents.some((d) => d.status === "verified");

    let stage: "pending_submission" | "in_review" | "verified" | "rejected" =
      "pending_submission";
    if (hasRejected) {
      stage = "rejected";
    } else if (user.verified || hasVerifiedDoc) {
      stage = "verified";
    } else if (documents.length > 0) {
      stage = "in_review";
    }

    return {
      userId,
      stage,
      checks: {
        governmentId: hasGovId,
        addressProof: hasAddressProof,
        selfieMatch: hasVerifiedDoc || user.verified,
      },
      requiredActions:
        stage === "verified"
          ? []
          : [
              ...(hasGovId ? [] : ["Upload government ID"]),
              ...(hasAddressProof ? [] : ["Upload address proof"]),
              "Complete selfie check",
            ],
      documents: documents.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        status: d.status,
        createdAt: d.createdAt,
      })),
    };
  },

  async getIdentityVerificationMock(userId: string) {
    return this.getIdentityVerification(userId);
  },
};

export default userService;
