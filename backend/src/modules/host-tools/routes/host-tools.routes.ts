import { Router, Response } from "express";
import { z } from "zod";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "../../../middleware/authMiddleware";
import { catchAsync, successResponse } from "../../../utils";
import { hostToolsService } from "../services/host-tools.service";

const router = Router();

const cancellationSchema = z.object({
  policyType: z.enum(["flexible", "moderate", "strict"]),
  freeCancellationHours: z
    .number()
    .int()
    .min(0)
    .max(30 * 24),
  partialRefundPercent: z.number().int().min(0).max(100),
  noShowPenaltyPercent: z.number().int().min(0).max(100),
});

const quickReplySchema = z.object({
  title: z.string().min(2).max(150),
  content: z.string().min(2),
  category: z.string().max(50).optional(),
});

const scheduledMessageSchema = z.object({
  receiverUserId: z.string().min(1),
  bookingId: z.string().optional(),
  content: z.string().min(1),
  sendAt: z.string().datetime(),
});

const addCohostSchema = z.object({
  cohostUserId: z.string().min(1),
  permissions: z
    .array(
      z.enum([
        "calendar",
        "messaging",
        "reservations",
        "pricing",
        "cleaning",
        "reviews",
      ]),
    )
    .min(1)
    .optional(),
  revenueSplitPercent: z.number().int().min(0).max(100).optional(),
});

const complianceSchema = z.object({
  jurisdictionCode: z.string().min(2).max(120),
  checklistItems: z.array(
    z.object({
      label: z.string().min(1),
      completed: z.boolean(),
    }),
  ),
  status: z.enum(["incomplete", "in_review", "completed"]).optional(),
});

const claimSchema = z.object({
  hotelId: z.string().min(1),
  bookingId: z.string().min(1),
  title: z.string().min(3).max(255),
  description: z.string().min(5),
  amountClaimed: z.number().min(0).optional(),
  evidenceUrls: z.array(z.string().url()).optional(),
});

const adjudicateClaimSchema = z.object({
  status: z.enum(["reviewing", "approved", "rejected", "settled"]),
  resolutionNote: z.string().min(2).optional(),
});

const listingQualitySchema = z.object({
  coverImageUrl: z.string().url().optional(),
  guidebook: z.string().optional(),
  houseManual: z.string().optional(),
  checkInSteps: z.string().optional(),
});

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";

router.get(
  "/hotels/:hotelId/cancellation-policy",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const hotelId = getParam(
      req.params.hotelId as string | string[] | undefined,
    );
    const data = await hostToolsService.getCancellationPolicy(
      hotelId,
      req.userId as string,
    );
    res.json(successResponse(data, "Cancellation policy retrieved"));
  }),
);

router.put(
  "/hotels/:hotelId/cancellation-policy",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const hotelId = getParam(
      req.params.hotelId as string | string[] | undefined,
    );
    const payload = cancellationSchema.parse(req.body);
    const data = await hostToolsService.upsertCancellationPolicy(
      hotelId,
      req.userId as string,
      payload,
    );
    res.json(successResponse(data, "Cancellation policy updated"));
  }),
);

router.get(
  "/quick-replies",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hostToolsService.listQuickReplies(req.userId as string);
    res.json(successResponse(data, "Quick replies retrieved"));
  }),
);

router.post(
  "/quick-replies",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = quickReplySchema.parse(req.body);
    const data = await hostToolsService.createQuickReply(
      req.userId as string,
      payload,
    );
    res.status(201).json(successResponse(data, "Quick reply created"));
  }),
);

router.delete(
  "/quick-replies/:id",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const id = getParam(req.params.id as string | string[] | undefined);
    const data = await hostToolsService.deleteQuickReply(
      req.userId as string,
      id,
    );
    res.json(successResponse(data, "Quick reply deleted"));
  }),
);

router.get(
  "/scheduled-messages",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hostToolsService.listScheduledMessages(
      req.userId as string,
    );
    res.json(successResponse(data, "Scheduled messages retrieved"));
  }),
);

router.post(
  "/scheduled-messages",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = scheduledMessageSchema.parse(req.body);
    const data = await hostToolsService.createScheduledMessage(
      req.userId as string,
      {
        ...payload,
        sendAt: new Date(payload.sendAt),
      },
    );
    res.status(201).json(successResponse(data, "Scheduled message created"));
  }),
);

