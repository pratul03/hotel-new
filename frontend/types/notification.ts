export type NotificationType =
  | "booking"
  | "message"
  | "review"
  | "payment"
  | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
