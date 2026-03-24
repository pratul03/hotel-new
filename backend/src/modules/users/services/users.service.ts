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
