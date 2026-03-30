/**
 * Job: Incident Escalation
 * Schedule: Every 4 hours
 *
 * Finds incident reports that have been OPEN for more than 48 hours
 * and publishes an incident.escalated event to alert admins.
 */

import { prisma } from "../config/database";
import { getPublisher } from "../config/redis";
import { EVENT_CHANNEL, createJobResult } from "../types";
import { env } from "../config/environment";

const ESCALATION_THRESHOLD_HOURS = 48;

export const runIncidentEscalationJob = async (): Promise<void> => {
  const startedAt = new Date();
  const tracker = createJobResult("IncidentEscalation", startedAt);
  let processed = 0;
  const errors: string[] = [];

  const threshold = new Date(
    Date.now() - ESCALATION_THRESHOLD_HOURS * 60 * 60 * 1000,
  );

  const staleIncidents = await prisma.incidentReport.findMany({
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

  const publisher = await getPublisher();

  for (const incident of staleIncidents) {
    try {
      // Mark as investigating to avoid repeat escalation on next run
      await prisma.incidentReport.update({
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
          adminEmail: env.ADMIN_EMAIL,
        },
        timestamp: new Date().toISOString(),
      });

      await publisher.publish(EVENT_CHANNEL, message);

      processed++;
    } catch (err: any) {
      errors.push(`Incident ${incident.id}: ${err.message}`);
      console.error(
        `[IncidentEscalation] Failed for incident ${incident.id}:`,
        err,
      );
    }
  }

  tracker.finalize(processed, errors.length, errors);
};
