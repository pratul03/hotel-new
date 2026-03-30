jest.mock("../../config/environment", () => ({
  env: {
    JWT_SECRET: "test_jwt_secret",
    JWT_EXPIRE: "7d",
    PORT: 3000,
    DATABASE_URL: "postgresql://test",
    REDIS_URL: "redis://localhost",
    MINIO_ENDPOINT: "localhost",
    MINIO_PORT: 9000,
    MINIO_BUCKET_PREFIX: "airbnb",
    RAZORPAY_KEY_ID: "test_key",
    RAZORPAY_KEY_SECRET: "test_secret",
  },
}));

const mockMinioClient = {
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
  putObject: jest.fn(),
  getObject: jest.fn(),
  presignedGetObject: jest.fn(),
  statObject: jest.fn(),
};

jest.mock("../../config/minio", () => ({
  getMinioClient: jest.fn().mockReturnValue(mockMinioClient),
}));

const mockPdf = jest.fn();
const mockSetContent = jest.fn();
const mockNewPage = jest.fn().mockResolvedValue({
  setContent: mockSetContent,
  pdf: mockPdf,
});
const mockClose = jest.fn();
const mockLaunch = jest.fn().mockResolvedValue({
  newPage: mockNewPage,
  close: mockClose,
});

jest.mock("puppeteer", () => ({
  __esModule: true,
  default: {
    launch: mockLaunch,
  },
}));

jest.mock("../../config/database", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
    },
    invoiceDocument: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { Readable } from "stream";
import { invoicingService } from "../../modules/invoices/services/invoicing.service";
import { prisma } from "../../config/database";
import { AppError } from "../../utils";

const userFindUnique = prisma.user.findUnique as jest.Mock;
const bookingFindUnique = prisma.booking.findUnique as jest.Mock;
const paymentFindUnique = prisma.payment.findUnique as jest.Mock;
const invoiceFindFirst = prisma.invoiceDocument.findFirst as jest.Mock;
const invoiceCreate = prisma.invoiceDocument.create as jest.Mock;
const invoiceFindMany = prisma.invoiceDocument.findMany as jest.Mock;
const invoiceFindUnique = prisma.invoiceDocument.findUnique as jest.Mock;
const invoiceUpdate = prisma.invoiceDocument.update as jest.Mock;

