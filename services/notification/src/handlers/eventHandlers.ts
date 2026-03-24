import { sendEmail } from "../services/emailService";
import {
  createInAppNotification,
  createBulkInAppNotifications,
} from "../services/inAppService";
import { env } from "../config/environment";
import { AppEvent } from "../types";

// Booking templates
import {
  bookingCreatedGuestTemplate,
  bookingCreatedHostTemplate,
  bookingConfirmedGuestTemplate,
  bookingCancelledTemplate,
  bookingCheckedInTemplate,
  bookingCheckedOutTemplate,
  bookingExpiredTemplate,
} from "../templates/booking.template";

// Payment templates
import {
  paymentSuccessTemplate,
  paymentFailedTemplate,
} from "../templates/payment.template";

// Message template
import { newMessageTemplate } from "../templates/message.template";

// Reminder templates
import {
  checkInReminderTemplate,
  checkOutReminderTemplate,
} from "../templates/reminder.template";

// System templates
import {
  reviewReceivedTemplate,
  superhostGrantedTemplate,
  superhostRevokedTemplate,
  incidentEscalatedTemplate,
} from "../templates/system.template";

/**
 * Main event dispatcher — called for every event received from Redis.
 */
export const handleEvent = async (event: AppEvent): Promise<void> => {
  const { type, data } = event;
  console.log(`[Handler] Processing event: ${type}`);

  switch (type) {
    case "booking.created":
      await handleBookingCreated(data as any);
      break;
    case "booking.confirmed":
      await handleBookingConfirmed(data as any);
      break;
    case "booking.cancelled":
      await handleBookingCancelled(data as any);
      break;
    case "booking.checked_in":
      await handleBookingCheckedIn(data as any);
      break;
    case "booking.checked_out":
      await handleBookingCheckedOut(data as any);
      break;
    case "booking.expired":
      await handleBookingExpired(data as any);
      break;
    case "payment.success":
      await handlePaymentSuccess(data as any);
      break;
    case "payment.failed":
      await handlePaymentFailed(data as any);
      break;
    case "message.new":
      await handleMessageNew(data as any);
      break;
    case "review.created":
      await handleReviewCreated(data as any);
      break;
    case "checkin.reminder":
      await handleCheckInReminder(data as any);
      break;
    case "checkout.reminder":
      await handleCheckOutReminder(data as any);
      break;
    case "superhost.updated":
      await handleSuperhostUpdated(data as any);
      break;
    case "incident.escalated":
      await handleIncidentEscalated(data as any);
      break;
    default:
      console.log(`[Handler] Unknown event type: ${type} — ignored`);
  }
};

// ─── Individual Handlers ──────────────────────────────────────────────────────

async function handleBookingCreated(data: any) {
  const {
    bookingId,
    guest,
    host,
    hotel,
    room,
    checkIn,
    checkOut,
    amount,
    guestCount,
  } = data;

  // In-app: guest + host
  await createBulkInAppNotifications([
    {
      userId: guest.id,
      type: "booking_pending",
      content: `Your booking at ${hotel.name} is pending payment.`,
      link: `/bookings/${bookingId}`,
    },
    {
      userId: host.id,
      type: "new_booking_request",
      content: `${guest.name} requested to book ${hotel.name}.`,
      link: `/bookings/${bookingId}`,
    },
  ]);

  // Email: guest
  const guestTpl = bookingCreatedGuestTemplate({
    guestName: guest.name,
    hotelName: hotel.name,
    checkIn,
    checkOut,
    amount,
    guestCount,
    bookingId,
  });
  await sendEmail({ to: guest.email, ...guestTpl });

  // Email: host
  const hostTpl = bookingCreatedHostTemplate({
    hostName: host.name,
    guestName: guest.name,
    hotelName: hotel.name,
    checkIn,
    checkOut,
    guestCount,
    amount,
    bookingId,
  });
  await sendEmail({ to: host.email, ...hostTpl });
}

