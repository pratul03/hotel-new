import { AppEvent, AppEventPayloadMap, AppEventType, UserInfo } from "../types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const hasString = (obj: Record<string, unknown>, key: string): boolean =>
  isString(obj[key]) && obj[key].trim().length > 0;

const isIsoDate = (value: unknown): value is string =>
  isString(value) && !Number.isNaN(Date.parse(value));

const isUserInfo = (value: unknown): value is UserInfo => {
  if (!isRecord(value)) return false;
  return (
    hasString(value, "id") &&
    hasString(value, "name") &&
    hasString(value, "email")
  );
};

const isHotelInfo = (value: unknown): value is { name: string } => {
  if (!isRecord(value)) return false;
  return hasString(value, "name");
};

const hasBookingWindow = (data: Record<string, unknown>): boolean =>
  hasString(data, "bookingId") &&
  isIsoDate(data.checkIn) &&
  isIsoDate(data.checkOut);

const validators: {
  [K in AppEventType]: (data: unknown) => data is AppEventPayloadMap[K];
} = {
  "booking.created": (data): data is AppEventPayloadMap["booking.created"] => {
    if (!isRecord(data)) return false;
    return (
      hasBookingWindow(data) &&
      isUserInfo(data.guest) &&
      isUserInfo(data.host) &&
      isRecord(data.room) &&
      hasString(data.room, "type") &&
      isHotelInfo(data.hotel) &&
      isNumber(data.amount) &&
      isNumber(data.guestCount)
    );
  },
  "booking.confirmed": (
    data,
  ): data is AppEventPayloadMap["booking.confirmed"] => {
    if (!isRecord(data)) return false;
    return (
      hasBookingWindow(data) &&
      isUserInfo(data.guest) &&
      isHotelInfo(data.hotel) &&
      isNumber(data.amount)
    );
  },
  "booking.cancelled": (
    data,
  ): data is AppEventPayloadMap["booking.cancelled"] => {
    if (!isRecord(data)) return false;
    const reasonValid = data.reason === undefined || isString(data.reason);
    return (
      hasBookingWindow(data) &&
      isUserInfo(data.guest) &&
      isUserInfo(data.host) &&
      isHotelInfo(data.hotel) &&
      reasonValid
    );
  },
  "booking.checked_in": (
    data,
  ): data is AppEventPayloadMap["booking.checked_in"] => {
    if (!isRecord(data)) return false;
    return (
      hasString(data, "bookingId") &&
      isUserInfo(data.guest) &&
      isHotelInfo(data.hotel) &&
      isIsoDate(data.checkOut)
    );
  },
  "booking.checked_out": (
    data,
  ): data is AppEventPayloadMap["booking.checked_out"] => {
    if (!isRecord(data)) return false;
    return (
      hasString(data, "bookingId") &&
      isUserInfo(data.guest) &&
      isHotelInfo(data.hotel)
    );
  },
  "booking.expired": (data): data is AppEventPayloadMap["booking.expired"] => {
    if (!isRecord(data)) return false;
    return (
      hasBookingWindow(data) &&
      isUserInfo(data.guest) &&
      isHotelInfo(data.hotel)
    );
  },
  "payment.success": (data): data is AppEventPayloadMap["payment.success"] => {
    if (!isRecord(data)) return false;
    return (
      hasString(data, "bookingId") &&
      hasString(data, "paymentId") &&
      isUserInfo(data.guest) &&
      isNumber(data.amount) &&
      isHotelInfo(data.hotel)
    );
  },
  "payment.failed": (data): data is AppEventPayloadMap["payment.failed"] => {
    if (!isRecord(data)) return false;
    return (
      hasString(data, "bookingId") &&
      isUserInfo(data.guest) &&
      isNumber(data.amount)
    );
  },
  "message.new": (data): data is AppEventPayloadMap["message.new"] => {
    if (!isRecord(data)) return false;
    const bookingIdValid =
      data.bookingId === undefined || isString(data.bookingId);
    return (
      hasString(data, "messageId") &&
      isUserInfo(data.sender) &&
      isUserInfo(data.receiver) &&
      hasString(data, "content") &&
      bookingIdValid
    );
  },
  "review.created": (data): data is AppEventPayloadMap["review.created"] => {
    if (!isRecord(data)) return false;
    const commentValid = data.comment === undefined || isString(data.comment);
    return (
      hasString(data, "reviewId") &&
      isUserInfo(data.sender) &&
      isUserInfo(data.receiver) &&
      isNumber(data.rating) &&
      hasString(data, "bookingId") &&
      commentValid
    );
  },
  "checkin.reminder": (
    data,
  ): data is AppEventPayloadMap["checkin.reminder"] => {
    if (!isRecord(data) || !isRecord(data.hotel)) return false;
    return (
      hasString(data, "bookingId") &&
      isUserInfo(data.guest) &&
      hasString(data.hotel, "name") &&
      hasString(data.hotel, "checkInTime") &&
      isIsoDate(data.checkIn)
    );
  },
  "checkout.reminder": (
    data,
  ): data is AppEventPayloadMap["checkout.reminder"] => {
    if (!isRecord(data) || !isRecord(data.hotel)) return false;
    return (
      hasString(data, "bookingId") &&
      isUserInfo(data.guest) &&
      hasString(data.hotel, "name") &&
      hasString(data.hotel, "checkOutTime") &&
      isIsoDate(data.checkOut)
    );
  },
  "superhost.updated": (
    data,
  ): data is AppEventPayloadMap["superhost.updated"] => {
    if (!isRecord(data)) return false;
    return (
      hasString(data, "userId") &&
      isUserInfo(data.host) &&
      hasString(data, "status") &&
      hasString(data, "previousStatus")
    );
  },
  "incident.escalated": (
    data,
  ): data is AppEventPayloadMap["incident.escalated"] => {
    if (!isRecord(data)) return false;
    return (
      hasString(data, "incidentId") &&
      hasString(data, "bookingId") &&
      hasString(data, "reporterName") &&
      hasString(data, "description") &&
      isIsoDate(data.createdAt) &&
      hasString(data, "adminEmail")
    );
  },
};

export const parseAppEvent = (payload: unknown): AppEvent | null => {
  if (!isRecord(payload)) return null;
  if (!hasString(payload, "type") || !hasString(payload, "timestamp"))
    return null;

  const type = payload.type as AppEventType;
  const validator = validators[type];
  if (!validator) return null;
  if (!validator(payload.data)) return null;
  if (!isIsoDate(payload.timestamp)) return null;

  return {
    type,
    data: payload.data,
    timestamp: payload.timestamp,
  } as AppEvent;
};
