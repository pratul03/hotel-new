"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/types/api";

export interface WishlistItem {
  id: string;
  userId: string;
  roomId: string;
  listName: string;
  room: {
    id: string;
    roomType: string;
    basePrice: number;
    images: string[];
    hotel: { id: string; name: string; location: string };
  };
  addedAt?: string;
}

export interface WishlistCollection {
  name: string;
  count: number;
}

export interface WishlistInvite {
  id: string;
  read: boolean;
  createdAt: string;
  ownerId?: string;
  listName?: string;
  shareCode?: string;
}

export function useWishlist(listName?: string) {
  return useQuery({
    queryKey: ["wishlist", listName || "all"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<ApiResponse<WishlistItem[]>>(
        "/wishlist",
        {
          params: {
            ...(listName ? { listName } : {}),
          },
        },
      );
      return data.data ?? [];
    },
  });
}

export function useWishlistCollections() {
  return useQuery({
    queryKey: ["wishlist-collections"],
    queryFn: async () => {
      const { data } =
        await axiosInstance.get<ApiResponse<WishlistCollection[]>>(
          "/wishlist/lists",
        );
      return data.data ?? [];
    },
  });
}

export function useSharedWishlist(shareCode?: string) {
  return useQuery({
    queryKey: ["wishlist-shared", shareCode],
    queryFn: async () => {
      const { data } = await axiosInstance.get<
        ApiResponse<{
          owner: { id: string; name: string };
          listName: string;
          items: WishlistItem[];
        }>
      >(`/wishlist/shared/${shareCode}`);
      return data.data;
    },
    enabled: Boolean(shareCode),
  });
}

export function useCreateWishlistShareLink() {
  return useMutation({
    mutationFn: async (listName: string) => {
      const { data } = await axiosInstance.post<
        ApiResponse<{ shareCode: string; shareUrl: string; listName: string }>
      >("/wishlist/collaborate/share", { listName });
      return data.data;
    },
  });
}

export function useInviteWishlistCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listName,
      email,
    }: {
      listName: string;
      email: string;
    }) => {
      const { data } = await axiosInstance.post(
        "/wishlist/collaborate/invite",
        {
          listName,
          email,
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-invites"] });
    },
  });
}

export function useWishlistInvites() {
  return useQuery({
    queryKey: ["wishlist-invites"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<ApiResponse<WishlistInvite[]>>(
        "/wishlist/collaborate/invites",
      );
      return data.data ?? [];
    },
  });
}

export function useAcceptWishlistInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { data } = await axiosInstance.post(
        "/wishlist/collaborate/accept",
        { inviteId },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-collections"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-invites"] });
    },
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: string | { roomId: string; listName?: string },
    ) => {
      const roomId = typeof payload === "string" ? payload : payload.roomId;
      const listName =
        typeof payload === "string" ? undefined : payload.listName;
      await axiosInstance.post("/wishlist", { roomId, listName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-collections"] });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: string | { roomId: string; listName?: string },
    ) => {
      const roomId = typeof payload === "string" ? payload : payload.roomId;
      const listName =
        typeof payload === "string" ? undefined : payload.listName;
      await axiosInstance.delete(`/wishlist/${roomId}`, {
        params: {
          ...(listName ? { listName } : {}),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-collections"] });
    },
  });
}

/** Returns true if any wishlisted room belongs to the given hotel */
export function useIsWishlisted(hotelId: string) {
  const { data: wishlist } = useWishlist();
  return wishlist?.some((item) => item.room?.hotel?.id === hotelId) ?? false;
}

/** Returns the roomId of the first wishlisted room belonging to the given hotel */
export function useWishlistedRoomId(hotelId: string): string | undefined {
  const { data: wishlist } = useWishlist();
  return wishlist?.find((item) => item.room?.hotel?.id === hotelId)?.roomId;
}

export function useWishlistedItemByHotel(
  hotelId: string,
): { roomId: string; listName: string } | undefined {
  const { data: wishlist } = useWishlist();
  const item = wishlist?.find((entry) => entry.room?.hotel?.id === hotelId);
  return item ? { roomId: item.roomId, listName: item.listName } : undefined;
}
