import { Router } from "express";
import { authenticate, requireRole } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { hosttoolsController } from "../controllers/host-tools.controller";

const router = Router();

router.get(
  "/hotels/:hotelId/cancellation-policy",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.getCancellationPolicy),
);

router.put(
  "/hotels/:hotelId/cancellation-policy",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.upsertCancellationPolicy),
);

router.get(
  "/quick-replies",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.listQuickReplies),
);

router.post(
  "/quick-replies",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.createQuickReply),
);

router.delete(
  "/quick-replies/:id",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.deleteQuickReply),
);

router.get(
  "/scheduled-messages",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.listScheduledMessages),
);

router.post(
  "/scheduled-messages",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.createScheduledMessage),
);

router.post(
  "/scheduled-messages/:id/cancel",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.cancelScheduledMessage),
);

router.get(
  "/analytics",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.getAnalytics),
);

router.get(
  "/hotels/:hotelId/cohosts",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.listCoHosts),
);

router.post(
  "/hotels/:hotelId/cohosts",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.addCoHost),
);

router.delete(
  "/hotels/:hotelId/cohosts/:assignmentId",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.removeCoHost),
);

router.get(
  "/hotels/:hotelId/compliance-checklist",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.getComplianceChecklist),
);

router.get(
  "/hotels/:hotelId/listing-quality",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.getListingQuality),
);

router.put(
  "/hotels/:hotelId/listing-quality",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.upsertListingQuality),
);

router.put(
  "/hotels/:hotelId/compliance-checklist",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.upsertComplianceChecklist),
);

router.get(
  "/claims",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.listClaims),
);

router.post(
  "/claims",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.createClaim),
);

router.patch(
  "/claims/:id/adjudicate",
  authenticate,
  requireRole(["admin"]),
  catchAsync(hosttoolsController.adjudicateClaim),
);

router.get(
  "/audit-export",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hosttoolsController.exportComplianceAudit),
);

export default router;
