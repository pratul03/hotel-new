import { Router } from "express";
import { authenticate, requireRole } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { paymentsController } from "../controllers/payments.controller";

const router = Router();

router.post("/", authenticate, catchAsync(paymentsController.createOrder));

router.post(
  "/chargebacks",
  authenticate,
  catchAsync(paymentsController.createChargeback),
);

router.get(
  "/chargebacks",
  authenticate,
  catchAsync(paymentsController.listChargebacks),
);

router.get(
  "/fx-rates",
  authenticate,
  catchAsync(paymentsController.listFxRates),
);

router.put(
  "/fx-rates",
  authenticate,
  requireRole(["admin"]),
  catchAsync(paymentsController.upsertFxRate),
);

router.get(
  "/ops/queue-summary",
  authenticate,
  requireRole(["admin"]),
  catchAsync(paymentsController.getQueueSummary),
);

router.post(
  "/ops/reprocess-stale",
  authenticate,
  requireRole(["admin"]),
  catchAsync(paymentsController.reprocessStale),
);

router.patch(
  "/chargebacks/:id",
  authenticate,
  catchAsync(paymentsController.updateChargeback),
);

router.post("/webhook", catchAsync(paymentsController.handleWebhook));

router.get(
  "/invoice/booking/:bookingId",
  authenticate,
  catchAsync(paymentsController.generateInvoice),
);

router.get(
  "/settlement/quote",
  authenticate,
  catchAsync(paymentsController.getSettlementQuote),
);

router.get(
  "/settlement/booking/:bookingId",
  authenticate,
  catchAsync(paymentsController.getSettlementSummary),
);

router.get(
  "/booking/:bookingId",
  authenticate,
  catchAsync(paymentsController.getByBooking),
);

router.get("/:id", authenticate, catchAsync(paymentsController.getById));

export default router;
