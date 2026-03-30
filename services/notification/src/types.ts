// Shared type definitions for the notification service

export const EVENT_CHANNEL = "app:v1:events";

export interface UserInfo {
  id: string;
  name: string;
  email: string;
}

export interface HotelInfo {
  name: string;
}

// ─── Event Data Payloads ──────────────────────────────────────────────────────

export interface BookingCreatedEventData {
  bookingId: string;
  guest: UserInfo;
  host: UserInfo;
  room: { type: string };
  hotel: HotelInfo;
  checkIn: string;
  checkOut: string;
  amount: number;
  guestCount: number;
}

export interface BookingConfirmedEventData {
  bookingId: string;
  guest: UserInfo;
  hotel: HotelInfo;
  checkIn: string;
  checkOut: string;
  amount: number;
}

export interface BookingCancelledEventData {
  bookingId: string;
  guest: UserInfo;
  host: UserInfo;
  hotel: HotelInfo;
  checkIn: string;
  checkOut: string;
  reason?: string;
}

export interface BookingCheckedInEventData {
  bookingId: string;
  guest: UserInfo;
  hotel: HotelInfo;
  checkOut: string;
}

export interface BookingCheckedOutEventData {
  bookingId: string;
  guest: UserInfo;
  hotel: HotelInfo;
}

export interface BookingExpiredEventData {
  bookingId: string;
  guest: UserInfo;
  hotel: HotelInfo;
  checkIn: string;
  checkOut: string;
}

export interface PaymentSuccessEventData {
  bookingId: string;
  paymentId: string;
  guest: UserInfo;
  amount: number;
  hotel: HotelInfo;
}

export interface PaymentFailedEventData {
  bookingId: string;
  guest: UserInfo;
  amount: number;
}

export interface MessageNewEventData {
  messageId: string;
  sender: UserInfo;
  receiver: UserInfo;
  content: string;
  bookingId?: string;
}

export interface ReviewCreatedEventData {
  reviewId: string;
  sender: UserInfo;
  receiver: UserInfo;
  rating: number;
  comment?: string;
  bookingId: string;
}

export interface CheckInReminderEventData {
  bookingId: string;
  guest: UserInfo;
  hotel: HotelInfo & { checkInTime: string };
  checkIn: string;
}

export interface CheckOutReminderEventData {
  bookingId: string;
  guest: UserInfo;
  hotel: HotelInfo & { checkOutTime: string };
  checkOut: string;
}

export interface SuperhostUpdatedEventData {
  userId: string;
  host: UserInfo;
  status: string;
  previousStatus: string;
}

export interface IncidentEscalatedEventData {
  incidentId: string;
  bookingId: string;
  reporterName: string;
  description: string;
  createdAt: string;
  adminEmail: string;
}

export interface AppEventPayloadMap {
  "booking.created": BookingCreatedEventData;
  "booking.confirmed": BookingConfirmedEventData;
  "booking.cancelled": BookingCancelledEventData;
  "booking.checked_in": BookingCheckedInEventData;
  "booking.checked_out": BookingCheckedOutEventData;
  "booking.expired": BookingExpiredEventData;
  "payment.success": PaymentSuccessEventData;
  "payment.failed": PaymentFailedEventData;
  "message.new": MessageNewEventData;
  "review.created": ReviewCreatedEventData;
  "checkin.reminder": CheckInReminderEventData;
  "checkout.reminder": CheckOutReminderEventData;
  "superhost.updated": SuperhostUpdatedEventData;
  "incident.escalated": IncidentEscalatedEventData;
}

export type AppEventType = keyof AppEventPayloadMap;

export type AppEvent = {
  [K in AppEventType]: {
    type: K;
    data: AppEventPayloadMap[K];
    timestamp: string;
  };
}[AppEventType];
