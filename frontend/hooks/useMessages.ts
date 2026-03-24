"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import type { Message, Conversation } from "@/types/message";
import type { PaginatedResponse } from "@/types/api";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ data: Conversation[] }>(
        "/messages/conversations",
      );
      return data.data;
    },
  });
}

export function useMessages(otherUserId: string) {
  return useQuery({
    queryKey: ["messages", otherUserId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginatedResponse<Message>>(
        `/messages/thread/${otherUserId}`,
      );
      return data;
    },
    enabled: !!otherUserId,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      receiverId,
      content,
      bookingId,
      attachmentUrl,
      attachmentType,
      escalateToSupport,
    }: {
      receiverId: string;
      content: string;
      bookingId?: string;
      attachmentUrl?: string;
      attachmentType?: "image" | "pdf" | "file";
      escalateToSupport?: boolean;
    }) => {
      const { data } = await axiosInstance.post<{ data: Message }>(
        "/messages",
        {
          receiverUserId: receiverId,
          content,
          bookingId,
          attachmentUrl,
          attachmentType,
          escalateToSupport,
        },
      );
      return data.data;
    },
    onSuccess: (_, { receiverId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", receiverId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
