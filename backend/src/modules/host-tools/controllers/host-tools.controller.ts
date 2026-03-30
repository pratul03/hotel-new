import { Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { successResponse } from "../../../utils";
import { hosttoolsQueries } from "../queries/host-tools.queries";
import {
  addCohostSchema,
  adjudicateClaimSchema,
  cancellationSchema,
  claimSchema,
  complianceSchema,
  listingQualitySchema,
  quickReplySchema,
  scheduledMessageSchema,
} from "../schemas/host-tools.schema";
import { hostToolsService } from "../services/host-tools.service";

class HostToolsController {
  async getCancellationPolicy(req: AuthenticatedRequest, res: Response) {
    const data = await hostToolsService.getCancellationPolicy(
      hosttoolsQueries.hotelId(req),
      req.userId as string,
    );
    res.json(successResponse(data, "Cancellation policy retrieved"));
  }

  async upsertCancellationPolicy(req: AuthenticatedRequest, res: Response) {
    const payload = cancellationSchema.parse(req.body);
    const data = await hostToolsService.upsertCancellationPolicy(
      hosttoolsQueries.hotelId(req),
      req.userId as string,
      payload,
    );
    res.json(successResponse(data, "Cancellation policy updated"));
  }

  async listQuickReplies(req: AuthenticatedRequest, res: Response) {
    const data = await hostToolsService.listQuickReplies(req.userId as string);
    res.json(successResponse(data, "Quick replies retrieved"));
  }

  async createQuickReply(req: AuthenticatedRequest, res: Response) {
    const payload = quickReplySchema.parse(req.body);
    const data = await hostToolsService.createQuickReply(
      req.userId as string,
      payload,
    );
    res.status(201).json(successResponse(data, "Quick reply created"));
  }

  async deleteQuickReply(req: AuthenticatedRequest, res: Response) {
    const data = await hostToolsService.deleteQuickReply(
      req.userId as string,
      hosttoolsQueries.id(req),
    );
    res.json(successResponse(data, "Quick reply deleted"));
  }

  async listScheduledMessages(req: AuthenticatedRequest, res: Response) {
    const data = await hostToolsService.listScheduledMessages(
      req.userId as string,
    );
    res.json(successResponse(data, "Scheduled messages retrieved"));
  }

  async createScheduledMessage(req: AuthenticatedRequest, res: Response) {
    const payload = scheduledMessageSchema.parse(req.body);
    const data = await hostToolsService.createScheduledMessage(
      req.userId as string,
      {
        ...payload,
        sendAt: new Date(payload.sendAt),
      },
    );
    res.status(201).json(successResponse(data, "Scheduled message created"));
  }

  async cancelScheduledMessage(req: AuthenticatedRequest, res: Response) {
    const data = await hostToolsService.cancelScheduledMessage(
      req.userId as string,
      hosttoolsQueries.id(req),
    );
    res.json(successResponse(data, "Scheduled message cancelled"));
  }

  async getAnalytics(req: AuthenticatedRequest, res: Response) {
    const payload = hosttoolsQueries.analytics(req);
    const data = await hostToolsService.getAnalytics(
      req.userId as string,
      payload.days,
    );
    res.json(successResponse(data, "Host analytics retrieved"));
  }

  async listCoHosts(req: AuthenticatedRequest, res: Response) {
    const data = await hostToolsService.listCoHosts(
      hosttoolsQueries.hotelId(req),
      req.userId as string,
    );
    res.json(successResponse(data, "Co-hosts retrieved"));
  }

  async addCoHost(req: AuthenticatedRequest, res: Response) {
    const payload = addCohostSchema.parse(req.body);
    const data = await hostToolsService.addCoHost(
      hosttoolsQueries.hotelId(req),
      req.userId as string,
      payload,
    );
    res.status(201).json(successResponse(data, "Co-host assigned"));
  }

  async removeCoHost(req: AuthenticatedRequest, res: Response) {
    const data = await hostToolsService.removeCoHost(
      hosttoolsQueries.hotelId(req),
      req.userId as string,
      hosttoolsQueries.assignmentId(req),
    );
    res.json(successResponse(data, "Co-host removed"));
  }

  async getComplianceChecklist(req: AuthenticatedRequest, res: Response) {
    const data = await hostToolsService.getComplianceChecklist(
      hosttoolsQueries.hotelId(req),
      req.userId as string,
    );
    res.json(successResponse(data, "Compliance checklist retrieved"));
  }

  async getListingQuality(req: AuthenticatedRequest, res: Response) {
    const data = await hostToolsService.getListingQuality(
      hosttoolsQueries.hotelId(req),
      req.userId as string,
    );
    res.json(successResponse(data, "Listing quality retrieved"));
  }

  async upsertListingQuality(req: AuthenticatedRequest, res: Response) {
    const payload = listingQualitySchema.parse(req.body);
    const data = await hostToolsService.upsertListingQuality(
      hosttoolsQueries.hotelId(req),
      req.userId as string,
      payload,
    );
    res.json(successResponse(data, "Listing quality updated"));
  }

  async upsertComplianceChecklist(req: AuthenticatedRequest, res: Response) {
    const payload = complianceSchema.parse(req.body);
    const data = await hostToolsService.upsertComplianceChecklist(
      hosttoolsQueries.hotelId(req),
      req.userId as string,
      payload,
    );
    res.json(successResponse(data, "Compliance checklist updated"));
  }

  async listClaims(req: AuthenticatedRequest, res: Response) {
    const data = await hostToolsService.listClaims(req.userId as string);
    res.json(successResponse(data, "Claims retrieved"));
  }

  async createClaim(req: AuthenticatedRequest, res: Response) {
    const payload = claimSchema.parse(req.body);
    const data = await hostToolsService.createClaim(
      req.userId as string,
      payload,
    );
    res.status(201).json(successResponse(data, "Claim created"));
  }

  async adjudicateClaim(req: AuthenticatedRequest, res: Response) {
    const payload = adjudicateClaimSchema.parse(req.body);
    const data = await hostToolsService.adjudicateClaim(
      req.userId as string,
      hosttoolsQueries.id(req),
      payload,
    );
    res.json(successResponse(data, "Claim adjudicated"));
  }

  async exportComplianceAudit(req: AuthenticatedRequest, res: Response) {
    const payload = hosttoolsQueries.auditExport(req);
    const data = await hostToolsService.exportComplianceAudit(
      req.userId as string,
      payload.days,
    );
    res.json(successResponse(data, "Compliance audit export generated"));
  }
}

export const hosttoolsController = new HostToolsController();

export default hosttoolsController;
