import { Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { successResponse } from "../../../utils";
import { hostFinanceService } from "../services/host-finance.service";
import { hostfinanceQueries } from "../queries/host-finance.queries";
import {
  payoutAccountSchema,
  payoutRequestSchema,
} from "../schemas/host-finance.schema";

export const hostfinanceController = {
  async getEarnings(req: AuthenticatedRequest, res: Response) {
    const payload = hostfinanceQueries.listQuery(req);
    const data = await hostFinanceService.getEarningsOverview(
      hostfinanceQueries.userId(req) as string,
      payload.months ?? 6,
    );

    res.json(successResponse(data, "Host earnings retrieved"));
  },

  async getTransactions(req: AuthenticatedRequest, res: Response) {
    const payload = hostfinanceQueries.listQuery(req);
    const data = await hostFinanceService.getTransactions(
      hostfinanceQueries.userId(req) as string,
      payload.limit ?? 20,
    );

    res.json(successResponse(data, "Host transactions retrieved"));
  },

  async getPayoutAccount(req: AuthenticatedRequest, res: Response) {
    const data = await hostFinanceService.getPayoutAccount(
      hostfinanceQueries.userId(req) as string,
    );
    res.json(successResponse(data, "Host payout account retrieved"));
  },

  async upsertPayoutAccount(req: AuthenticatedRequest, res: Response) {
    const payload = payoutAccountSchema.parse(req.body);
    const data = await hostFinanceService.upsertPayoutAccount(
      hostfinanceQueries.userId(req) as string,
      payload,
    );

    res.json(successResponse(data, "Host payout account saved"));
  },

  async getPayouts(req: AuthenticatedRequest, res: Response) {
    const payload = hostfinanceQueries.listQuery(req);
    const data = await hostFinanceService.getPayoutHistory(
      hostfinanceQueries.userId(req) as string,
      payload.limit ?? 20,
    );

    res.json(successResponse(data, "Host payouts retrieved"));
  },

  async requestPayout(req: AuthenticatedRequest, res: Response) {
    const payload = payoutRequestSchema.parse(req.body);
    const data = await hostFinanceService.requestPayout(
      hostfinanceQueries.userId(req) as string,
      payload.amount,
      payload.notes,
    );

    res.status(201).json(successResponse(data, "Payout request created"));
  },
};

export default hostfinanceController;
