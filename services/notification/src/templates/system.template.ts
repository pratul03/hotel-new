import { env } from "../config/environment";

const base = (body: string) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}
  .card{background:#fff;border-radius:8px;padding:32px;max-width:560px;margin:0 auto}
  h2{margin-top:0}
  .row{margin:8px 0;color:#555}
  .box{padding:14px 18px;border-radius:6px;margin:16px 0}
  .stars{font-size:22px;margin:12px 0}
  .btn{display:inline-block;background:#FF385C;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px}
  .footer{color:#999;font-size:12px;margin-top:24px;text-align:center}
</style></head><body><div class="card">${body}<p class="footer">${env.APP_NAME}</p></div></body></html>`;

export const reviewReceivedTemplate = (d: {
  receiverName: string;
  senderName: string;
  rating: number;
  comment?: string;
}) => ({
  subject: `You received a ${d.rating}⭐ review from ${d.senderName}`,
  html: base(`
    <h2 style="color:#F59E0B">⭐ New Review!</h2>
    <p>Hi ${d.receiverName},</p>
    <p><strong>${d.senderName}</strong> left you a review:</p>
    <div class="stars">${"⭐".repeat(d.rating)} <span style="font-size:14px;color:#888">(${d.rating}/5)</span></div>
    ${d.comment ? `<div class="box" style="background:#FFFBEB;border-left:4px solid #F59E0B;font-style:italic">&ldquo;${d.comment}&rdquo;</div>` : ""}
    <a href="${env.APP_URL}/account" class="btn">View My Profile →</a>`),
});

export const superhostGrantedTemplate = (d: { hostName: string }) => ({
  subject: `🏆 Congratulations — You're a Superhost!`,
  html: base(`
    <h2 style="color:#F59E0B">🏆 You're a Superhost!</h2>
    <p>Hi ${d.hostName},</p>
    <p>Congratulations! You've achieved <strong>Superhost</strong> status on ${env.APP_NAME}.</p>
    <p>Your listings will now rank higher in search results and display the Superhost badge.</p>
    <a href="${env.APP_URL}/account" class="btn">View My Listings →</a>`),
});

export const superhostRevokedTemplate = (d: {
  hostName: string;
  status: string;
}) => ({
  subject: `Your Superhost Status Has Changed`,
  html: base(`
    <h2 style="color:#6B7280">Superhost Status Update</h2>
    <p>Hi ${d.hostName},</p>
    <p>Your Superhost status has been updated to <strong>${d.status}</strong>.</p>
    <p>To maintain or regain Superhost status, focus on response rate (≥90%), ratings (≥4.8), and minimising cancellations.</p>
    <a href="${env.APP_URL}/account" class="btn">Improve My Listings →</a>`),
});

export const incidentEscalatedTemplate = (d: {
  incidentId: string;
  bookingId: string;
  reporterName: string;
  description: string;
  createdAt: string;
}) => ({
  subject: `[Action Required] Incident Escalated — #${d.incidentId.slice(0, 8)}`,
  html: base(`
    <h2 style="color:#EF4444">🚨 Incident Requires Attention</h2>
    <p>An incident report has been open for over <strong>48 hours</strong>.</p>
    <div class="row"><strong>Incident ID:</strong> <code>${d.incidentId}</code></div>
    <div class="row"><strong>Booking ID:</strong> <code>${d.bookingId}</code></div>
    <div class="row"><strong>Reported by:</strong> ${d.reporterName}</div>
    <div class="row"><strong>Created:</strong> ${new Date(d.createdAt).toLocaleString()}</div>
    <div class="box" style="background:#FEF2F2;border-left:4px solid #EF4444"><strong>Description:</strong><br>${d.description}</div>`),
});
