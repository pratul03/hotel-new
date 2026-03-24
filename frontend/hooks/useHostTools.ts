"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import {
  CoHostAssignment,
  HostAnalytics,
  HostCancellationPolicy,
  HostClaim,
  HotelComplianceChecklist,
  HotelListingQuality,
  QuickReplyTemplate,
  ScheduledMessage,
} from "@/types/host-tools";

type Wrapped<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export function useCancellationPolicy(hotelId: string) {
  return useQuery({
    queryKey: ["host-tools", "cancellation", hotelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<
        Wrapped<HostCancellationPolicy | null>
      >(`/host/tools/hotels/${hotelId}/cancellation-policy`);
      return data.data;
    },
    enabled: !!hotelId,
  });
}

export function useUpsertCancellationPolicy(hotelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Omit<HostCancellationPolicy, "id" | "hotelId">,
    ) => {
      const { data } = await axiosInstance.put<Wrapped<HostCancellationPolicy>>(
        `/host/tools/hotels/${hotelId}/cancellation-policy`,
        payload,
      );
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["host-tools", "cancellation", hotelId],
      }),
  });
}

export function useQuickReplies() {
  return useQuery({
    queryKey: ["host-tools", "quick-replies"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<Wrapped<QuickReplyTemplate[]>>(
        "/host/tools/quick-replies",
      );
      return data.data;
    },
  });
}

export function useCreateQuickReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      content: string;
      category?: string;
    }) => {
      const { data } = await axiosInstance.post<Wrapped<QuickReplyTemplate>>(
        "/host/tools/quick-replies",
        payload,
      );
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["host-tools", "quick-replies"] }),
  });
}

export function useDeleteQuickReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosInstance.delete(
        `/host/tools/quick-replies/${id}`,
      );
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["host-tools", "quick-replies"] }),
  });
}

export function useScheduledMessages() {
  return useQuery({
    queryKey: ["host-tools", "scheduled"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<Wrapped<ScheduledMessage[]>>(
        "/host/tools/scheduled-messages",
      );
      return data.data;
    },
  });
}

export function useCreateScheduledMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      receiverUserId: string;
      bookingId?: string;
      content: string;
      sendAt: string;
    }) => {
      const { data } = await axiosInstance.post<Wrapped<ScheduledMessage>>(
        "/host/tools/scheduled-messages",
        payload,
      );
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["host-tools", "scheduled"] }),
  });
}

export function useCancelScheduledMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosInstance.post(
        `/host/tools/scheduled-messages/${id}/cancel`,
        {},
      );
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["host-tools", "scheduled"] }),
  });
}

export function useHostAnalytics(days = 30) {
  return useQuery({
    queryKey: ["host-tools", "analytics", days],
    queryFn: async () => {
      const { data } = await axiosInstance.get<Wrapped<HostAnalytics>>(
        "/host/tools/analytics",
        { params: { days } },
      );
      return data.data;
    },
  });
}

export function useCoHosts(hotelId: string) {
  return useQuery({
    queryKey: ["host-tools", "cohosts", hotelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<Wrapped<CoHostAssignment[]>>(
        `/host/tools/hotels/${hotelId}/cohosts`,
      );
      return data.data;
    },
    enabled: !!hotelId,
  });
}

export function useAddCoHost(hotelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      cohostUserId: string;
      permissions?: string[];
      revenueSplitPercent?: number;
    }) => {
      const { data } = await axiosInstance.post<Wrapped<CoHostAssignment>>(
        `/host/tools/hotels/${hotelId}/cohosts`,
        payload,
      );
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["host-tools", "cohosts", hotelId] }),
  });
}

export function useRemoveCoHost(hotelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { data } = await axiosInstance.delete(
        `/host/tools/hotels/${hotelId}/cohosts/${assignmentId}`,
      );
      return data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["host-tools", "cohosts", hotelId] }),
  });
}

export function useComplianceChecklist(hotelId: string) {
  return useQuery({
    queryKey: ["host-tools", "compliance", hotelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<
        Wrapped<HotelComplianceChecklist | null>
      >(`/host/tools/hotels/${hotelId}/compliance-checklist`);
      return data.data;
    },
    enabled: !!hotelId,
  });
}

export function useUpsertComplianceChecklist(hotelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      jurisdictionCode: string;
      checklistItems: Array<{ label: string; completed: boolean }>;
      status?: "incomplete" | "in_review" | "completed";
    }) => {
      const { data } = await axiosInstance.put<
        Wrapped<HotelComplianceChecklist>
      >(`/host/tools/hotels/${hotelId}/compliance-checklist`, payload);
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["host-tools", "compliance", hotelId] }),
  });
}

export function useHostClaims() {
  return useQuery({
    queryKey: ["host-tools", "claims"],
    queryFn: async () => {
      const { data } =
        await axiosInstance.get<Wrapped<HostClaim[]>>("/host/tools/claims");
      return data.data;
    },
  });
}

export function useCreateHostClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      hotelId: string;
      bookingId: string;
      title: string;
      description: string;
      amountClaimed?: number;
      evidenceUrls?: string[];
    }) => {
      const { data } = await axiosInstance.post<Wrapped<HostClaim>>(
        "/host/tools/claims",
        payload,
      );
      return data.data;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["host-tools", "claims"] }),
  });
}

export function useListingQuality(hotelId: string) {
  return useQuery({
    queryKey: ["host-tools", "listing-quality", hotelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<
        Wrapped<HotelListingQuality | null>
      >(`/host/tools/hotels/${hotelId}/listing-quality`);
      return data.data;
    },
    enabled: !!hotelId,
  });
}

export function useUpsertListingQuality(hotelId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      coverImageUrl?: string;
      guidebook?: string;
      houseManual?: string;
      checkInSteps?: string;
    }) => {
      const { data } = await axiosInstance.put<Wrapped<HotelListingQuality>>(
        `/host/tools/hotels/${hotelId}/listing-quality`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["host-tools", "listing-quality", hotelId],
      });
    },
  });
}
