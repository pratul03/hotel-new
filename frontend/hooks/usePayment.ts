"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { Payment, RazorpayOrder } from "@/types/payment";
import type { ApiResponse } from "@/types/api";

export function useCreatePaymentOrder(bookingId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.post<ApiResponse<RazorpayOrder>>(
        `/payments/create-order`,
        { bookingId },
      );
      return data.data;
    },
  });
}

export function useVerifyPayment() {
  return useMutation({
    mutationFn: async (payload: {
      bookingId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => {
      const { data } = await axiosInstance.post<ApiResponse<Payment>>(
        "/payments/verify",
        payload,
      );
      return data.data;
    },
  });
}

export function usePaymentByBooking(bookingId: string) {
  return useQuery({
    queryKey: ["payment", bookingId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<ApiResponse<Payment>>(
        `/payments/booking/${bookingId}`,
      );
      return data.data;
    },
    enabled: !!bookingId,
  });
}
