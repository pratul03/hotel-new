import { Router } from "express";
import { authenticate } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { notificationsController } from "../controllers/notifications.controller";

const router = Router();

router.get("/", authenticate, catchAsync(notificationsController.list));

router.patch(
  "/:id/read",
  authenticate,
  catchAsync(notificationsController.markRead),
);

router.patch(
  "/read-all",
  authenticate,
  catchAsync(notificationsController.markAllRead),
);

router.get(
  "/unread-count",
  authenticate,
  catchAsync(notificationsController.unreadCount),
);

router.get(
  "/preferences",
  authenticate,
  catchAsync(notificationsController.getPreferences),
);

router.put(
  "/preferences",
  authenticate,
  catchAsync(notificationsController.updatePreferences),
);

router.delete("/:id", authenticate, catchAsync(notificationsController.delete));

export default router;
