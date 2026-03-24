import { Router, Response } from "express";
import { z } from "zod";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "../../../middleware/authMiddleware";
import { catchAsync, successResponse } from "../../../utils";
import { hostFinanceService } from "../services/host-finance.service";

const router = Router();

const payoutAccountSchema = z.object({
  accountHolderName: z.string().min(2),
  bankName: z.string().min(2),
  accountNumber: z.string().min(8).max(24),
  ifscCode: z.string().min(8).max(20),
  payoutMethod: z.enum(["bank_transfer", "upi"]).optional(),
  upiId: z.string().optional(),
});

const payoutRequestSchema = z.object({
  amount: z.number().positive(),
  notes: z.string().max(500).optional(),
});

router.get(
  "/earnings",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const rawMonths = Number(req.query.months ?? 6);
    const months = Number.isFinite(rawMonths) ? rawMonths : 6;

    const data = await hostFinanceService.getEarningsOverview(
      req.userId as string,
      months,
    );

    res.json(successResponse(data, "Host earnings retrieved"));
  }),
);

router.get(
  "/transactions",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const rawLimit = Number(req.query.limit ?? 20);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 20;

    const data = await hostFinanceService.getTransactions(
      req.userId as string,
      limit,
    );

    res.json(successResponse(data, "Host transactions retrieved"));
  }),
);

router.get(
  "/payout-account",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await hostFinanceService.getPayoutAccount(
      req.userId as string,
    );
    res.json(successResponse(data, "Host payout account retrieved"));
  }),
);

router.put(
  "/payout-account",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = payoutAccountSchema.parse(req.body);
    const data = await hostFinanceService.upsertPayoutAccount(
      req.userId as string,
      payload,
    );
    res.json(successResponse(data, "Host payout account saved"));
  }),
);

router.get(
  "/payouts",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const rawLimit = Number(req.query.limit ?? 20);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 20;
    const data = await hostFinanceService.getPayoutHistory(
      req.userId as string,
      limit,
    );
    res.json(successResponse(data, "Host payouts retrieved"));
  }),
);

router.post(
  "/payouts/request",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = payoutRequestSchema.parse(req.body);
    const data = await hostFinanceService.requestPayout(
      req.userId as string,
      payload.amount,
      payload.notes,
    );
    res.status(201).json(successResponse(data, "Payout request created"));
  }),
);

export default router;

