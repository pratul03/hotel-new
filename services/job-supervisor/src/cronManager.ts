import cron from "node-cron";
import { runBookingExpiryJob } from "./jobs/bookingExpiry.job";
import { runCheckoutReminderJob } from "./jobs/checkoutReminder.job";
import { runRoomCleaningJob } from "./jobs/roomCleaning.job";
import { runSuperhostCalcJob } from "./jobs/superhostCalc.job";
import { runIncidentEscalationJob } from "./jobs/incidentEscalation.job";

const wrap = async (name: string, fn: () => Promise<void>) => {
  console.log(`\n[CRON] ▶ Starting: ${name}`);
  try {
    await fn();
    console.log(`[CRON] ✅ Completed: ${name}`);
  } catch (err) {
    console.error(`[CRON] ❌ Failed: ${name}`, err);
  }
};

export const initializeCronJobs = (): void => {
  // ── Job 1: Booking Expiry ─────────────────────────
  // Every 5 minutes: auto-expire pending bookings past their deadline
  cron.schedule("*/5 * * * *", () => {
    wrap("BookingExpiry", runBookingExpiryJob);
  });

  // ── Job 2: Check-in / Check-out Reminders ─────────
  // Every hour: notify guests checking in or out tomorrow
  cron.schedule("0 * * * *", () => {
    wrap("CheckoutReminder", runCheckoutReminderJob);
  });

  // ── Job 3: Room Cleaning Status ───────────────────
  // Every 30 minutes: log rooms that need cleaning
  cron.schedule("*/30 * * * *", () => {
    wrap("RoomCleaning", runRoomCleaningJob);
  });

  // ── Job 4: Superhost Status Calculation ──────────
  // Daily at 2:00 AM: recalculate host metrics and Superhost badges
  cron.schedule("0 2 * * *", () => {
    wrap("SuperhostCalc", runSuperhostCalcJob);
  });

  // ── Job 5: Incident Escalation ───────────────────
  // Every 4 hours: escalate open incidents older than 48 hours
  cron.schedule("0 */4 * * *", () => {
    wrap("IncidentEscalation", runIncidentEscalationJob);
  });

  console.log("\n✅ All CRON jobs initialized:");
  console.log("   • BookingExpiry      — every 5 minutes");
  console.log("   • CheckoutReminder   — every hour");
  console.log("   • RoomCleaning       — every 30 minutes");
  console.log("   • SuperhostCalc      — daily at 02:00");
  console.log("   • IncidentEscalation — every 4 hours\n");
};
