"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { Notification } from "@/types/notification";
import type { PaginatedResponse } from "@/types/api";

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
  booking: boolean;
  message: boolean;
  payment: boolean;
  marketing: boolean;
}

export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["notifications", { page, limit }],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginatedResponse<Notification>>(
        "/notifications",
        {
          params: { page, limit },
        },
      );
      return data;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ data: { count: number } }>(
        "/notifications/unread-count",
      );
      return data.data.count;
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await axiosInstance.patch("/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{
        data: NotificationPreferences;
      }>("/notifications/preferences");
      return data.data;
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<NotificationPreferences>) => {
      const { data } = await axiosInstance.put(
        "/notifications/preferences",
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", "preferences"],
      });
    },
  });
}
