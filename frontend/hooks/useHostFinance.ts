"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import {
  HostEarningsOverview,
  HostPayoutAccount,
  HostPayoutHistoryResponse,
  HostTransaction,
} from "@/types/host-finance";

type WrappedResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export function useHostEarnings(months: number = 6) {
  return useQuery({
    queryKey: ["host-earnings", { months }],
    queryFn: async () => {
      const { data } = await axiosInstance.get<
        WrappedResponse<HostEarningsOverview>
      >("/host/finance/earnings", { params: { months } });
      return data.data;
    },
  });
}

export function useHostTransactions(limit: number = 20) {
  return useQuery({
    queryKey: ["host-transactions", { limit }],
    queryFn: async () => {
      const { data } = await axiosInstance.get<
        WrappedResponse<HostTransaction[]>
      >("/host/finance/transactions", { params: { limit } });
      return data.data;
    },
  });
}

export function useHostPayoutAccount() {
  return useQuery({
    queryKey: ["host-payout-account"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<
        WrappedResponse<HostPayoutAccount | null>
      >("/host/finance/payout-account");
      return data.data;
    },
  });
}

export function useSaveHostPayoutAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      accountHolderName: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      payoutMethod?: "bank_transfer" | "upi";
      upiId?: string;
    }) => {
      const { data } = await axiosInstance.put<
        WrappedResponse<HostPayoutAccount>
      >("/host/finance/payout-account", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-payout-account"] });
    },
  });
}

export function useHostPayouts(limit: number = 20) {
  return useQuery({
    queryKey: ["host-payouts", { limit }],
    queryFn: async () => {
      const { data } = await axiosInstance.get<
        WrappedResponse<HostPayoutHistoryResponse>
      >("/host/finance/payouts", { params: { limit } });
      return data.data;
    },
  });
}

export function useRequestHostPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { amount: number; notes?: string }) => {
      const { data } = await axiosInstance.post(
        "/host/finance/payouts/request",
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["host-earnings"] });
    },
  });
}
