"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

export interface LoyaltySummary {
  tier: string;
  rewardPoints: number;
  totalSpent: number;
  completedStays: number;
  nextTierTarget: number | null;
  referralCode: string;
  personalizationSignals: {
    searches: number;
  };
}

export function useLoyalty(userId?: string) {
  return useQuery({
    queryKey: ["loyalty", userId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ data: LoyaltySummary }>(
        `/users/${userId}/loyalty`,
      );
      return data.data;
    },
    enabled: Boolean(userId),
  });
}
