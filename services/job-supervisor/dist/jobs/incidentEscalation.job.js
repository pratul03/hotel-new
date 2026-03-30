"use strict";
/**
 * Job: Incident Escalation
 * Schedule: Every 4 hours
 *
 * Finds incident reports that have been OPEN for more than 48 hours
 * and publishes an incident.escalated event to alert admins.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runIncidentEscalationJob = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const types_1 = require("../types");
const environment_1 = require("../config/environment");
const ESCALATION_THRESHOLD_HOURS = 48;
const runIncidentEscalationJob = async () => {
    const startedAt = new Date();
    const tracker = (0, types_1.createJobResult)("IncidentEscalation", startedAt);
    let processed = 0;
    const errors = [];
    const threshold = new Date(Date.now() - ESCALATION_THRESHOLD_HOURS * 60 * 60 * 1000);
    const staleIncidents = await database_1.prisma.incidentReport.findMany({
        where: {
            status: "open",
            createdAt: { lte: threshold },
        },
        include: {
            reportedBy: { select: { id: true, name: true, email: true } },
        },
    });
    if (!staleIncidents.length) {
        tracker.finalize(0);
        return;
    }
    const publisher = await (0, redis_1.getPublisher)();
    for (const incident of staleIncidents) {
        try {
            // Mark as investigating to avoid repeat escalation on next run
            await database_1.prisma.incidentReport.update({
                where: { id: incident.id },
                data: { status: "investigating" },
            });
            const message = JSON.stringify({
                type: "incident.escalated",
                data: {
                    incidentId: incident.id,
                    bookingId: incident.bookingId,
                    reporterName: incident.reportedBy.name,
                    description: incident.description,
                    createdAt: incident.createdAt,
                    adminEmail: environment_1.env.ADMIN_EMAIL,
                },
                timestamp: new Date().toISOString(),
            });
            await publisher.publish(types_1.EVENT_CHANNEL, message);
            processed++;
        }
        catch (err) {
            errors.push(`Incident ${incident.id}: ${err.message}`);
            console.error(`[IncidentEscalation] Failed for incident ${incident.id}:`, err);
        }
    }
    tracker.finalize(processed, errors.length, errors);
};
exports.runIncidentEscalationJob = runIncidentEscalationJob;
