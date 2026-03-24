"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { Room } from "@/types/room";

export function useRooms(hotelId: string) {
  return useQuery({
    queryKey: ["rooms", hotelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ data: Room[] }>(
        `/hotels/${hotelId}/rooms`,
      );
      return data.data;
    },
    enabled: !!hotelId,
  });
}

export function useRoom(hotelId: string, roomId: string) {
  return useQuery({
    queryKey: ["room", hotelId, roomId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ data: Room }>(
        `/hotels/${hotelId}/rooms/${roomId}`,
      );
      return data.data;
    },
    enabled: !!hotelId && !!roomId,
  });
}

export function useCreateRoom(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomData: Partial<Room>) => {
      const { data } = await axiosInstance.post<{ data: Room }>(
        `/hotels/${hotelId}/rooms`,
        roomData,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", hotelId] });
      queryClient.invalidateQueries({ queryKey: ["hotel", hotelId] });
    },
  });
}

export function useUpdateRoom(hotelId: string, roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomData: Partial<Room>) => {
      const { data } = await axiosInstance.patch<{ data: Room }>(
        `/hotels/${hotelId}/rooms/${roomId}`,
        roomData,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", hotelId] });
      queryClient.invalidateQueries({ queryKey: ["room", hotelId, roomId] });
    },
  });
}

export function useDeleteRoom(hotelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => {
      await axiosInstance.delete(`/hotels/${hotelId}/rooms/${roomId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", hotelId] });
    },
  });
}
