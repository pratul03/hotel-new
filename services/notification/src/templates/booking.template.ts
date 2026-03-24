import { env } from "../config/environment";
import { formatDate, formatCurrency } from "./utils";

const base = (body: string) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}
  .card{background:#fff;border-radius:8px;padding:32px;max-width:560px;margin:0 auto}
  h2{margin-top:0}
  .row{margin:8px 0;color:#555}
  .amount{font-size:24px;font-weight:bold;color:#222;margin:16px 0}
  .badge{display:inline-block;padding:4px 14px;border-radius:12px;font-size:13px;font-weight:bold}
  .btn{display:inline-block;background:#FF385C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px}
  .footer{color:#999;font-size:12px;margin-top:24px;text-align:center}
</style></head><body><div class="card">${body}<p class="footer">${env.APP_NAME}</p></div></body></html>`;

export const bookingCreatedGuestTemplate = (d: {
  guestName: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  guestCount: number;
  bookingId: string;
}) => ({
  subject: `Booking Request Received — ${d.hotelName}`,
  html: base(`
    <h2 style="color:#222">🏠 Booking Request Received</h2>
    <p>Hi ${d.guestName},</p>
    <p>Your booking request is pending. Please complete payment within <strong>10 minutes</strong>.</p>
    <div class="row"><strong>Property:</strong> ${d.hotelName}</div>
    <div class="row"><strong>Check-in:</strong> ${formatDate(d.checkIn)}</div>
    <div class="row"><strong>Check-out:</strong> ${formatDate(d.checkOut)}</div>
    <div class="row"><strong>Guests:</strong> ${d.guestCount}</div>
    <div class="amount">${formatCurrency(d.amount)}</div>
    <span class="badge" style="background:#FFC107;color:#222">⏳ Pending Payment</span><br>
    <a href="${env.APP_URL}/bookings/${d.bookingId}" class="btn">Complete Payment →</a>`),
});

export const bookingCreatedHostTemplate = (d: {
  hostName: string;
  guestName: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  amount: number;
  bookingId: string;
}) => ({
  subject: `New Booking Request — ${d.hotelName}`,
  html: base(`
    <h2 style="color:#222">🎉 New Booking Request!</h2>
    <p>Hi ${d.hostName},</p>
    <p><strong>${d.guestName}</strong> wants to book your property.</p>
    <div class="row"><strong>Property:</strong> ${d.hotelName}</div>
    <div class="row"><strong>Check-in:</strong> ${formatDate(d.checkIn)}</div>
    <div class="row"><strong>Check-out:</strong> ${formatDate(d.checkOut)}</div>
    <div class="row"><strong>Guests:</strong> ${d.guestCount}</div>
    <div class="row"><strong>Amount:</strong> ${formatCurrency(d.amount)}</div>`),
});

export const bookingConfirmedGuestTemplate = (d: {
  guestName: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  bookingId: string;
}) => ({
  subject: `✅ Booking Confirmed — ${d.hotelName}`,
  html: base(`
    <h2 style="color:#22C55E">✅ Booking Confirmed!</h2>
    <p>Hi ${d.guestName}, your booking is confirmed. We look forward to hosting you!</p>
    <div class="row"><strong>Property:</strong> ${d.hotelName}</div>
    <div class="row"><strong>Check-in:</strong> ${formatDate(d.checkIn)}</div>
    <div class="row"><strong>Check-out:</strong> ${formatDate(d.checkOut)}</div>
    <div class="amount">${formatCurrency(d.amount)} paid</div>
    <span class="badge" style="background:#22C55E;color:#fff">✅ Confirmed</span><br>
    <a href="${env.APP_URL}/bookings/${d.bookingId}" class="btn">View Booking →</a>`),
});

export const bookingCancelledTemplate = (d: {
  userName: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  reason?: string;
  bookingId: string;
}) => ({
  subject: `Booking Cancelled — ${d.hotelName}`,
  html: base(`
    <h2 style="color:#EF4444">Booking Cancelled</h2>
    <p>Hi ${d.userName}, the booking for <strong>${d.hotelName}</strong> has been cancelled.</p>
    <div class="row"><strong>Check-in:</strong> ${formatDate(d.checkIn)}</div>
    <div class="row"><strong>Check-out:</strong> ${formatDate(d.checkOut)}</div>
    ${d.reason ? `<div class="row"><strong>Reason:</strong> ${d.reason}</div>` : ""}
    <p>If a refund is applicable it will be processed in 5–7 business days.</p>`),
});

export const bookingCheckedInTemplate = (d: {
  guestName: string;
  hotelName: string;
  checkOut: string;
  bookingId: string;
}) => ({
  subject: `Welcome! You've Checked In — ${d.hotelName}`,
  html: base(`
    <h2 style="color:#22C55E">🔑 Check-in Confirmed!</h2>
    <p>Hi ${d.guestName}, your check-in at <strong>${d.hotelName}</strong> has been confirmed.</p>
    <div class="row"><strong>Check-out:</strong> ${formatDate(d.checkOut)}</div>
    <p>Enjoy your stay! Reach out via messages if you need anything.</p>
    <a href="${env.APP_URL}/messages" class="btn">Message Host →</a>`),
});

export const bookingCheckedOutTemplate = (d: {
  guestName: string;
  hotelName: string;
  bookingId: string;
}) => ({
  subject: `Thanks for Staying at ${d.hotelName}!`,
  html: base(`
    <h2 style="color:#222">Thanks for Staying! 🌟</h2>
    <p>Hi ${d.guestName}, we hope you enjoyed your stay at <strong>${d.hotelName}</strong>.</p>
    <p>Share your experience — reviews help other travellers!</p>
    <a href="${env.APP_URL}/bookings/${d.bookingId}" class="btn">Leave a Review →</a>`),
});

export const bookingExpiredTemplate = (d: {
  guestName: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
}) => ({
  subject: `Booking Expired — ${d.hotelName}`,
  html: base(`
    <h2 style="color:#F97316">⏰ Booking Expired</h2>
    <p>Hi ${d.guestName}, your booking for <strong>${d.hotelName}</strong> expired because payment was not completed within 10 minutes.</p>
    <div class="row"><strong>Check-in:</strong> ${formatDate(d.checkIn)}</div>
    <div class="row"><strong>Check-out:</strong> ${formatDate(d.checkOut)}</div>
    <p>You're welcome to search and book again.</p>
    <a href="${env.APP_URL}/search" class="btn">Search Again →</a>`),
});
