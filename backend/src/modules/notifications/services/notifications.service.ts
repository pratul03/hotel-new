import { prisma } from "../../../config/database";

const defaultPreferences = {
  inApp: true,
  email: true,
  push: false,
  booking: true,
  message: true,
  payment: true,
  marketing: false,
};

const parsePreferences = (raw?: string | null) => {
  if (!raw) return { ...defaultPreferences };
  try {
    const parsed = JSON.parse(raw);
    return {
      ...defaultPreferences,
      ...(parsed && typeof parsed === "object" ? parsed : {}),
    };
  } catch {
    return { ...defaultPreferences };
  }
};

export const notificationService = {
  async list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async markRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  async unreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  },

  async getPreferences(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notificationPreferences: true,
      },
    });

    return parsePreferences(user?.notificationPreferences);
  },

  async updatePreferences(
    userId: string,
    updates: Partial<Record<string, boolean>>,
  ) {
    const current = await this.getPreferences(userId);
    const merged = {
      ...current,
      ...updates,
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: JSON.stringify(merged),
      },
    });

    return merged;
  },

  async delete(userId: string, notificationId: string) {
    await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });

    return { deleted: true };
  },
};

export default notificationService;
