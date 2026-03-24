import { prisma } from "../config/database";

export interface InAppNotificationInput {
  userId: string;
  type: string;
  content: string;
  link?: string;
}

export const createInAppNotification = async (
  data: InAppNotificationInput,
): Promise<void> => {
  try {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        content: data.content,
        link: data.link,
      },
    });
  } catch (err) {
    console.error("[InApp] Failed to create notification:", err);
  }
};

export const createBulkInAppNotifications = async (
  notifications: InAppNotificationInput[],
): Promise<void> => {
  if (!notifications.length) return;
  try {
    await prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        content: n.content,
        link: n.link,
      })),
    });
  } catch (err) {
    console.error("[InApp] Failed to create bulk notifications:", err);
  }
};
