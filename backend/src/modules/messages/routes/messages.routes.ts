import { Router } from "express";
import { authenticate } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { messagesController } from "../controllers/messages.controller";

const router = Router();

router.post("/", authenticate, catchAsync(messagesController.sendMessage));

router.get(
  "/thread/:userId",
  authenticate,
  catchAsync(messagesController.getThread),
);

router.get("/:userId", authenticate, catchAsync(messagesController.getThread));

router.get(
  "/conversations",
  authenticate,
  catchAsync(messagesController.getConversations),
);

router.patch(
  "/:id/read",
  authenticate,
  catchAsync(messagesController.markAsRead),
);

router.get(
  "/unread-count",
  authenticate,
  catchAsync(messagesController.unreadCount),
);

export default router;
