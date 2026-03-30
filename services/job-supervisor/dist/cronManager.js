"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const bookingExpiry_job_1 = require("./jobs/bookingExpiry.job");
const checkoutReminder_job_1 = require("./jobs/checkoutReminder.job");
const roomCleaning_job_1 = require("./jobs/roomCleaning.job");
const superhostCalc_job_1 = require("./jobs/superhostCalc.job");
const incidentEscalation_job_1 = require("./jobs/incidentEscalation.job");
const wrap = async (name, fn) => {
    console.log(`\n[CRON] ▶ Starting: ${name}`);
    try {
        await fn();
        console.log(`[CRON] ✅ Completed: ${name}`);
    }
    catch (err) {
        console.error(`[CRON] ❌ Failed: ${name}`, err);
    }
};
const initializeCronJobs = () => {
    // ── Job 1: Booking Expiry ─────────────────────────
    // Every 5 minutes: auto-expire pending bookings past their deadline
    node_cron_1.default.schedule("*/5 * * * *", () => {
        wrap("BookingExpiry", bookingExpiry_job_1.runBookingExpiryJob);
    });
    // ── Job 2: Check-in / Check-out Reminders ─────────
    // Every hour: notify guests checking in or out tomorrow
    node_cron_1.default.schedule("0 * * * *", () => {
        wrap("CheckoutReminder", checkoutReminder_job_1.runCheckoutReminderJob);
    });
    // ── Job 3: Room Cleaning Status ───────────────────
    // Every 30 minutes: log rooms that need cleaning
    node_cron_1.default.schedule("*/30 * * * *", () => {
        wrap("RoomCleaning", roomCleaning_job_1.runRoomCleaningJob);
    });
    // ── Job 4: Superhost Status Calculation ──────────
    // Daily at 2:00 AM: recalculate host metrics and Superhost badges
    node_cron_1.default.schedule("0 2 * * *", () => {
        wrap("SuperhostCalc", superhostCalc_job_1.runSuperhostCalcJob);
    });
    // ── Job 5: Incident Escalation ───────────────────
    // Every 4 hours: escalate open incidents older than 48 hours
    node_cron_1.default.schedule("0 */4 * * *", () => {
        wrap("IncidentEscalation", incidentEscalation_job_1.runIncidentEscalationJob);
    });
    console.log("\n✅ All CRON jobs initialized:");
    console.log("   • BookingExpiry      — every 5 minutes");
    console.log("   • CheckoutReminder   — every hour");
    console.log("   • RoomCleaning       — every 30 minutes");
    console.log("   • SuperhostCalc      — daily at 02:00");
    console.log("   • IncidentEscalation — every 4 hours\n");
};
exports.initializeCronJobs = initializeCronJobs;
