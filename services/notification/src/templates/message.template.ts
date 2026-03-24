import { env } from "../config/environment";

const base = (body: string) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}
  .card{background:#fff;border-radius:8px;padding:32px;max-width:560px;margin:0 auto}
  h2{margin-top:0;color:#222}
  .bubble{background:#f0f4f8;padding:16px;border-radius:8px;margin:16px 0;color:#333;line-height:1.6;font-style:italic}
  .btn{display:inline-block;background:#FF385C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px}
  .footer{color:#999;font-size:12px;margin-top:24px;text-align:center}
</style></head><body><div class="card">${body}<p class="footer">${env.APP_NAME}</p></div></body></html>`;

export const newMessageTemplate = (d: {
  receiverName: string;
  senderName: string;
  content: string;
  bookingId?: string;
}) => ({
  subject: `New message from ${d.senderName}`,
  html: base(`
    <h2>💬 New Message</h2>
    <p>Hi ${d.receiverName},</p>
    <p>You have a new message from <strong>${d.senderName}</strong>:</p>
    <div class="bubble">&ldquo;${d.content}&rdquo;</div>
    <a href="${env.APP_URL}/messages${d.bookingId ? `?booking=${d.bookingId}` : ""}" class="btn">Reply →</a>`),
});
