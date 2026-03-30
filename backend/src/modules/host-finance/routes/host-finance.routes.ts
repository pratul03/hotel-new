import { Router, Response } from "express";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { hostfinanceController } from "../controllers/host-finance.controller";

const router = Router();

router.get(
  "/earnings",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hostfinanceController.getEarnings),
);

router.get(
  "/transactions",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hostfinanceController.getTransactions),
);

router.get(
  "/payout-account",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hostfinanceController.getPayoutAccount),
);

router.put(
  "/payout-account",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hostfinanceController.upsertPayoutAccount),
);

router.get(
  "/payouts",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hostfinanceController.getPayouts),
);

router.post(
  "/payouts/request",
  authenticate,
  requireRole(["host", "admin"]),
  catchAsync(hostfinanceController.requestPayout),
);

export default router;