router.post(
  "/scheduled-messages/:id/cancel",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const id = getParam(req.params.id as string | string[] | undefined);
    const data = await hostToolsService.cancelScheduledMessage(
      req.userId as string,
      id,
    );
    res.json(successResponse(data, "Scheduled message cancelled"));
  }),
);

router.get(
  "/analytics",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const rawDays = Number(req.query.days ?? 30);
    const days = Number.isFinite(rawDays) ? rawDays : 30;
    const data = await hostToolsService.getAnalytics(
      req.userId as string,
      days,
    );
    res.json(successResponse(data, "Host analytics retrieved"));
  }),
);

router.get(
  "/hotels/:hotelId/cohosts",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const hotelId = getParam(
      req.params.hotelId as string | string[] | undefined,
    );
    const data = await hostToolsService.listCoHosts(
      hotelId,
      req.userId as string,
    );
    res.json(successResponse(data, "Co-hosts retrieved"));
  }),
);

router.post(
  "/hotels/:hotelId/cohosts",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const hotelId = getParam(
      req.params.hotelId as string | string[] | undefined,
    );
    const payload = addCohostSchema.parse(req.body);
    const data = await hostToolsService.addCoHost(
      hotelId,
      req.userId as string,
      payload,
    );
    res.status(201).json(successResponse(data, "Co-host assigned"));
  }),
);

router.delete(
  "/hotels/:hotelId/cohosts/:assignmentId",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const hotelId = getParam(
      req.params.hotelId as string | string[] | undefined,
    );
    const assignmentId = getParam(
      req.params.assignmentId as string | string[] | undefined,
    );
    const data = await hostToolsService.removeCoHost(
      hotelId,
      req.userId as string,
      assignmentId,
    );
    res.json(successResponse(data, "Co-host removed"));
  }),
);

router.get(
  "/hotels/:hotelId/compliance-checklist",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const hotelId = getParam(
      req.params.hotelId as string | string[] | undefined,
    );
    const data = await hostToolsService.getComplianceChecklist(
      hotelId,
      req.userId as string,
    );
    res.json(successResponse(data, "Compliance checklist retrieved"));
  }),
);

router.get(
  "/hotels/:hotelId/listing-quality",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const hotelId = getParam(
      req.params.hotelId as string | string[] | undefined,
    );
    const data = await hostToolsService.getListingQuality(
      hotelId,
      req.userId as string,
    );
    res.json(successResponse(data, "Listing quality retrieved"));
  }),
);

router.put(
  "/hotels/:hotelId/listing-quality",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const hotelId = getParam(
      req.params.hotelId as string | string[] | undefined,
    );
    const payload = listingQualitySchema.parse(req.body);
    const data = await hostToolsService.upsertListingQuality(
      hotelId,
      req.userId as string,
      payload,
    );
    res.json(successResponse(data, "Listing quality updated"));
  }),
);

router.put(
  "/hotels/:hotelId/compliance-checklist",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const hotelId = getParam(
      req.params.hotelId as string | string[] | undefined,
    );
    const payload = complianceSchema.parse(req.body);
    const data = await hostToolsService.upsertComplianceChecklist(
      hotelId,
      req.userId as string,
      payload,
    );
    res.json(successResponse(data, "Compliance checklist updated"));
  }),
);

router.get(
  "/claims",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hostToolsService.listClaims(req.userId as string);
    res.json(successResponse(data, "Claims retrieved"));
  }),
);

router.post(
  "/claims",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = claimSchema.parse(req.body);
    const data = await hostToolsService.createClaim(
      req.userId as string,
      payload,
    );
    res.status(201).json(successResponse(data, "Claim created"));
  }),
);

router.patch(
  "/claims/:id/adjudicate",
  authenticate,
  requireRole(["admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const id = getParam(req.params.id as string | string[] | undefined);
    const payload = adjudicateClaimSchema.parse(req.body);
    const data = await hostToolsService.adjudicateClaim(
      req.userId as string,
      id,
      payload,
    );
    res.json(successResponse(data, "Claim adjudicated"));
  }),
);

router.get(
  "/audit-export",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = z
      .object({
        days: z.coerce.number().int().min(1).max(365).optional(),
      })
      .parse(req.query);
    const data = await hostToolsService.exportComplianceAudit(
      req.userId as string,
      payload.days,
    );
    res.json(successResponse(data, "Compliance audit export generated"));
  }),
);

export default router;

