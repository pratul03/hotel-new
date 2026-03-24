import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { successResponse } from "../../../utils";
import { paymentService } from "../services/payment.service";
import {
  createChargebackSchema,
  createPaymentSchema,
  fxRateSchema,
  reprocessStaleSchema,
  updateChargebackSchema,
} from "../schemas/payments.schema";

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";

const settlementQuoteQuerySchema = z.object({
  amountInInr: z.coerce.number().positive(),
  targetCurrency: z.string().trim().length(3),
});

const settlementBookingQuerySchema = z.object({
  targetCurrency: z.string().trim().length(3),
});

export const paymentsController = {
  async createOrder(req: AuthenticatedRequest, res: Response) {
    const payload = createPaymentSchema.parse(req.body);
    const data = await paymentService.createOrder(
      req.userId as string,
      payload.bookingId,
    );
    res.status(201).json(successResponse(data, "Payment order created"));
  },

  async createChargeback(req: AuthenticatedRequest, res: Response) {
    const payload = createChargebackSchema.parse(req.body);
    const data = await paymentService.createChargebackCase(
      req.userId as string,
      payload.paymentId,
      payload.reason,
      payload.evidenceUrls,
    );
    res.status(201).json(successResponse(data, "Chargeback case created"));
  },

  async listChargebacks(req: AuthenticatedRequest, res: Response) {
    const data = await paymentService.listChargebackCases(req.userId as string);
    res.json(successResponse(data, "Chargeback cases fetched"));
  },

  async listFxRates(_req: AuthenticatedRequest, res: Response) {
    const data = await paymentService.listFxRates();
    res.json(successResponse(data, "FX rates fetched"));
  },

  async upsertFxRate(req: AuthenticatedRequest, res: Response) {
    const payload = fxRateSchema.parse(req.body);
    const data = await paymentService.upsertFxRate(
      req.userId as string,
      payload,
    );
    res.json(successResponse(data, "FX rate upserted"));
  },

  async getQueueSummary(_req: AuthenticatedRequest, res: Response) {
    const data = await paymentService.getPaymentQueueSummary();
    res.json(successResponse(data, "Payment queue summary fetched"));
  },

  async reprocessStale(req: AuthenticatedRequest, res: Response) {
    const payload = reprocessStaleSchema.parse(req.body ?? {});
    const data = await paymentService.reprocessStalePayments(
      req.userId as string,
      payload,
    );
    res.json(successResponse(data, "Stale payment reprocess completed"));
  },

  async updateChargeback(req: AuthenticatedRequest, res: Response) {
    const caseId = getParam(req.params.id as string | string[] | undefined);
    const payload = updateChargebackSchema.parse(req.body);
    const data = await paymentService.advanceChargebackCase(
      req.userId as string,
      caseId,
      payload.status,
      payload.note,
    );
    res.json(successResponse(data, "Chargeback case updated"));
  },

  async handleWebhook(req: any, res: Response) {
    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    const rawBody = req.rawBody || "";
    const data = await paymentService.handleWebhook(signature, rawBody);
    res.json(successResponse(data, "Webhook processed"));
  },

  async generateInvoice(req: AuthenticatedRequest, res: Response) {
    const bookingId = getParam(
      req.params.bookingId as string | string[] | undefined,
    );
    const data = await paymentService.generateTaxInvoice(
      req.userId as string,
      bookingId,
    );
    res.json(successResponse(data, "Invoice generated"));
  },

  async getSettlementQuote(req: AuthenticatedRequest, res: Response) {
    const payload = settlementQuoteQuerySchema.parse(req.query);
    const data = await paymentService.getSettlementQuote(
      payload.amountInInr,
      payload.targetCurrency,
    );
    res.json(successResponse(data, "Settlement quote generated"));
  },

  async getSettlementSummary(req: AuthenticatedRequest, res: Response) {
    const payload = settlementBookingQuerySchema.parse(req.query);
    const summary = await paymentService.getSettlementSummary(
      req.userId as string,
      getParam(req.params.bookingId as string | string[] | undefined),
      payload.targetCurrency,
    );
    res.json(successResponse(summary, "Settlement summary generated"));
  },

  async getByBooking(req: AuthenticatedRequest, res: Response) {
    const bookingId = getParam(
      req.params.bookingId as string | string[] | undefined,
    );
    const data = await paymentService.getByBooking(
      req.userId as string,
      bookingId,
    );
    res.json(successResponse(data, "Payment by booking fetched"));
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    const id = getParam(req.params.id as string | string[] | undefined);
    const data = await paymentService.getById(id);
    res.json(successResponse(data, "Payment fetched"));
  },
};

export default paymentsController;
