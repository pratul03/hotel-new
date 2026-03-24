"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import {
  Hotel,
  HotelCalendarRule,
  HotelDetail,
  HotelIcalImportResult,
  HotelIcalSource,
  HotelPricingRule,
} from "@/types/hotel";
import { PaginatedResponse } from "@/types/api";

export interface HotelSearchParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  instantBooking?: boolean;
  minRating?: number;
  accessibility?:
    | "wheelchair_accessible"
    | "step_free_entry"
    | "accessible_parking";
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  sortBy?: "recommended" | "price_asc" | "price_desc" | "rating_desc";
  page?: number;
  limit?: number;
}

export function useHotels(params: HotelSearchParams = {}) {
  const {
    lat,
    lng,
    radiusKm,
    checkIn,
    checkOut,
    guests,
    minPrice,
    maxPrice,
    instantBooking,
    minRating,
    accessibility,
    north,
    south,
    east,
    west,
    sortBy,
    page = 1,
    limit = 10,
  } = params;
  return useQuery({
    queryKey: ["hotels", params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginatedResponse<Hotel>>(
        `/hotels/search`,
        {
          params: {
            latitude: lat,
            longitude: lng,
            radiusKm,
            checkIn,
            checkOut,
            guests,
            minPrice,
            maxPrice,
            instantBooking,
            minRating,
            accessibility,
            north,
            south,
            east,
            west,
            sortBy,
            page,
            limit,
          },
        },
      );
      return data;
    },
  });
}

export function useHotel(id: string) {
  return useQuery({
    queryKey: ["hotel", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get<HotelDetail>(`/hotels/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hotelData: Partial<Hotel>) => {
      const { data } = await axiosInstance.post<Hotel>("/hotels", hotelData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
    },
  });
}

export function useUpdateHotel(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hotelData: Partial<Hotel>) => {
      const { data } = await axiosInstance.put<Hotel>(
        `/hotels/${id}`,
        hotelData,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
      queryClient.invalidateQueries({ queryKey: ["hotel", id] });
    },
  });
}

export function useDeleteHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/hotels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
    },
  });
}

export function usePromotedHotels() {
  return useQuery({
    queryKey: ["hotels", "promoted"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ data: Hotel[] }>(
        "/hotels/promoted",
      );
      return data?.data ?? (data as unknown as Hotel[]);
    },
  });
}

export function useMyHotels() {
  return useQuery({
    queryKey: ["hotels", "my"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ data: Hotel[] }>("/hotels/my");
      return data?.data ?? (data as unknown as Hotel[]);
    },
  });
}

export function usePromoteHotel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      durationDays = 30,
    }: {
      id: string;
      durationDays?: number;
    }) => {
      const { data } = await axiosInstance.post(`/hotels/${id}/promote`, {
        durationDays,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
    },
  });
}

export function useUnpromoteHotel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axiosInstance.delete(`/hotels/${id}/promote`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
    },
  });
}

export function useHotelCalendarRules(hotelId: string) {
  return useQuery({
    queryKey: ["hotel-calendar-rules", hotelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{
        data: HotelCalendarRule | null;
      }>(`/hotels/${hotelId}/calendar-rules`);
      return data.data;
    },
    enabled: !!hotelId,
  });
}

export function useUpdateHotelCalendarRules(hotelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: Omit<
        HotelCalendarRule,
        "id" | "hotelId" | "createdAt" | "updatedAt"
      >,
    ) => {
      const { data } = await axiosInstance.put<{ data: HotelCalendarRule }>(
        `/hotels/${hotelId}/calendar-rules`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hotel-calendar-rules", hotelId],
      });
    },
  });
}

export function useHotelIcalSources(hotelId: string) {
  return useQuery({
    queryKey: ["hotel-ical-sources", hotelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ data: HotelIcalSource[] }>(
        `/hotels/${hotelId}/ical/sources`,
      );
      return data.data;
    },
    enabled: !!hotelId,
  });
}

export function useCreateHotelIcalSource(hotelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      url: string;
      enabled?: boolean;
    }) => {
      const { data } = await axiosInstance.post<{ data: HotelIcalSource }>(
        `/hotels/${hotelId}/ical/sources`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hotel-ical-sources", hotelId],
      });
    },
  });
}

export function useDeleteHotelIcalSource(hotelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      await axiosInstance.delete(`/hotels/${hotelId}/ical/sources/${sourceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hotel-ical-sources", hotelId],
      });
    },
  });
}

export function useSyncHotelIcalSource(hotelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const { data } = await axiosInstance.post<{
        data: HotelIcalImportResult;
      }>(`/hotels/${hotelId}/ical/sources/${sourceId}/sync`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hotel-ical-sources", hotelId],
      });
    },
  });
}

export function useImportHotelIcal(hotelId: string) {
  return useMutation({
    mutationFn: async (payload: {
      icsContent?: string;
      sourceUrl?: string;
      reason?: string;
    }) => {
      const { data } = await axiosInstance.post<{
        data: HotelIcalImportResult;
      }>(`/hotels/${hotelId}/ical/import`, payload);
      return data.data;
    },
  });
}

export function useHotelPricingRules(hotelId: string) {
  return useQuery({
    queryKey: ["hotel-pricing-rules", hotelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{
        data: HotelPricingRule | null;
      }>(`/hotels/${hotelId}/pricing-rules`);
      return data.data;
    },
    enabled: !!hotelId,
  });
}

export function useUpdateHotelPricingRules(hotelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: Omit<
        HotelPricingRule,
        "id" | "hotelId" | "createdAt" | "updatedAt"
      >,
    ) => {
      const { data } = await axiosInstance.put<{ data: HotelPricingRule }>(
        `/hotels/${hotelId}/pricing-rules`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hotel-pricing-rules", hotelId],
      });
    },
  });
}