describe("invoicingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPdf.mockResolvedValue(Buffer.from("pdf-binary"));
    mockMinioClient.bucketExists.mockResolvedValue(true);
    mockMinioClient.putObject.mockResolvedValue(undefined);
    mockMinioClient.makeBucket.mockResolvedValue(undefined);
    mockMinioClient.presignedGetObject.mockResolvedValue("https://signed-url");
    mockMinioClient.statObject.mockResolvedValue({ etag: "ok" });
    mockMinioClient.getObject.mockResolvedValue(
      Readable.from(Buffer.from("stored-pdf")),
    );
  });

  it("should audit storage and report missing objects in dry-run mode", async () => {
    userFindUnique.mockResolvedValue({ id: "admin-1", role: "admin" });
    invoiceFindMany.mockResolvedValue([
      {
        id: "invdoc-1",
        userId: "guest-1",
        documentNumber: "OTH-100",
        title: "General Receipt",
        type: "other",
        status: "issued",
        currency: "INR",
        amount: 1200,
        fileUrl: "/api/v1/invoices/invdoc-1/pdf",
        storageBucket: "airbnb-invoices",
        storageKey: "invoices/2026/invdoc-1/OTH-100.pdf",
        lineItems: "[]",
        metadata: "{}",
        issuedAt: new Date("2026-03-15T12:00:00.000Z"),
      },
    ]);
    mockMinioClient.statObject.mockRejectedValue(new Error("missing"));

    const result = await invoicingService.auditStorageHealth("admin-1", {
      dryRun: true,
      repairMissing: true,
    });

    expect(result.scanned).toBe(1);
    expect(result.missingObjects).toBe(1);
    expect(result.repaired).toBe(0);
    expect(mockMinioClient.putObject).not.toHaveBeenCalled();
  });

  it("should repair missing object during storage audit", async () => {
    userFindUnique.mockResolvedValue({ id: "admin-1", role: "admin" });
    invoiceFindMany.mockResolvedValue([
      {
        id: "invdoc-1",
        userId: "guest-1",
        documentNumber: "OTH-100",
        title: "General Receipt",
        type: "other",
        status: "issued",
        currency: "INR",
        amount: 1200,
        fileUrl: "/api/v1/invoices/invdoc-1/pdf",
        storageBucket: "airbnb-invoices",
        storageKey: "invoices/2026/invdoc-1/OTH-100.pdf",
        lineItems: "[]",
        metadata: "{}",
        issuedAt: new Date("2026-03-15T12:00:00.000Z"),
      },
    ]);
    mockMinioClient.statObject.mockRejectedValue(new Error("missing"));
    invoiceUpdate.mockResolvedValue({});

    const result = await invoicingService.auditStorageHealth("admin-1", {
      repairMissing: true,
    });

    expect(result.repaired).toBe(1);
    expect(result.failedRepairs).toBe(0);
    expect(mockMinioClient.putObject).toHaveBeenCalled();
    expect(invoiceUpdate).toHaveBeenCalled();
  });

  it("should create payment receipt document and return stored invoice url", async () => {
    userFindUnique.mockResolvedValue({ id: "guest-1", role: "guest" });
    invoiceFindFirst.mockResolvedValue(null);
    paymentFindUnique.mockResolvedValue({
      id: "pay-1",
      amount: 5000,
      booking: {
        id: "booking-1",
        userId: "guest-1",
        amount: 5000,
        room: { hotel: { ownerId: "host-1" } },
      },
    });
    invoiceCreate.mockResolvedValue({
      id: "invdoc-1",
      userId: "guest-1",
      bookingId: "booking-1",
      paymentId: "pay-1",
      type: "payment",
      status: "issued",
      title: "Payment Receipt",
      documentNumber: "PAY-1",
      currency: "INR",
      amount: 5000,
      lineItems: "[]",
      metadata: "{}",
      issuedAt: new Date("2026-03-15T12:00:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-03-15T12:00:00.000Z"),
      updatedAt: new Date("2026-03-15T12:00:00.000Z"),
    });
    invoiceUpdate.mockResolvedValue({
      id: "invdoc-1",
      userId: "guest-1",
      bookingId: "booking-1",
      paymentId: "pay-1",
      type: "payment",
      status: "issued",
      title: "Payment Receipt",
      documentNumber: "PAY-1",
      currency: "INR",
      amount: 5000,
      fileUrl: "/api/v1/invoices/invdoc-1/pdf",
      storageBucket: "airbnb-invoices",
      storageKey: "invoices/2026/invdoc-1/PAY-1.pdf",
      lineItems: "[]",
      metadata: "{}",
      issuedAt: new Date("2026-03-15T12:00:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-03-15T12:00:00.000Z"),
      updatedAt: new Date("2026-03-15T12:00:00.000Z"),
    });

    const result = await invoicingService.createDocument("guest-1", {
      type: "payment",
      title: "Payment Receipt",
      paymentId: "pay-1",
    });

    expect(invoiceCreate).toHaveBeenCalled();
    expect(mockLaunch).toHaveBeenCalled();
    expect(mockMinioClient.putObject).toHaveBeenCalled();
    expect("fileName" in result && result.fileName.includes(".pdf")).toBe(true);
    expect(result.fileUrl).toBe("/api/v1/invoices/invdoc-1/pdf");
  });

  it("should throw unauthorized for booking managed by someone else", async () => {
    userFindUnique.mockResolvedValue({ id: "guest-1", role: "guest" });
    bookingFindUnique.mockResolvedValue({
      id: "booking-1",
      userId: "other-guest",
      room: { hotel: { ownerId: "other-host" } },
    });

    await expect(
      invoicingService.createDocument("guest-1", {
        type: "order",
        title: "Order Receipt",
        bookingId: "booking-1",
        amount: 2000,
      }),
    ).rejects.toThrow(new AppError("Unauthorized", 403));
  });

  it("should list only own documents for non-admin users", async () => {
    userFindUnique.mockResolvedValue({ id: "guest-1", role: "guest" });
    invoiceFindMany.mockResolvedValue([]);

    await invoicingService.listDocuments("guest-1", { type: "other" });

    expect(invoiceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "guest-1", type: "other" }),
      }),
    );
  });

  it("should return idempotent revoke when already revoked", async () => {
    userFindUnique.mockResolvedValue({ id: "admin-1", role: "admin" });
    invoiceFindUnique.mockResolvedValue({
      id: "invdoc-1",
      userId: "guest-1",
      status: "revoked",
      lineItems: "[]",
      metadata: "{}",
    });

    const result = await invoicingService.revokeDocument("admin-1", "invdoc-1");

    expect("idempotent" in result && result.idempotent).toBe(true);
    expect(invoiceUpdate).not.toHaveBeenCalled();
  });

  it("should generate pdf for an existing document", async () => {
    userFindUnique.mockResolvedValue({ id: "guest-1", role: "guest" });
    invoiceFindUnique.mockResolvedValue({
      id: "invdoc-1",
      userId: "guest-1",
      type: "other",
      status: "issued",
      title: "General Receipt",
      documentNumber: "OTH-100",
      currency: "INR",
      amount: 1200,
      fileUrl: "/api/v1/invoices/invdoc-1/pdf",
      storageBucket: "airbnb-invoices",
      storageKey: "invoices/2026/invdoc-1/OTH-100.pdf",
      lineItems: JSON.stringify([{ description: "Service fee", amount: 1200 }]),
      metadata: "{}",
      issuedAt: new Date("2026-03-15T12:00:00.000Z"),
    });

    const result = await invoicingService.getDocumentPdf("guest-1", "invdoc-1");

    expect(result.contentType).toBe("application/pdf");
    expect(result.fileName).toBe("OTH-100.pdf");
    expect(result.buffer).toEqual(Buffer.from("stored-pdf"));
  });

  it("should return signed access url for stored invoice document", async () => {
    userFindUnique.mockResolvedValue({ id: "guest-1", role: "guest" });
    invoiceFindUnique.mockResolvedValue({
      id: "invdoc-1",
      userId: "guest-1",
      fileUrl: "/api/v1/invoices/invdoc-1/pdf",
      storageBucket: "airbnb-invoices",
      storageKey: "invoices/2026/invdoc-1/OTH-100.pdf",
    });

    const result = await invoicingService.getDocumentAccessUrl(
      "guest-1",
      "invdoc-1",
      600,
    );

    expect(result.fileUrl).toBe("/api/v1/invoices/invdoc-1/pdf");
    expect(result.signedUrl).toBe("https://signed-url");
    expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
      "airbnb-invoices",
      "invoices/2026/invdoc-1/OTH-100.pdf",
      600,
    );
  });
});
