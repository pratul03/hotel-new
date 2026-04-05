"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { Booking, BookingDetail, CancellationPreview } from "@/types/booking";
import { PaginatedResponse } from "@/types/api";

export function useBookings(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ["bookings", { page, limit }],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginatedResponse<Booking>>(
        `/bookings`,
        {
          params: { page, limit },
        },
      );
      return data;
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get<BookingDetail>(
        `/bookings/${id}`,
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useHostBookings(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ["host-bookings", { page, limit }],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginatedResponse<Booking>>(
        `/bookings/host`,
        {
          params: { page, limit },
        },
      );
      return data;
    },
  });
}

export function useBookingCancellationPreview(id: string) {
  return useQuery({
    queryKey: ["booking-cancellation-preview", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{
        success: boolean;
        data: CancellationPreview;
      }>(`/bookings/${id}/cancellation-preview`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData: Partial<Booking>) => {
      const { data } = await axiosInstance.post<Booking>(
        "/bookings",
        bookingData,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosInstance.patch(`/bookings/${id}/cancel`, {});
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
    },
  });
}

export function useConfirmCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosInstance.post(
        `/bookings/${id}/confirm-checkin`,
        {},
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
    },
  });
}

export function useHostAcceptBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosInstance.post(
        `/bookings/${id}/host/accept`,
        {},
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
    },
  });
}

export function useHostDeclineBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; reason?: string }) => {
      const { data } = await axiosInstance.post(
        `/bookings/${payload.id}/host/decline`,
        { reason: payload.reason },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
    },
  });
}

export function useHostAlterBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      checkIn?: string;
      checkOut?: string;
      guestCount?: number;
      childCount?: number;
      childAges?: number[];
      notes?: string;
    }) => {
      const { data } = await axiosInstance.patch(
        `/bookings/${payload.id}/host/alter`,
        {
          checkIn: payload.checkIn,
          checkOut: payload.checkOut,
          guestCount: payload.guestCount,
          childCount: payload.childCount,
          childAges: payload.childAges,
          notes: payload.notes,
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
    },
  });
}

export function useHostNoShowBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; notes?: string }) => {
      const { data } = await axiosInstance.post(
        `/bookings/${payload.id}/host/no-show`,
        { notes: payload.notes },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
    },
  });
}
