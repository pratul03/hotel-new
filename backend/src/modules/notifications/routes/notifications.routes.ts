import { Router, Response } from "express";
import { z } from "zod";
import {
  authenticate,
  AuthenticatedRequest,
} from "../../../middleware/authMiddleware";
import { catchAsync, successResponse } from "../../../utils";
import { notificationService } from "../services/notifications.service";

const router = Router();

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";

const preferencesSchema = z.object({
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  booking: z.boolean().optional(),
  message: z.boolean().optional(),
  payment: z.boolean().optional(),
  marketing: z.boolean().optional(),
});

router.get(
  "/",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await notificationService.list(req.userId as string);
    res.json(successResponse(data, "Notifications fetched"));
  }),
);

router.patch(
  "/:id/read",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const id = getParam(req.params.id as string | string[] | undefined);
    const data = await notificationService.markRead(req.userId as string, id);
    res.json(successResponse(data, "Notification marked as read"));
  }),
);

router.patch(
  "/read-all",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await notificationService.markAllRead(req.userId as string);
    res.json(successResponse(data, "All notifications marked as read"));
  }),
);

router.get(
  "/unread-count",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await notificationService.unreadCount(req.userId as string);
    res.json(successResponse(data, "Unread count fetched"));
  }),
);

router.get(
  "/preferences",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await notificationService.getPreferences(req.userId as string);
    res.json(successResponse(data, "Notification preferences fetched"));
  }),
);

router.put(
  "/preferences",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = preferencesSchema.parse(req.body);
    const data = await notificationService.updatePreferences(
      req.userId as string,
      payload,
    );
    res.json(successResponse(data, "Notification preferences updated"));
  }),
);

router.delete(
  "/:id",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const id = getParam(req.params.id as string | string[] | undefined);
    const data = await notificationService.delete(req.userId as string, id);
    res.json(successResponse(data, "Notification deleted"));
  }),
);

export default router;

