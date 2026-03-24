import { Router, Response } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../../../middleware/authMiddleware";
import type { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { catchAsync, successResponse } from "../../../utils";
import { reportService } from "../services/reports.service";

const router = Router();

const createSchema = z.object({
  bookingId: z.string().min(1),
  description: z.string().min(5),
});

const listSchema = z.object({
  status: z.enum(["open", "investigating", "resolved", "closed"]).optional(),
  bookingId: z.string().min(1).optional(),
});

const resolveSchema = z.object({
  resolution: z.string().min(3),
});

const statusSchema = z.object({
  status: z.enum(["open", "investigating", "resolved", "closed"]),
  resolution: z.string().min(3).optional(),
});

const offPlatformFeeSchema = z.object({
  bookingId: z.string().min(1),
  description: z.string().min(5),
  evidenceUrls: z.array(z.string().url()).optional(),
});

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";

router.post(
  "/incident",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = createSchema.parse(req.body);
    const data = await reportService.reportIncident(
      req.userId as string,
      payload.bookingId,
      payload.description,
    );
    res.status(201).json(successResponse(data, "Incident reported"));
  }),
);

router.get(
  "/incidents",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = listSchema.parse(req.query);
    const data = await reportService.listIncidents(
      req.userId as string,
      payload,
    );
    res.json(successResponse(data, "Incidents fetched"));
  }),
);

router.get(
  "/aircover-board",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await reportService.getAirCoverBoard(req.userId as string);
    res.json(successResponse(data, "AirCover board fetched"));
  }),
);

router.post(
  "/off-platform-fee",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = offPlatformFeeSchema.parse(req.body);
    const data = await reportService.createOffPlatformFeeCase(
      req.userId as string,
      payload,
    );
    res
      .status(201)
      .json(successResponse(data, "Off-platform fee case created"));
  }),
);

router.get(
  "/off-platform-fee",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await reportService.listOffPlatformFeeCases(
      req.userId as string,
    );
    res.json(successResponse(data, "Off-platform fee cases fetched"));
  }),
);

router.get(
  "/:id",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const id = getParam(req.params.id as string | string[] | undefined);
    const data = await reportService.getIncident(req.userId as string, id);
    res.json(successResponse(data, "Incident fetched"));
  }),
);

router.patch(
  "/:id/status",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const id = getParam(req.params.id as string | string[] | undefined);
    const payload = statusSchema.parse(req.body);
    const data = await reportService.updateIncidentStatus(
      req.userId as string,
      id,
      payload.status,
      payload.resolution,
    );
    res.json(successResponse(data, "Incident status updated"));
  }),
);

router.patch(
  "/:id/resolve",
  authenticate,
  requireRole(["admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const id = getParam(req.params.id as string | string[] | undefined);
    const payload = resolveSchema.parse(req.body);
    const data = await reportService.resolveIncident(
      req.userId as string,
      id,
      payload.resolution,
    );
    res.json(successResponse(data, "Incident resolved"));
  }),
);

export default router;

