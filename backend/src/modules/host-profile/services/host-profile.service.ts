import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/appError";

interface HostProfileData {
  companyName: string;
  website?: string;
  businessType?: string;
  description?: string;
}

export const hostProfileService = {
  async getProfile(userId: string) {
    const profile = await prisma.hostProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!profile) {
      throw new AppError("Host profile not found", 404);
    }
    return profile;
  },

  async createProfile(userId: string, data: HostProfileData) {
    const existing = await prisma.hostProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new AppError("Host profile already exists", 409);
    }
    return prisma.hostProfile.create({
      data: {
        userId,
        companyName: data.companyName,
        website: data.website,
        businessType: data.businessType ?? "agency",
        description: data.description,
      },
    });
  },

  async updateProfile(userId: string, data: Partial<HostProfileData>) {
    const existing = await prisma.hostProfile.findUnique({ where: { userId } });
    if (!existing) {
      throw new AppError("Host profile not found", 404);
    }
    return prisma.hostProfile.update({
      where: { userId },
      data: {
        ...(data.companyName !== undefined && {
          companyName: data.companyName,
        }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.businessType !== undefined && {
          businessType: data.businessType,
        }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
      },
    });
  },
};
