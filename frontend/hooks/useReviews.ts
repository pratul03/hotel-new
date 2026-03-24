"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/types/api";

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      bookingId: string;
      receiverId: string;
      hotelId?: string;
      rating: number;
      comment?: string;
    }) => {
      const { data: res } = await axiosInstance.post<ApiResponse<unknown>>(
        "/reviews",
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel"] });
    },
  });
}
