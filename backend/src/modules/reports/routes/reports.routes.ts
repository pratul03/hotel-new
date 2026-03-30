import { Router } from "express";
import { authenticate, requireRole } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { reportsController } from "../controllers/reports.controller";

const router = Router();

router.post(
  "/incident",
  authenticate,
  catchAsync(reportsController.reportIncident),
);

router.get(
  "/incidents",
  authenticate,
  catchAsync(reportsController.listIncidents),
);

router.get(
  "/aircover-board",
  authenticate,
  catchAsync(reportsController.airCoverBoard),
);

router.post(
  "/off-platform-fee",
  authenticate,
  catchAsync(reportsController.createOffPlatformFee),
);

router.get(
  "/off-platform-fee",
  authenticate,
  catchAsync(reportsController.listOffPlatformFee),
);

router.get("/:id", authenticate, catchAsync(reportsController.getIncident));

router.patch(
  "/:id/status",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(reportsController.updateIncidentStatus),
);

router.patch(
  "/:id/resolve",
  authenticate,
  requireRole(["admin"]),
  catchAsync(reportsController.resolveIncident),
);

export default router;
