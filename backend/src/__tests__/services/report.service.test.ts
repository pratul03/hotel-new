jest.mock("../../config/environment", () => ({
  env: {
    JWT_SECRET: "test_jwt_secret",
    JWT_EXPIRE: "7d",
    PORT: 3000,
    DATABASE_URL: "postgresql://test",
    REDIS_URL: "redis://localhost",
    MINIO_ENDPOINT: "localhost",
    MINIO_PORT: 9000,
    RAZORPAY_KEY_ID: "test_key",
    RAZORPAY_KEY_SECRET: "test_secret",
    MINIO_BUCKET_PREFIX: "airbnb",
  },
}));

jest.mock("../../config/database", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    incidentReport: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { reportService } from "../../domains/reports/services/reports.service";
import { prisma } from "../../config/database";
import { AppError } from "../../utils";

const incidentCreate = prisma.incidentReport.create as jest.Mock;
const incidentFindMany = prisma.incidentReport.findMany as jest.Mock;
const incidentFindUnique = prisma.incidentReport.findUnique as jest.Mock;
const incidentUpdate = prisma.incidentReport.update as jest.Mock;
const userFindUnique = prisma.user.findUnique as jest.Mock;

const mockIncident = {
  id: "incident-1",
  bookingId: "booking-1",
  reportedByUserId: "user-1",
  description: "Property damage",
  status: "open",
  resolution: null,
  booking: {
    userId: "user-1",
    room: { hotel: { ownerId: "host-1" } },
  },
};

describe("reportService", () => {
  describe("reportIncident", () => {
    it("should create an incident report", async () => {
      incidentCreate.mockResolvedValue(mockIncident);

      const result = await reportService.reportIncident(
        "user-1",
        "booking-1",
        "Property damage",
      );

      expect(incidentCreate).toHaveBeenCalledWith({
        data: {
          bookingId: "booking-1",
          reportedByUserId: "user-1",
          description: "Property damage",
        },
      });
      expect(result).toEqual(mockIncident);
    });
  });

  describe("getIncident", () => {
    it("should return incident when user is the reporter", async () => {
      incidentFindUnique.mockResolvedValue(mockIncident);

      const result = await reportService.getIncident("user-1", "incident-1");

      expect(result).toEqual(mockIncident);
    });

    it("should return incident when user is the hotel owner", async () => {
      incidentFindUnique.mockResolvedValue(mockIncident);

      const result = await reportService.getIncident("host-1", "incident-1");

      expect(result).toEqual(mockIncident);
    });

    it("should throw AppError(404) when incident not found", async () => {
      incidentFindUnique.mockResolvedValue(null);

      await expect(
        reportService.getIncident("user-1", "nonexistent"),
      ).rejects.toThrow(new AppError("Incident not found", 404));
    });

    it("should throw AppError(403) when user has no access to the incident", async () => {
      incidentFindUnique.mockResolvedValue(mockIncident);

      await expect(
        reportService.getIncident("outsider", "incident-1"),
      ).rejects.toThrow(new AppError("Unauthorized", 403));
    });
  });

  describe("resolveIncident", () => {
    it("should resolve incident when called by admin", async () => {
      userFindUnique.mockResolvedValue({ id: "admin-1", role: "admin" });
      const resolved = {
        ...mockIncident,
        status: "resolved",
        resolution: "Refund issued",
      };
      incidentUpdate.mockResolvedValue(resolved);

      const result = await reportService.resolveIncident(
        "admin-1",
        "incident-1",
        "Refund issued",
      );

      expect(incidentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "resolved",
            resolution: "Refund issued",
          }),
        }),
      );
      expect(result).toEqual(resolved);
    });

    it("should throw AppError(403) when user is not admin", async () => {
      userFindUnique.mockResolvedValue({ id: "user-1", role: "guest" });

      await expect(
        reportService.resolveIncident("user-1", "incident-1", "resolution"),
      ).rejects.toThrow(new AppError("Only admin can resolve incidents", 403));
    });

    it("should throw AppError(403) when user not found", async () => {
      userFindUnique.mockResolvedValue(null);

      await expect(
        reportService.resolveIncident(
          "nonexistent",
          "incident-1",
          "resolution",
        ),
      ).rejects.toThrow(new AppError("Only admin can resolve incidents", 403));
    });
  });

  describe("listIncidents", () => {
    it("should list incidents for admin with provided filters", async () => {
      userFindUnique.mockResolvedValue({ id: "admin-1", role: "admin" });
      incidentFindMany.mockResolvedValue([mockIncident]);

      const result = await reportService.listIncidents("admin-1", {
        status: "open",
        bookingId: "booking-1",
      });

      expect(incidentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "open",
            bookingId: "booking-1",
          }),
        }),
      );
      expect(result).toEqual([mockIncident]);
    });

    it("should throw AppError(403) when actor is missing", async () => {
      userFindUnique.mockResolvedValue(null);

      await expect(reportService.listIncidents("missing-user")).rejects.toThrow(
        new AppError("Unauthorized", 403),
      );
    });
  });

  describe("updateIncidentStatus", () => {
    it("should update status when host owns incident booking hotel", async () => {
      userFindUnique.mockResolvedValue({ id: "host-1", role: "host" });
      incidentFindUnique.mockResolvedValue(mockIncident);
      incidentUpdate.mockResolvedValue({
        ...mockIncident,
        status: "investigating",
      });

      const result = await reportService.updateIncidentStatus(
        "host-1",
        "incident-1",
        "investigating",
      );

      expect(incidentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "incident-1" },
          data: expect.objectContaining({
            status: "investigating",
          }),
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({ status: "investigating" }),
      );
    });

    it("should require resolution when status is resolved", async () => {
      userFindUnique.mockResolvedValue({ id: "admin-1", role: "admin" });
      incidentFindUnique.mockResolvedValue(mockIncident);

      await expect(
        reportService.updateIncidentStatus("admin-1", "incident-1", "resolved"),
      ).rejects.toThrow(
        new AppError("Resolution is required when resolving incident", 400),
      );
    });

    it("should throw AppError(403) for unrelated non-admin user", async () => {
      userFindUnique.mockResolvedValue({ id: "user-2", role: "host" });
      incidentFindUnique.mockResolvedValue(mockIncident);

      await expect(
        reportService.updateIncidentStatus(
          "user-2",
          "incident-1",
          "closed",
          "Done",
        ),
      ).rejects.toThrow(
        new AppError("Only admin or host can update incident status", 403),
      );
    });
  });
});
