import { Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { successResponse } from "../../../utils";
import { reportsQueries } from "../queries/reports.queries";
import {
  createSchema,
  listSchema,
  offPlatformFeeSchema,
  resolveSchema,
  statusSchema,
} from "../schemas/reports.schema";
import { reportService } from "../services/reports.service";

export const reportsController = {
  async reportIncident(req: AuthenticatedRequest, res: Response) {
    const payload = createSchema.parse(req.body);
    const data = await reportService.reportIncident(
      reportsQueries.userId(req),
      payload.bookingId,
      payload.description,
    );
    res.status(201).json(successResponse(data, "Incident reported"));
  },

  async listIncidents(req: AuthenticatedRequest, res: Response) {
    const payload = listSchema.parse(req.query);
    const data = await reportService.listIncidents(
      reportsQueries.userId(req),
      payload,
    );
    res.json(successResponse(data, "Incidents fetched"));
  },

  async airCoverBoard(req: AuthenticatedRequest, res: Response) {
    const data = await reportService.getAirCoverBoard(
      reportsQueries.userId(req),
    );
    res.json(successResponse(data, "AirCover board fetched"));
  },

  async createOffPlatformFee(req: AuthenticatedRequest, res: Response) {
    const payload = offPlatformFeeSchema.parse(req.body);
    const data = await reportService.createOffPlatformFeeCase(
      reportsQueries.userId(req),
      payload,
    );
    res
      .status(201)
      .json(successResponse(data, "Off-platform fee case created"));
  },

  async listOffPlatformFee(req: AuthenticatedRequest, res: Response) {
    const data = await reportService.listOffPlatformFeeCases(
      reportsQueries.userId(req),
    );
    res.json(successResponse(data, "Off-platform fee cases fetched"));
  },

  async getIncident(req: AuthenticatedRequest, res: Response) {
    const data = await reportService.getIncident(
      reportsQueries.userId(req),
      reportsQueries.id(req),
    );
    res.json(successResponse(data, "Incident fetched"));
  },

  async updateIncidentStatus(req: AuthenticatedRequest, res: Response) {
    const payload = statusSchema.parse(req.body);
    const data = await reportService.updateIncidentStatus(
      reportsQueries.userId(req),
      reportsQueries.id(req),
      payload.status,
      payload.resolution,
    );
    res.json(successResponse(data, "Incident status updated"));
  },

  async resolveIncident(req: AuthenticatedRequest, res: Response) {
    const payload = resolveSchema.parse(req.body);
    const data = await reportService.resolveIncident(
      reportsQueries.userId(req),
      reportsQueries.id(req),
      payload.resolution,
    );
    res.json(successResponse(data, "Incident resolved"));
  },
};

export default reportsController;
