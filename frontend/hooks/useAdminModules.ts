"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bookingAdminService,
  financeAdminService,
  inventoryAdminService,
  supportAdminService,
} from "@/lib/admin/AdminServices";

export function useAdminInventorySnapshot(limit = 200) {
  return useQuery({
    queryKey: ["admin", "inventory", { limit }],
    queryFn: () => inventoryAdminService.getInventorySnapshot(limit),
  });
}

export function useAdminPromotions() {
  return useQuery({
    queryKey: ["admin", "promotions"],
    queryFn: async () => {
      const [rules, inventory] = await Promise.all([
        inventoryAdminService.getPromotions(),
        inventoryAdminService.getInventorySnapshot(),
      ]);

      return {
        rules,
        hotels: inventory.hotels,
      };
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => inventoryAdminService.getAdminUsers({ limit: 200, page: 1 }),
  });
}

export function useAdminVerificationQueue() {
  return useQuery({
    queryKey: ["admin", "verifications"],
    queryFn: () => inventoryAdminService.getVerificationQueue(200),
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      userId: string;
      input: {
        role?: "guest" | "host" | "admin";
        verified?: boolean;
        superhost?: boolean;
      };
    }) => inventoryAdminService.updateAdminUser(params.userId, params.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
  });
}

export function useAdminBookingCases() {
  return useQuery({
    queryKey: ["admin", "booking-cases"],
    queryFn: () => bookingAdminService.getBookingCaseRows(),
  });
}

export function useAdminSupportRoutingConsole(days = 7) {
  return useQuery({
    queryKey: ["admin", "support", "routing", { days }],
    queryFn: () => supportAdminService.getRoutingConsole(days),
  });
}

export function useAdminSupportOpsDashboard(days = 30) {
  return useQuery({
    queryKey: ["admin", "support", "ops-dashboard", { days }],
    queryFn: () => supportAdminService.getOpsDashboard(days),
  });
}

export function useAdminAirCoverBoard() {
  return useQuery({
    queryKey: ["admin", "support", "air-cover"],
    queryFn: () => supportAdminService.getAirCoverBoard(),
  });
}

export function useAdminEscalateSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      ticketId: string;
      stage:
        | "pending_contact"
        | "active_response"
        | "local_authority_notified"
        | "follow_up"
        | "closed";
      notes?: string;
    }) => supportAdminService.escalateSupportTicket(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "support", "routing"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "support", "air-cover"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "support", "ops-dashboard"],
      });
    },
  });
}

export function useAdminUpdateIncidentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      incidentId: string;
      status: "open" | "investigating" | "resolved" | "closed";
      resolution?: string;
    }) => supportAdminService.updateIncidentStatus(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "booking-cases"] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "support", "routing"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "support", "air-cover"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "support", "ops-dashboard"],
      });
    },
  });
}

export function useAdminResolveIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { incidentId: string; resolution: string }) =>
      supportAdminService.resolveIncident(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "booking-cases"] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "support", "routing"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "support", "air-cover"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "support", "ops-dashboard"],
      });
    },
  });
}

export function useAdminPaymentQueueSummary() {
  return useQuery({
    queryKey: ["admin", "finance", "payment-queue"],
    queryFn: () => financeAdminService.getPaymentQueueSummary(),
  });
}

export function useAdminFxRates() {
  return useQuery({
    queryKey: ["admin", "finance", "fx-rates"],
    queryFn: () => financeAdminService.getFxRates(),
  });
}

export function useAdminUpsertFxRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      baseCurrency: string;
      quoteCurrency: string;
      rate: number;
      provider?: string;
    }) => financeAdminService.upsertFxRate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "finance", "fx-rates"],
      });
    },
  });
}

export function useAdminReprocessStalePayments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      olderThanMinutes?: number;
      limit?: number;
      dryRun?: boolean;
    }) => financeAdminService.reprocessStalePayments(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "finance", "payment-queue"],
      });
    },
  });
}
