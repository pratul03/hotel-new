export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  bookingId?: string;
  content: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "pdf" | "file";
  escalatedTicketId?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface Conversation {
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  bookingId?: string;
}