async function handleBookingConfirmed(data: any) {
  const { bookingId, guest, hotel, checkIn, checkOut, amount } = data;

  await createInAppNotification({
    userId: guest.id,
    type: "booking_confirmed",
    content: `Your booking at ${hotel.name} is confirmed!`,
    link: `/bookings/${bookingId}`,
  });

  const tpl = bookingConfirmedGuestTemplate({
    guestName: guest.name,
    hotelName: hotel.name,
    checkIn,
    checkOut,
    amount,
    bookingId,
  });
  await sendEmail({ to: guest.email, ...tpl });
}

async function handleBookingCancelled(data: any) {
  const { bookingId, guest, host, hotel, checkIn, checkOut, reason } = data;

  await createBulkInAppNotifications([
    {
      userId: guest.id,
      type: "booking_cancelled",
      content: `Your booking at ${hotel.name} has been cancelled.`,
      link: `/bookings/${bookingId}`,
    },
    {
      userId: host.id,
      type: "booking_cancelled",
      content: `A booking at ${hotel.name} was cancelled.`,
      link: `/bookings/${bookingId}`,
    },
  ]);

  // Email to guest
  const guestTpl = bookingCancelledTemplate({
    userName: guest.name,
    hotelName: hotel.name,
    checkIn,
    checkOut,
    reason,
    bookingId,
  });
  await sendEmail({ to: guest.email, ...guestTpl });

  // Email to host
  const hostTpl = bookingCancelledTemplate({
    userName: host.name,
    hotelName: hotel.name,
    checkIn,
    checkOut,
    reason,
    bookingId,
  });
  await sendEmail({ to: host.email, ...hostTpl });
}

async function handleBookingCheckedIn(data: any) {
  const { bookingId, guest, hotel, checkOut } = data;

  await createInAppNotification({
    userId: guest.id,
    type: "checked_in",
    content: `Check-in at ${hotel.name} confirmed. Enjoy your stay!`,
    link: `/bookings/${bookingId}`,
  });

  const tpl = bookingCheckedInTemplate({
    guestName: guest.name,
    hotelName: hotel.name,
    checkOut,
    bookingId,
  });
  await sendEmail({ to: guest.email, ...tpl });
}

async function handleBookingCheckedOut(data: any) {
  const { bookingId, guest, hotel } = data;

  await createInAppNotification({
    userId: guest.id,
    type: "checked_out",
    content: `Check-out at ${hotel.name} confirmed. Leave a review!`,
    link: `/bookings/${bookingId}`,
  });

  const tpl = bookingCheckedOutTemplate({
    guestName: guest.name,
    hotelName: hotel.name,
    bookingId,
  });
  await sendEmail({ to: guest.email, ...tpl });
}

async function handleBookingExpired(data: any) {
  const { bookingId, guest, hotel, checkIn, checkOut } = data;

  await createInAppNotification({
    userId: guest.id,
    type: "booking_expired",
    content: `Your booking at ${hotel.name} has expired due to non-payment.`,
    link: `/bookings/${bookingId}`,
  });

  const tpl = bookingExpiredTemplate({
    guestName: guest.name,
    hotelName: hotel.name,
    checkIn,
    checkOut,
  });
  await sendEmail({ to: guest.email, ...tpl });
}

async function handlePaymentSuccess(data: any) {
  const { bookingId, paymentId, guest, amount, hotel } = data;

  await createInAppNotification({
    userId: guest.id,
    type: "payment_success",
    content: `Payment of ₹${amount.toFixed(0)} received for ${hotel.name}.`,
    link: `/bookings/${bookingId}`,
  });

  const tpl = paymentSuccessTemplate({
    guestName: guest.name,
    hotelName: hotel.name,
    amount,
    bookingId,
    paymentId,
  });
  await sendEmail({ to: guest.email, ...tpl });
}

