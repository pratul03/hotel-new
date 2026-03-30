import { Router } from "express";
import { authenticate, requireRole } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { supportController } from "../controllers/support.controller";

const router = Router();

router.post(
  "/tickets",
  authenticate,
  catchAsync(supportController.createTicket),
);

router.get("/tickets", authenticate, catchAsync(supportController.getTickets));

router.get(
  "/tickets/:id",
  authenticate,
  catchAsync(supportController.getTicket),
);

router.post(
  "/tickets/:id/reply",
  authenticate,
  catchAsync(supportController.reply),
);

router.post(
  "/tickets/:id/escalate",
  authenticate,
  catchAsync(supportController.escalate),
);

router.post(
  "/emergency",
  authenticate,
  catchAsync(supportController.createEmergency),
);

router.get(
  "/ops/routing-console",
  authenticate,
  requireRole(["admin"]),
  catchAsync(supportController.routingConsole),
);

router.get(
  "/ops/dashboard",
  authenticate,
  requireRole(["admin"]),
  catchAsync(supportController.opsDashboard),
);

export default router;
