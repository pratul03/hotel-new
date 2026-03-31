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
    supportTicket: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { supportService } from "../../domains/support/services/support.service";
import { prisma } from "../../config/database";
import { AppError } from "../../utils";

const ticketCreate = prisma.supportTicket.create as jest.Mock;
const ticketFindMany = prisma.supportTicket.findMany as jest.Mock;
const ticketFindUnique = prisma.supportTicket.findUnique as jest.Mock;
const ticketUpdate = prisma.supportTicket.update as jest.Mock;

const mockTicket = {
  id: "ticket-1",
  userId: "user-1",
  subject: "Issue with my booking",
  description: "Payment failed but money deducted",
  priority: "high",
  status: "open",
};

describe("supportService", () => {
  describe("createTicket", () => {
    it("should create a support ticket", async () => {
      ticketCreate.mockResolvedValue(mockTicket);

      const result = await supportService.createTicket(
        "user-1",
        "Issue with my booking",
        "Payment failed but money deducted",
        "high",
      );

      expect(ticketCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            subject: "Issue with my booking",
          }),
        }),
      );
      expect(result).toEqual(mockTicket);
    });
  });

  describe("getTickets", () => {
    it("should return all user's tickets", async () => {
      ticketFindMany.mockResolvedValue([mockTicket]);

      const result = await supportService.getTickets("user-1");

      expect(ticketFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: "user-1" } }),
      );
      expect(result).toEqual([mockTicket]);
    });
  });

  describe("getTicket", () => {
    it("should return the ticket when it belongs to the user", async () => {
      ticketFindUnique.mockResolvedValue(mockTicket);

      const result = await supportService.getTicket("user-1", "ticket-1");

      expect(result).toEqual(mockTicket);
    });

    it("should throw AppError(404) when ticket not found", async () => {
      ticketFindUnique.mockResolvedValue(null);

      await expect(
        supportService.getTicket("user-1", "nonexistent"),
      ).rejects.toThrow(new AppError("Ticket not found", 404));
    });

    it("should throw AppError(404) when ticket belongs to another user", async () => {
      ticketFindUnique.mockResolvedValue(mockTicket);

      await expect(
        supportService.getTicket("other-user", "ticket-1"),
      ).rejects.toThrow(new AppError("Ticket not found", 404));
    });
  });

  describe("replyToTicket", () => {
    it("should update the ticket with a reply", async () => {
      ticketFindUnique.mockResolvedValue(mockTicket);
      const updated = {
        ...mockTicket,
        reply: "We are looking into it.",
        status: "in_progress",
      };
      ticketUpdate.mockResolvedValue(updated);

      const result = await supportService.replyToTicket(
        "user-1",
        "ticket-1",
        "We are looking into it.",
      );

      expect(ticketUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { reply: "We are looking into it.", status: "in_progress" },
        }),
      );
      expect(result).toEqual(updated);
    });

    it("should throw AppError(404) when ticket not found", async () => {
      ticketFindUnique.mockResolvedValue(null);

      await expect(
        supportService.replyToTicket("user-1", "ticket-1", "reply"),
      ).rejects.toThrow(new AppError("Ticket not found", 404));
    });
  });

  describe("escalateEmergencyTicket", () => {
    it("should update escalation stage for emergency ticket", async () => {
      ticketFindUnique.mockResolvedValue({
        id: "ticket-1",
        userId: "user-1",
        subject: "Emergency safety request",
        reply: null,
      });
      ticketUpdate.mockResolvedValue({
        id: "ticket-1",
        userId: "user-1",
        subject: "Emergency safety request",
        status: "in_progress",
        reply: "[escalation_stage]active_response|Agent connected",
      });

      const result = await supportService.escalateEmergencyTicket(
        "user-1",
        "ticket-1",
        "active_response",
        "Agent connected",
      );

      expect(ticketUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "in_progress" }),
        }),
      );
      expect(result.escalationStage).toBe("active_response");
    });

    it("should throw AppError(400) when ticket is not emergency type", async () => {
      ticketFindUnique.mockResolvedValue({
        id: "ticket-1",
        userId: "user-1",
        subject: "General support",
      });

      await expect(
        supportService.escalateEmergencyTicket(
          "user-1",
          "ticket-1",
          "active_response",
        ),
      ).rejects.toThrow(
        new AppError("Only emergency tickets can be escalated", 400),
      );
    });
  });
});