async function handlePaymentFailed(data: any) {
  const { bookingId, guest, amount } = data;

  await createInAppNotification({
    userId: guest.id,
    type: "payment_failed",
    content: `Payment failed for your booking. Please retry.`,
    link: `/bookings/${bookingId}`,
  });

  const tpl = paymentFailedTemplate({
    guestName: guest.name,
    amount,
    bookingId,
  });
  await sendEmail({ to: guest.email, ...tpl });
}

async function handleMessageNew(data: any) {
  const { messageId, sender, receiver, content, bookingId } = data;

  await createInAppNotification({
    userId: receiver.id,
    type: "new_message",
    content: `New message from ${sender.name}: "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
    link: bookingId ? `/messages?booking=${bookingId}` : `/messages`,
  });

  const tpl = newMessageTemplate({
    receiverName: receiver.name,
    senderName: sender.name,
    content,
    bookingId,
  });
  await sendEmail({ to: receiver.email, ...tpl });
}

async function handleReviewCreated(data: any) {
  const { reviewId, sender, receiver, rating, comment } = data;

  await createInAppNotification({
    userId: receiver.id,
    type: "review_received",
    content: `${sender.name} gave you a ${rating}⭐ review.`,
    link: `/account`,
  });

  const tpl = reviewReceivedTemplate({
    receiverName: receiver.name,
    senderName: sender.name,
    rating,
    comment,
  });
  await sendEmail({ to: receiver.email, ...tpl });
}

async function handleCheckInReminder(data: any) {
  const { bookingId, guest, hotel, checkIn } = data;

  await createInAppNotification({
    userId: guest.id,
    type: "checkin_reminder",
    content: `Reminder: You check-in at ${hotel.name} tomorrow!`,
    link: `/bookings/${bookingId}`,
  });

  const tpl = checkInReminderTemplate({
    guestName: guest.name,
    hotelName: hotel.name,
    checkIn,
    checkInTime: hotel.checkInTime || "14:00",
    bookingId,
  });
  await sendEmail({ to: guest.email, ...tpl });
}

async function handleCheckOutReminder(data: any) {
  const { bookingId, guest, hotel, checkOut } = data;

  await createInAppNotification({
    userId: guest.id,
    type: "checkout_reminder",
    content: `Reminder: You check-out from ${hotel.name} tomorrow.`,
    link: `/bookings/${bookingId}`,
  });

  const tpl = checkOutReminderTemplate({
    guestName: guest.name,
    hotelName: hotel.name,
    checkOut,
    checkOutTime: hotel.checkOutTime || "10:00",
    bookingId,
  });
  await sendEmail({ to: guest.email, ...tpl });
}

async function handleSuperhostUpdated(data: any) {
  const { host, status, previousStatus } = data;

  await createInAppNotification({
    userId: host.id,
    type: "superhost_updated",
    content:
      status === "superhost"
        ? `🏆 Congratulations! You've achieved Superhost status.`
        : `Your Superhost status has changed to ${status}.`,
    link: `/account`,
  });

  if (status === "superhost") {
    const tpl = superhostGrantedTemplate({ hostName: host.name });
    await sendEmail({ to: host.email, ...tpl });
  } else {
    const tpl = superhostRevokedTemplate({ hostName: host.name, status });
    await sendEmail({ to: host.email, ...tpl });
  }
}

async function handleIncidentEscalated(data: any) {
  const {
    incidentId,
    bookingId,
    reporterName,
    description,
    createdAt,
    adminEmail,
  } = data;

  // Only sends to admin email — no in-app notification for escalation
  const target = adminEmail || env.ADMIN_EMAIL;
  if (!target) {
    console.warn("[Handler] No admin email configured for incident escalation");
    return;
  }

  const tpl = incidentEscalatedTemplate({
    incidentId,
    bookingId,
    reporterName,
    description,
    createdAt,
  });
  await sendEmail({ to: target, ...tpl });
}
