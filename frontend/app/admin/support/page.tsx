"use client";

import { useCallback, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { AdminPageScaffold } from "@/components/admin/AdminPageScaffold";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableSection } from "@/components/admin/AdminTableSection";
import { Button } from "@/components/ui/button";
import {
  useAdminAirCoverBoard,
  useAdminEscalateSupportTicket,
  useAdminResolveIncident,
  useAdminSupportOpsDashboard,
  useAdminSupportRoutingConsole,
  useAdminUpdateIncidentStatus,
} from "@/hooks/useAdminModules";
import { formatDate } from "@/lib/format";
import type { AdminRoutingIncident, AdminRoutingTicket } from "@/types/admin";

export default function AdminSupportPage() {
  const { data: routingConsole, isLoading: routingLoading } =
    useAdminSupportRoutingConsole(7);
  const { data: opsDashboard, isLoading: opsLoading } =
    useAdminSupportOpsDashboard(30);
  const { data: airCoverBoard, isLoading: boardLoading } =
    useAdminAirCoverBoard();
  const escalateTicket = useAdminEscalateSupportTicket();
  const updateIncidentStatus = useAdminUpdateIncidentStatus();
  const resolveIncident = useAdminResolveIncident();
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);

  const handleEscalateTicket = useCallback(
    async (
      ticketId: string,
      stage:
        | "pending_contact"
        | "active_response"
        | "local_authority_notified"
        | "follow_up"
        | "closed",
      successMessage: string,
    ) => {
      setActiveTicketId(ticketId);
      try {
        await escalateTicket.mutateAsync({
          ticketId,
          stage,
          notes: "Updated from admin support console",
        });
        toast.success(successMessage);
      } catch {
        toast.error("Failed to update ticket escalation");
      } finally {
        setActiveTicketId(null);
      }
    },
    [escalateTicket],
  );

  const handleIncidentInvestigating = useCallback(
    async (incidentId: string) => {
      setActiveIncidentId(incidentId);
      try {
        await updateIncidentStatus.mutateAsync({
          incidentId,
          status: "investigating",
        });
        toast.success("Incident moved to investigating");
      } catch {
        toast.error("Failed to update incident status");
      } finally {
        setActiveIncidentId(null);
      }
    },
    [updateIncidentStatus],
  );

  const handleIncidentResolve = useCallback(
    async (incidentId: string) => {
      setActiveIncidentId(incidentId);
      try {
        await resolveIncident.mutateAsync({
          incidentId,
          resolution: "Resolved by trust and safety admin review",
        });
        toast.success("Incident resolved");
      } catch {
        toast.error("Failed to resolve incident");
      } finally {
        setActiveIncidentId(null);
      }
    },
    [resolveIncident],
  );

  const ticketColumns = useMemo<ColumnDef<AdminRoutingTicket>[]>(
    () => [
      {
        accessorKey: "subject",
        header: "Ticket",
        cell: ({ row }) => (
          <div>
            <p className="font-medium line-clamp-1">
              {row.original.subject || "Support ticket"}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <AdminStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const ticket = row.original;
          const isPending =
            activeTicketId === ticket.id && escalateTicket.isPending;

          return (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  handleEscalateTicket(
                    ticket.id,
                    "active_response",
                    "Ticket escalated to active response",
                  )
                }
              >
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  handleEscalateTicket(
                    ticket.id,
                    "local_authority_notified",
                    "Marked as local authority notified",
                  )
                }
              >
                Notify Authority
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  handleEscalateTicket(ticket.id, "closed", "Ticket closed")
                }
              >
                Close
              </Button>
            </div>
          );
        },
      },
    ],
    [activeTicketId, escalateTicket.isPending, handleEscalateTicket],
  );

  const incidentColumns = useMemo<ColumnDef<AdminRoutingIncident>[]>(
    () => [
      {
        accessorKey: "description",
        header: "Incident",
        cell: ({ row }) => (
          <div>
            <p className="font-medium line-clamp-1">
              {row.original.description || "Safety incident"}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <AdminStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const incident = row.original;
          const isPending =
            activeIncidentId === incident.id &&
            (updateIncidentStatus.isPending || resolveIncident.isPending);

          return (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleIncidentInvestigating(incident.id)}
              >
                Investigate
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleIncidentResolve(incident.id)}
              >
                Resolve
              </Button>
            </div>
          );
        },
      },
    ],
    [
      activeIncidentId,
      handleIncidentInvestigating,
      handleIncidentResolve,
      resolveIncident.isPending,
      updateIncidentStatus.isPending,
    ],
  );

  const urgentTickets = routingConsole?.queue.urgentSupportTickets ?? [];
  const activeIncidents = routingConsole?.queue.activeIncidents ?? [];
  const emergencyTickets = airCoverBoard?.emergencyTickets ?? [];

  const isLoading = routingLoading || opsLoading || boardLoading;

  return (
    <AdminPageScaffold
      section="Trust and Support"
      title="Support Escalations"
      description="Run live safety routing and support operations from the escalation console."
      stats={[
        {
          label: "Support Tickets (30d)",
          value: opsDashboard?.support.total ?? 0,
        },
        {
          label: "Support SLA",
          value: `${Math.round((opsDashboard?.support.slaResolutionRate ?? 0) * 100)}%`,
        },
        {
          label: "Safety Incidents (30d)",
          value: opsDashboard?.safety.totalIncidents ?? 0,
        },
        {
          label: "Emergency Tickets",
          value: emergencyTickets.length,
        },
      ]}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Trust and Safety Pod
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {routingConsole?.routingSuggestions.trustAndSafetyPod ?? 0}
          </p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Frontline Support
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {routingConsole?.routingSuggestions.frontlineSupport ?? 0}
          </p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            External Escalations
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {routingConsole?.routingSuggestions.externalEscalationRequired ?? 0}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Urgent Support Tickets</h2>
        <AdminTableSection
          columns={ticketColumns}
          rows={urgentTickets}
          isLoading={isLoading}
          searchPlaceholder="Search urgent tickets..."
          getSearchText={(row) => `${row.id} ${row.subject} ${row.status}`}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Active Incidents</h2>
        <AdminTableSection
          columns={incidentColumns}
          rows={activeIncidents}
          isLoading={isLoading}
          searchPlaceholder="Search incidents..."
          getSearchText={(row) => `${row.id} ${row.description} ${row.status}`}
        />
      </div>
    </AdminPageScaffold>
  );
}
