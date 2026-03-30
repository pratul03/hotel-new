import { Router } from "express";
import { authenticate, requireRole } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { bookingController } from "../controllers/booking.controller";

const router = Router();

router.post("/", authenticate, catchAsync(bookingController.create));

router.get("/me", authenticate, catchAsync(bookingController.getMine));

router.get(
  "/host",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(bookingController.getHost),
);

router.get("/preview", authenticate, catchAsync(bookingController.getPreview));

router.get(
  "/risk-preview",
  authenticate,
  catchAsync(bookingController.getRiskPreview),
);

router.get("/:id", authenticate, catchAsync(bookingController.getById));

router.patch("/:id/update", authenticate, catchAsync(bookingController.update));

router.patch("/:id/cancel", authenticate, catchAsync(bookingController.cancel));

router.get(
  "/:id/cancellation-preview",
  authenticate,
  catchAsync(bookingController.getCancellationPreview),
);

router.post(
  "/:id/rebooking-options",
  authenticate,
  catchAsync(bookingController.getRebookingOptions),
);

router.post(
  "/:id/travel-disruption-simulate",
  authenticate,
  catchAsync(bookingController.simulateTravelDisruption),
);

router.post(
  "/:id/confirm-checkin",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(bookingController.confirmCheckIn),
);

router.post(
  "/:id/confirm-checkout",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(bookingController.confirmCheckOut),
);

router.post(
  "/:id/host/accept",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(bookingController.hostAccept),
);

router.post(
  "/:id/host/decline",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(bookingController.hostDecline),
);

router.patch(
  "/:id/host/alter",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(bookingController.hostAlter),
);

router.post(
  "/:id/host/no-show",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(bookingController.hostNoShow),
);

export default router;
