// Mock environment and razorpay BEFORE any imports since payment.service initializes
// Razorpay at module level using env vars
jest.mock("../../config/environment", () => ({
  env: {
    RAZORPAY_KEY_ID: "test_key",
    RAZORPAY_KEY_SECRET: "test_secret",
    JWT_SECRET: "test_jwt_secret",
    JWT_EXPIRE: "7d",
    PORT: 3000,
    DATABASE_URL: "postgresql://test",
    REDIS_URL: "redis://localhost",
    MINIO_ENDPOINT: "localhost",
    MINIO_PORT: 9000,
    MINIO_BUCKET_PREFIX: "airbnb",
  },
}));

const mockOrdersCreate = jest.fn();
jest.mock("razorpay", () =>
  jest.fn().mockImplementation(() => ({
    orders: { create: mockOrdersCreate },
  })),
);

jest.mock("../../config/database", () => ({
  prisma: {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    bookingHistory: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    chargebackCase: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    taxInvoice: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    fxRate: {
      findUnique: jest.fn(),
    },
    settlementQuote: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("../../utils/eventPublisher", () => ({
  publishEvent: jest.fn().mockResolvedValue(undefined),
}));

import crypto from "crypto";
import { paymentService } from "../../domains/payments/services/payment.service";
import { prisma } from "../../config/database";
import { AppError } from "../../utils";
import { publishEvent } from "../../utils/eventPublisher";

const bookingFindUnique = prisma.booking.findUnique as jest.Mock;
const paymentUpsert = prisma.payment.upsert as jest.Mock;
const paymentFindFirst = prisma.payment.findFirst as jest.Mock;
const paymentFindUnique = prisma.payment.findUnique as jest.Mock;
const paymentFindMany = prisma.payment.findMany as jest.Mock;
const paymentUpdate = prisma.payment.update as jest.Mock;
const paymentUpdateMany = prisma.payment.updateMany as jest.Mock;
const userFindUnique = prisma.user.findUnique as jest.Mock;
const bookingHistoryCreate = prisma.bookingHistory.create as jest.Mock;
const mockPublishEvent = publishEvent as jest.Mock;
const chargebackCreate = prisma.chargebackCase.create as jest.Mock;
const chargebackFindFirst = prisma.chargebackCase.findFirst as jest.Mock;
const chargebackFindMany = prisma.chargebackCase.findMany as jest.Mock;
const chargebackFindUnique = prisma.chargebackCase.findUnique as jest.Mock;
const chargebackUpdate = prisma.chargebackCase.update as jest.Mock;
const taxInvoiceFindFirst = prisma.taxInvoice.findFirst as jest.Mock;
const taxInvoiceCreate = prisma.taxInvoice.create as jest.Mock;
const prismaTransaction = prisma.$transaction as jest.Mock;

const mockBooking = {
  id: "booking-1",
  userId: "user-1",
  amount: 5000,
  status: "pending",
};

const mockPayment = {
  id: "payment-1",
  bookingId: "booking-1",
  razorpayOrderId: "order_123",
  amount: 5000,
  status: "processing",
};

const mockPaymentWithBooking = {
  ...mockPayment,
  booking: {
    id: "booking-1",
    userId: "user-1",
    room: { hotel: { ownerId: "host-1" } },
  },
};

const mockBookingWithHotel = {
  ...mockBooking,
  room: {
    hotel: {
      ownerId: "host-1",
    },
  },
  checkIn: new Date("2026-04-01"),
  checkOut: new Date("2026-04-05"),
};

describe("paymentService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockPublishEvent.mockResolvedValue(undefined);

    prismaTransaction.mockImplementation(async (input: unknown) => {
      if (typeof input === "function") {
        return input({
          booking: {
            findUnique: bookingFindUnique,
            update: prisma.booking.update,
          },
          payment: {
            findUnique: paymentFindUnique,
            upsert: paymentUpsert,
            update: paymentUpdate,
            updateMany: paymentUpdateMany,
          },
          bookingHistory: {
            create: bookingHistoryCreate,
          },
          $queryRaw: jest.fn().mockResolvedValue(undefined),
        });
      }
      return [];
    });
  });

  describe("reprocessStalePayments", () => {
    it("should reject non-admin actor", async () => {
      userFindUnique.mockResolvedValue({ id: "user-1", role: "guest" });

      await expect(
        paymentService.reprocessStalePayments("user-1"),
      ).rejects.toThrow(
        new AppError("Only admins can reprocess stale payments", 403),
      );
    });

    it("should dry-run stale processing payments without updates", async () => {
      userFindUnique.mockResolvedValue({ id: "admin-1", role: "admin" });
      paymentFindMany.mockResolvedValue([
        {
          id: "payment-1",
          bookingId: "booking-1",
          amount: 5000,
          updatedAt: new Date("2026-03-15T10:00:00.000Z"),
        },
      ]);

      const result = await paymentService.reprocessStalePayments("admin-1", {
        olderThanMinutes: 15,
        dryRun: true,
      });

      expect(result.dryRun).toBe(true);
      expect(result.scanned).toBe(1);
      expect(result.candidates).toHaveLength(1);
      expect(paymentUpdateMany).not.toHaveBeenCalled();
      expect(bookingHistoryCreate).not.toHaveBeenCalled();
    });

    it("should mark stale processing payments as failed and write audit log", async () => {
      userFindUnique.mockResolvedValue({ id: "admin-1", role: "admin" });
      paymentFindMany.mockResolvedValue([
        {
          id: "payment-1",
          bookingId: "booking-1",
          amount: 5000,
          updatedAt: new Date("2026-03-15T10:00:00.000Z"),
        },
      ]);
      bookingFindUnique.mockResolvedValue({ status: "pending" });
      paymentUpdateMany.mockResolvedValue({ count: 1 });

      const result = await paymentService.reprocessStalePayments("admin-1", {
        olderThanMinutes: 10,
      });

      expect(result.processedCount).toBe(1);
      expect(result.skippedCount).toBe(0);
      expect(paymentUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: "payment-1" }),
          data: { status: "failed" },
        }),
      );
      expect(bookingHistoryCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId: "booking-1",
            updatedBy: expect.stringContaining("system:payment-reprocessor"),
          }),
        }),
      );
      expect(mockPublishEvent).toHaveBeenCalledWith(
        "payment.failed",
        expect.objectContaining({
          paymentId: "payment-1",
          reason: "stale_processing_timeout",
        }),
      );
    });
  });

  describe("createOrder", () => {
    it("should create a razorpay order and upsert a payment record", async () => {
      bookingFindUnique.mockResolvedValue(mockBooking);
      paymentFindUnique.mockResolvedValue(null);
      mockOrdersCreate.mockResolvedValue({ id: "order_123", amount: 500000 });
      paymentUpsert.mockResolvedValue(mockPayment);

      const result = await paymentService.createOrder("user-1", "booking-1");

      expect(bookingFindUnique).toHaveBeenCalledWith({
        where: { id: "booking-1" },
      });
      expect(mockOrdersCreate).toHaveBeenCalledWith({
        amount: 500000, // 5000 * 100
        currency: "INR",
        receipt: "booking-1",
        notes: { bookingId: "booking-1" },
      });
      expect(paymentUpsert).toHaveBeenCalled();
      expect(result.order.id).toBe("order_123");
    });

    it("should throw AppError(404) when booking not found", async () => {
      bookingFindUnique.mockResolvedValue(null);

      await expect(
        paymentService.createOrder("user-1", "booking-1"),
      ).rejects.toThrow(new AppError("Booking not found", 404));
    });

    it("should throw AppError(403) when user is not the booking owner", async () => {
      bookingFindUnique.mockResolvedValue(mockBooking);

      await expect(
        paymentService.createOrder("other-user", "booking-1"),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });

    it("should return idempotent result when completed payment already exists", async () => {
      bookingFindUnique.mockResolvedValue(mockBooking);
      paymentFindUnique.mockResolvedValue({
        ...mockPayment,
        status: "completed",
      });

      const result = await paymentService.createOrder("user-1", "booking-1");

      expect(result.idempotent).toBe(true);
      expect(result.order).toBeNull();
      expect(mockOrdersCreate).not.toHaveBeenCalled();
    });

    it("should return queued idempotent result when processing payment already has order", async () => {
      bookingFindUnique.mockResolvedValue(mockBooking);
      paymentFindUnique.mockResolvedValue(mockPayment);

      const result = await paymentService.createOrder("user-1", "booking-1");

      expect(result.idempotent).toBe(true);
      expect(result.order).toEqual(
        expect.objectContaining({ id: "order_123", queued: true }),
      );
      expect(mockOrdersCreate).not.toHaveBeenCalled();
    });
  });

  describe("handleWebhook", () => {
    const secret = "test_secret";

    const buildWebhookBody = (
      event: string,
      orderId: string,
      paymentId: string,
    ) =>
      JSON.stringify({
        event,
        payload: {
          payment: {
            entity: { id: paymentId, order_id: orderId },
          },
        },
      });

    const makeSignature = (body: string) =>
      crypto.createHmac("sha256", secret).update(body).digest("hex");

    it("should throw AppError(400) when signature is missing", async () => {
      await expect(
        paymentService.handleWebhook(undefined, "{}"),
      ).rejects.toThrow(new AppError("Missing webhook signature", 400));
    });

    it("should throw AppError(400) when signature is invalid", async () => {
      await expect(
        paymentService.handleWebhook(
          "bad_signature",
          '{"event":"payment.captured"}',
        ),
      ).rejects.toThrow(new AppError("Invalid webhook signature", 400));
    });

    it("should return ignored:true when no orderId in payload", async () => {
      const body = JSON.stringify({ event: "payment.captured", payload: {} });
      const sig = makeSignature(body);

      const result = await paymentService.handleWebhook(sig, body);

      expect(result).toEqual({ ok: true, ignored: true });
    });

    it("should return ignored:true when payment record not found", async () => {
      const body = buildWebhookBody(
        "payment.captured",
        "order_unknown",
        "pay_1",
      );
      const sig = makeSignature(body);
      paymentFindFirst.mockResolvedValue(null);

      const result = await paymentService.handleWebhook(sig, body);

      expect(result).toEqual({ ok: true, ignored: true });
    });

    it("should update payment to completed and booking to confirmed on payment.captured", async () => {
      const body = buildWebhookBody("payment.captured", "order_123", "pay_abc");
      const sig = makeSignature(body);
      paymentFindFirst.mockResolvedValue(mockPayment);
      paymentFindUnique.mockResolvedValue(mockPayment);
      paymentUpdate.mockResolvedValue({
        ...mockPayment,
        status: "completed",
        razorpayPaymentId: "pay_abc",
      });
      // Setup fire-and-forget mock to avoid unhandled promise
      bookingFindUnique.mockResolvedValue(null);

      const result = await paymentService.handleWebhook(sig, body);

      expect(prismaTransaction).toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it("should return idempotent true for duplicate payment.captured event", async () => {
      const body = buildWebhookBody("payment.captured", "order_123", "pay_abc");
      const sig = makeSignature(body);
      paymentFindFirst.mockResolvedValue({
        ...mockPayment,
        status: "completed",
      });
      paymentFindUnique.mockResolvedValue({
        ...mockPayment,
        status: "completed",
      });

      const result = await paymentService.handleWebhook(sig, body);

      expect(result).toEqual({ ok: true, idempotent: true });
      expect(prismaTransaction).toHaveBeenCalled();
    });

    it("should update payment to failed on payment.failed", async () => {
      const body = buildWebhookBody("payment.failed", "order_123", "pay_abc");
      const sig = makeSignature(body);
      paymentFindFirst.mockResolvedValue(mockPayment);
      paymentUpdateMany.mockResolvedValue({ count: 1 });
      bookingFindUnique.mockResolvedValue(null); // fire-and-forget

      const result = await paymentService.handleWebhook(sig, body);

      expect(paymentUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "failed" } }),
      );
      expect(result).toEqual({ ok: true });
    });
  });

  describe("getById", () => {
    it("should return the payment record", async () => {
      paymentFindUnique.mockResolvedValue(mockPayment);

      const result = await paymentService.getById("payment-1");

      expect(result).toEqual(mockPayment);
    });

    it("should throw AppError(404) when payment not found", async () => {
      paymentFindUnique.mockResolvedValue(null);

      await expect(paymentService.getById("nonexistent")).rejects.toThrow(
        new AppError("Payment not found", 404),
      );
    });
  });

  describe("getByBooking", () => {
    it("should return the payment for the given booking", async () => {
      bookingFindUnique.mockResolvedValue({
        ...mockBooking,
        room: { hotel: { ownerId: "host-1" } },
      });
      paymentFindUnique.mockResolvedValue(mockPayment);

      const result = await paymentService.getByBooking("user-1", "booking-1");

      expect(paymentFindUnique).toHaveBeenCalledWith({
        where: { bookingId: "booking-1" },
      });
      expect(result).toEqual(mockPayment);
    });

    it("should throw AppError(403) when user has no booking access", async () => {
      bookingFindUnique.mockResolvedValue({
        ...mockBooking,
        room: { hotel: { ownerId: "host-1" } },
      });

      await expect(
        paymentService.getByBooking("other-user", "booking-1"),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });

    it("should throw AppError(404) when payment not found", async () => {
      bookingFindUnique.mockResolvedValue({
        ...mockBooking,
        room: { hotel: { ownerId: "host-1" } },
      });
      paymentFindUnique.mockResolvedValue(null);

      await expect(
        paymentService.getByBooking("user-1", "booking-1"),
      ).rejects.toThrow(new AppError("Payment not found", 404));
    });
  });

  describe("chargeback lifecycle mock", () => {
    it("should create a chargeback case", async () => {
      paymentFindUnique.mockResolvedValue(mockPaymentWithBooking);
      chargebackFindFirst.mockResolvedValue(null);
      chargebackCreate.mockResolvedValue({
        id: "cb-1",
        userId: "user-1",
        paymentId: "payment-1",
        reason: "Cardholder dispute",
        evidenceUrls: JSON.stringify(["https://cdn.example.com/evidence.png"]),
        status: "submitted",
        timeline: JSON.stringify([]),
        payment: { bookingId: "booking-1" },
      });

      const result = await paymentService.createChargebackCase(
        "user-1",
        "payment-1",
        "Cardholder dispute",
        ["https://cdn.example.com/evidence.png"],
      );

      expect(result.id).toBe("cb-1");
      expect(result.status).toBe("submitted");
    });

    it("should list chargeback cases", async () => {
      chargebackFindMany.mockResolvedValue([
        {
          id: "cb-1",
          paymentId: "payment-1",
          reason: "Cardholder dispute",
          evidenceUrls: "[]",
          status: "under_review",
          timeline: "[]",
          payment: { bookingId: "booking-1", status: "completed" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await paymentService.listChargebackCases("user-1");

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("under_review");
    });

    it("should advance chargeback status with valid transition", async () => {
      chargebackFindUnique.mockResolvedValue({
        id: "cb-1",
        userId: "user-1",
        evidenceUrls: "[]",
        status: "submitted",
        timeline: JSON.stringify([]),
      });
      chargebackUpdate.mockResolvedValue({
        id: "cb-1",
        userId: "user-1",
        paymentId: "payment-1",
        reason: "Cardholder dispute",
        evidenceUrls: "[]",
        status: "under_review",
        timeline: JSON.stringify([]),
      });

      const result = await paymentService.advanceChargebackCase(
        "user-1",
        "cb-1",
        "under_review",
        "Received by disputes team",
      );

      expect(result.status).toBe("under_review");
      expect(chargebackUpdate).toHaveBeenCalled();
    });

    it("should reject invalid chargeback transition", async () => {
      chargebackFindUnique.mockResolvedValue({
        id: "cb-1",
        userId: "user-1",
        evidenceUrls: "[]",
        status: "resolved_won",
        timeline: JSON.stringify([]),
      });

      await expect(
        paymentService.advanceChargebackCase("user-1", "cb-1", "under_review"),
      ).rejects.toThrow(
        new AppError("Invalid chargeback status transition", 400),
      );
    });
  });

  describe("generateTaxInvoice", () => {
    it("should generate invoice mock for authorized user", async () => {
      bookingFindUnique.mockResolvedValue(mockBookingWithHotel);
      paymentFindUnique.mockResolvedValue({
        ...mockPayment,
        status: "completed",
        razorpayPaymentId: "pay_1",
      });
      taxInvoiceFindFirst.mockResolvedValue(null);
      taxInvoiceCreate.mockResolvedValue({
        id: "inv-1",
        invoiceNumber: "INV-123",
        currency: "INR",
        lineItems: JSON.stringify([
          { code: "stay_charge", amount: 4237.29 },
          { code: "tax", amount: 762.71 },
        ]),
        subtotal: 4237.29,
        tax: 762.71,
        total: 5000,
        regime: "IN_GST",
      });

      const result = await paymentService.generateTaxInvoice(
        "user-1",
        "booking-1",
      );

      expect(result.invoiceNumber).toContain("INV-");
      expect(result.total).toBe(5000);
      expect(result.lineItems).toHaveLength(2);
      expect(result.regime).toBe("IN_GST");
    });

    it("should reject unauthorized invoice access", async () => {
      bookingFindUnique.mockResolvedValue(mockBookingWithHotel);

      await expect(
        paymentService.generateTaxInvoice("other-user", "booking-1"),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });
  });
});
