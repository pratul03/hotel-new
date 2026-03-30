"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEvent = void 0;
const emailService_1 = require("../services/emailService");
const inAppService_1 = require("../services/inAppService");
const environment_1 = require("../config/environment");
// Booking templates
const booking_template_1 = require("../templates/booking.template");
// Payment templates
const payment_template_1 = require("../templates/payment.template");
// Message template
const message_template_1 = require("../templates/message.template");
// Reminder templates
const reminder_template_1 = require("../templates/reminder.template");
// System templates
const system_template_1 = require("../templates/system.template");
/**
 * Main event dispatcher — called for every event received from Redis.
 */
const handleEvent = async (event) => {
    console.log(`[Handler] Processing event: ${event.type}`);
    switch (event.type) {
        case "booking.created":
            await handleBookingCreated(event.data);
            break;
        case "booking.confirmed":
            await handleBookingConfirmed(event.data);
            break;
        case "booking.cancelled":
            await handleBookingCancelled(event.data);
            break;
        case "booking.checked_in":
            await handleBookingCheckedIn(event.data);
            break;
        case "booking.checked_out":
            await handleBookingCheckedOut(event.data);
            break;
        case "booking.expired":
            await handleBookingExpired(event.data);
            break;
        case "payment.success":
            await handlePaymentSuccess(event.data);
            break;
        case "payment.failed":
            await handlePaymentFailed(event.data);
            break;
        case "message.new":
            await handleMessageNew(event.data);
            break;
        case "review.created":
            await handleReviewCreated(event.data);
            break;
        case "checkin.reminder":
            await handleCheckInReminder(event.data);
            break;
        case "checkout.reminder":
            await handleCheckOutReminder(event.data);
            break;
        case "superhost.updated":
            await handleSuperhostUpdated(event.data);
            break;
        case "incident.escalated":
            await handleIncidentEscalated(event.data);
            break;
    }
};
exports.handleEvent = handleEvent;
// ─── Individual Handlers ──────────────────────────────────────────────────────
async function handleBookingCreated(data) {
    const { bookingId, guest, host, hotel, room, checkIn, checkOut, amount, guestCount, } = data;
    // In-app: guest + host
    await (0, inAppService_1.createBulkInAppNotifications)([
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
    const guestTpl = (0, booking_template_1.bookingCreatedGuestTemplate)({
        guestName: guest.name,
        hotelName: hotel.name,
        checkIn,
        checkOut,
        amount,
        guestCount,
        bookingId,
    });
    await (0, emailService_1.sendEmail)({ to: guest.email, ...guestTpl });
    // Email: host
    const hostTpl = (0, booking_template_1.bookingCreatedHostTemplate)({
        hostName: host.name,
        guestName: guest.name,
        hotelName: hotel.name,
        checkIn,
        checkOut,
        guestCount,
        amount,
        bookingId,
    });
    await (0, emailService_1.sendEmail)({ to: host.email, ...hostTpl });
}
async function handleBookingConfirmed(data) {
    const { bookingId, guest, hotel, checkIn, checkOut, amount } = data;
    await (0, inAppService_1.createInAppNotification)({
        userId: guest.id,
        type: "booking_confirmed",
        content: `Your booking at ${hotel.name} is confirmed!`,
        link: `/bookings/${bookingId}`,
    });
    const tpl = (0, booking_template_1.bookingConfirmedGuestTemplate)({
        guestName: guest.name,
        hotelName: hotel.name,
        checkIn,
        checkOut,
        amount,
        bookingId,
    });
    await (0, emailService_1.sendEmail)({ to: guest.email, ...tpl });
}
async function handleBookingCancelled(data) {
    const { bookingId, guest, host, hotel, checkIn, checkOut, reason } = data;
    await (0, inAppService_1.createBulkInAppNotifications)([
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
    const guestTpl = (0, booking_template_1.bookingCancelledTemplate)({
        userName: guest.name,
        hotelName: hotel.name,
        checkIn,
        checkOut,
        reason,
        bookingId,
    });
    await (0, emailService_1.sendEmail)({ to: guest.email, ...guestTpl });
    // Email to host
    const hostTpl = (0, booking_template_1.bookingCancelledTemplate)({
        userName: host.name,
        hotelName: hotel.name,
        checkIn,
        checkOut,
        reason,
        bookingId,
    });
    await (0, emailService_1.sendEmail)({ to: host.email, ...hostTpl });
}
async function handleBookingCheckedIn(data) {
    const { bookingId, guest, hotel, checkOut } = data;
    await (0, inAppService_1.createInAppNotification)({
        userId: guest.id,
        type: "checked_in",
        content: `Check-in at ${hotel.name} confirmed. Enjoy your stay!`,
        link: `/bookings/${bookingId}`,
    });
    const tpl = (0, booking_template_1.bookingCheckedInTemplate)({
        guestName: guest.name,
        hotelName: hotel.name,
        checkOut,
        bookingId,
    });
    await (0, emailService_1.sendEmail)({ to: guest.email, ...tpl });
}
async function handleBookingCheckedOut(data) {
    const { bookingId, guest, hotel } = data;
    await (0, inAppService_1.createInAppNotification)({
        userId: guest.id,
        type: "checked_out",
        content: `Check-out at ${hotel.name} confirmed. Leave a review!`,
        link: `/bookings/${bookingId}`,
    });
    const tpl = (0, booking_template_1.bookingCheckedOutTemplate)({
        guestName: guest.name,
        hotelName: hotel.name,
        bookingId,
    });
    await (0, emailService_1.sendEmail)({ to: guest.email, ...tpl });
}
async function handleBookingExpired(data) {
    const { bookingId, guest, hotel, checkIn, checkOut } = data;
    await (0, inAppService_1.createInAppNotification)({
        userId: guest.id,
        type: "booking_expired",
        content: `Your booking at ${hotel.name} has expired due to non-payment.`,
        link: `/bookings/${bookingId}`,
    });
    const tpl = (0, booking_template_1.bookingExpiredTemplate)({
        guestName: guest.name,
        hotelName: hotel.name,
        checkIn,
        checkOut,
    });
    await (0, emailService_1.sendEmail)({ to: guest.email, ...tpl });
}
async function handlePaymentSuccess(data) {
    const { bookingId, paymentId, guest, amount, hotel } = data;
    await (0, inAppService_1.createInAppNotification)({
        userId: guest.id,
        type: "payment_success",
        content: `Payment of ₹${amount.toFixed(0)} received for ${hotel.name}.`,
        link: `/bookings/${bookingId}`,
    });
    const tpl = (0, payment_template_1.paymentSuccessTemplate)({
        guestName: guest.name,
        hotelName: hotel.name,
        amount,
        bookingId,
        paymentId,
    });
    await (0, emailService_1.sendEmail)({ to: guest.email, ...tpl });
}
async function handlePaymentFailed(data) {
    const { bookingId, guest, amount } = data;
    await (0, inAppService_1.createInAppNotification)({
        userId: guest.id,
        type: "payment_failed",
        content: `Payment failed for your booking. Please retry.`,
        link: `/bookings/${bookingId}`,
    });
    const tpl = (0, payment_template_1.paymentFailedTemplate)({
        guestName: guest.name,
        amount,
        bookingId,
    });
    await (0, emailService_1.sendEmail)({ to: guest.email, ...tpl });
}
async function handleMessageNew(data) {
    const { messageId, sender, receiver, content, bookingId } = data;
    await (0, inAppService_1.createInAppNotification)({
        userId: receiver.id,
        type: "new_message",
        content: `New message from ${sender.name}: "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
        link: bookingId ? `/messages?booking=${bookingId}` : `/messages`,
    });
    const tpl = (0, message_template_1.newMessageTemplate)({
        receiverName: receiver.name,
        senderName: sender.name,
        content,
        bookingId,
    });
    await (0, emailService_1.sendEmail)({ to: receiver.email, ...tpl });
}
async function handleReviewCreated(data) {
    const { reviewId, sender, receiver, rating, comment } = data;
    await (0, inAppService_1.createInAppNotification)({
        userId: receiver.id,
        type: "review_received",
        content: `${sender.name} gave you a ${rating}⭐ review.`,
        link: `/account`,
    });
    const tpl = (0, system_template_1.reviewReceivedTemplate)({
        receiverName: receiver.name,
        senderName: sender.name,
        rating,
        comment,
    });
    await (0, emailService_1.sendEmail)({ to: receiver.email, ...tpl });
}
async function handleCheckInReminder(data) {
    const { bookingId, guest, hotel, checkIn } = data;
    await (0, inAppService_1.createInAppNotification)({
        userId: guest.id,
        type: "checkin_reminder",
        content: `Reminder: You check-in at ${hotel.name} tomorrow!`,
        link: `/bookings/${bookingId}`,
    });
    const tpl = (0, reminder_template_1.checkInReminderTemplate)({
        guestName: guest.name,
        hotelName: hotel.name,
        checkIn,
        checkInTime: hotel.checkInTime || "14:00",
        bookingId,
    });
    await (0, emailService_1.sendEmail)({ to: guest.email, ...tpl });
}
async function handleCheckOutReminder(data) {
    const { bookingId, guest, hotel, checkOut } = data;
    await (0, inAppService_1.createInAppNotification)({
        userId: guest.id,
        type: "checkout_reminder",
        content: `Reminder: You check-out from ${hotel.name} tomorrow.`,
        link: `/bookings/${bookingId}`,
    });
    const tpl = (0, reminder_template_1.checkOutReminderTemplate)({
        guestName: guest.name,
        hotelName: hotel.name,
        checkOut,
        checkOutTime: hotel.checkOutTime || "10:00",
        bookingId,
    });
    await (0, emailService_1.sendEmail)({ to: guest.email, ...tpl });
}
async function handleSuperhostUpdated(data) {
    const { host, status, previousStatus } = data;
    await (0, inAppService_1.createInAppNotification)({
        userId: host.id,
        type: "superhost_updated",
        content: status === "superhost"
            ? `🏆 Congratulations! You've achieved Superhost status.`
            : `Your Superhost status has changed to ${status}.`,
        link: `/account`,
    });
    if (status === "superhost") {
        const tpl = (0, system_template_1.superhostGrantedTemplate)({ hostName: host.name });
        await (0, emailService_1.sendEmail)({ to: host.email, ...tpl });
    }
    else {
        const tpl = (0, system_template_1.superhostRevokedTemplate)({ hostName: host.name, status });
        await (0, emailService_1.sendEmail)({ to: host.email, ...tpl });
    }
}
async function handleIncidentEscalated(data) {
    const { incidentId, bookingId, reporterName, description, createdAt, adminEmail, } = data;
    // Only sends to admin email — no in-app notification for escalation
    const target = adminEmail || environment_1.env.ADMIN_EMAIL;
    if (!target) {
        console.warn("[Handler] No admin email configured for incident escalation");
        return;
    }
    const tpl = (0, system_template_1.incidentEscalatedTemplate)({
        incidentId,
        bookingId,
        reporterName,
        description,
        createdAt,
    });
    await (0, emailService_1.sendEmail)({ to: target, ...tpl });
}
