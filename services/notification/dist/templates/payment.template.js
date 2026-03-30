"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentFailedTemplate = exports.paymentSuccessTemplate = void 0;
const environment_1 = require("../config/environment");
const utils_1 = require("./utils");
const base = (body) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}
  .card{background:#fff;border-radius:8px;padding:32px;max-width:560px;margin:0 auto}
  h2{margin-top:0}
  .row{margin:8px 0;color:#555}
  .amount{font-size:32px;font-weight:bold;margin:16px 0}
  .btn{display:inline-block;background:#FF385C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px}
  .footer{color:#999;font-size:12px;margin-top:24px;text-align:center}
</style></head><body><div class="card">${body}<p class="footer">${environment_1.env.APP_NAME}</p></div></body></html>`;
const paymentSuccessTemplate = (d) => ({
    subject: `Payment Receipt — ${(0, utils_1.formatCurrency)(d.amount)} for ${d.hotelName}`,
    html: base(`
    <h2 style="color:#22C55E">✅ Payment Successful!</h2>
    <p>Hi ${d.guestName}, your payment was processed successfully.</p>
    <div class="amount" style="color:#22C55E">${(0, utils_1.formatCurrency)(d.amount)}</div>
    <div class="row"><strong>Property:</strong> ${d.hotelName}</div>
    <div class="row"><strong>Booking ID:</strong> <code>${d.bookingId}</code></div>
    <div class="row"><strong>Payment ID:</strong> <code>${d.paymentId}</code></div>
    <p style="color:#888;font-size:13px">Keep this email as your payment receipt.</p>
    <a href="${environment_1.env.APP_URL}/bookings/${d.bookingId}" class="btn">View Booking →</a>`),
});
exports.paymentSuccessTemplate = paymentSuccessTemplate;
const paymentFailedTemplate = (d) => ({
    subject: `Payment Failed — Action Required`,
    html: base(`
    <h2 style="color:#EF4444">❌ Payment Failed</h2>
    <p>Hi ${d.guestName}, your payment of <strong>${(0, utils_1.formatCurrency)(d.amount)}</strong> could not be processed.</p>
    <p>Please retry with a different payment method or contact your bank.</p>
    <a href="${environment_1.env.APP_URL}/bookings/${d.bookingId}" class="btn">Retry Payment →</a>`),
});
exports.paymentFailedTemplate = paymentFailedTemplate;
