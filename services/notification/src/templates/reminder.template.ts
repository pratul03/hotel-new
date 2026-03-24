import { env } from "../config/environment";
import { formatDate } from "./utils";

const base = (body: string) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}
  .card{background:#fff;border-radius:8px;padding:32px;max-width:560px;margin:0 auto}
  h2{margin-top:0}
  .row{margin:8px 0;color:#555}
  .box{padding:14px 18px;border-radius:6px;margin:16px 0;line-height:1.6}
  .btn{display:inline-block;background:#FF385C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px}
  .footer{color:#999;font-size:12px;margin-top:24px;text-align:center}
</style></head><body><div class="card">${body}<p class="footer">${env.APP_NAME}</p></div></body></html>`;

export const checkInReminderTemplate = (d: {
  guestName: string;
  hotelName: string;
  checkIn: string;
  checkInTime: string;
  bookingId: string;
}) => ({
  subject: `Check-in Tomorrow — ${d.hotelName}`,
  html: base(`
    <h2 style="color:#3B82F6">🔑 Check-in Tomorrow!</h2>
    <p>Hi ${d.guestName}, you're checking in to <strong>${d.hotelName}</strong> tomorrow!</p>
    <div class="box" style="background:#EFF6FF;border-left:4px solid #3B82F6">
      <strong>Check-in Date:</strong> ${formatDate(d.checkIn)}<br>
      <strong>Check-in Time:</strong> from ${d.checkInTime}
    </div>
    <p>Have your booking confirmation ready. See you soon!</p>
    <a href="${env.APP_URL}/bookings/${d.bookingId}" class="btn">View Booking →</a>`),
});

export const checkOutReminderTemplate = (d: {
  guestName: string;
  hotelName: string;
  checkOut: string;
  checkOutTime: string;
  bookingId: string;
}) => ({
  subject: `Check-out Tomorrow — ${d.hotelName}`,
  html: base(`
    <h2 style="color:#8B5CF6">🧳 Check-out Tomorrow</h2>
    <p>Hi ${d.guestName}, your stay at <strong>${d.hotelName}</strong> ends tomorrow.</p>
    <div class="box" style="background:#F5F3FF;border-left:4px solid #8B5CF6">
      <strong>Check-out Date:</strong> ${formatDate(d.checkOut)}<br>
      <strong>Check-out Time:</strong> by ${d.checkOutTime}
    </div>
    <p>We hope you had a wonderful stay! Don't forget to leave a review.</p>
    <a href="${env.APP_URL}/bookings/${d.bookingId}" class="btn">Leave a Review →</a>`),
});
