import { Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { successResponse } from "../../../utils";
import { notificationsQueries } from "../queries/notifications.queries";
import { preferencesSchema } from "../schemas/notifications.schema";
import { notificationService } from "../services/notifications.service";

export const notificationsController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const data = await notificationService.list(
      notificationsQueries.userId(req),
    );
    res.json(successResponse(data, "Notifications fetched"));
  },

  async markRead(req: AuthenticatedRequest, res: Response) {
    const data = await notificationService.markRead(
      notificationsQueries.userId(req),
      notificationsQueries.id(req),
    );
    res.json(successResponse(data, "Notification marked as read"));
  },

  async markAllRead(req: AuthenticatedRequest, res: Response) {
    const data = await notificationService.markAllRead(
      notificationsQueries.userId(req),
    );
    res.json(successResponse(data, "All notifications marked as read"));
  },

  async unreadCount(req: AuthenticatedRequest, res: Response) {
    const data = await notificationService.unreadCount(
      notificationsQueries.userId(req),
    );
    res.json(successResponse(data, "Unread count fetched"));
  },

  async getPreferences(req: AuthenticatedRequest, res: Response) {
    const data = await notificationService.getPreferences(
      notificationsQueries.userId(req),
    );
    res.json(successResponse(data, "Notification preferences fetched"));
  },

  async updatePreferences(req: AuthenticatedRequest, res: Response) {
    const payload = preferencesSchema.parse(req.body);
    const data = await notificationService.updatePreferences(
      notificationsQueries.userId(req),
      payload,
    );
    res.json(successResponse(data, "Notification preferences updated"));
  },

  async delete(req: AuthenticatedRequest, res: Response) {
    const data = await notificationService.delete(
      notificationsQueries.userId(req),
      notificationsQueries.id(req),
    );
    res.json(successResponse(data, "Notification deleted"));
  },
};

export default notificationsController;
