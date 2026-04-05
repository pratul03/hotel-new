"use client";

import { useCallback, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { AdminPageScaffold } from "@/components/admin/AdminPageScaffold";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableSection } from "@/components/admin/AdminTableSection";
import { Button } from "@/components/ui/button";
import {
  useAdminBookingCases,
  useAdminResolveIncident,
  useAdminUpdateIncidentStatus,
} from "@/hooks/useAdminModules";
import { formatDate, formatPrice } from "@/lib/format";
import type { AdminBookingCaseRow } from "@/types/admin";

export default function AdminBookingsPage() {
  const { data: cases = [], isLoading } = useAdminBookingCases();
  const updateIncidentStatus = useAdminUpdateIncidentStatus();
  const resolveIncident = useAdminResolveIncident();
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  const getIncidentId = useCallback((caseRow: AdminBookingCaseRow) => {
    if (caseRow.caseType !== "incident") return null;
    return caseRow.id.replace(/^incident-/, "");
  }, []);

  const markInvestigating = useCallback(
    async (caseRow: AdminBookingCaseRow) => {
      const incidentId = getIncidentId(caseRow);
      if (!incidentId) return;

      setActiveCaseId(caseRow.id);
      try {
        await updateIncidentStatus.mutateAsync({
          incidentId,
          status: "investigating",
        });
        toast.success("Incident moved to investigating");
      } catch {
        toast.error("Failed to update incident status");
      } finally {
        setActiveCaseId(null);
      }
    },
    [getIncidentId, updateIncidentStatus],
  );

  const markResolved = useCallback(
    async (caseRow: AdminBookingCaseRow) => {
      const incidentId = getIncidentId(caseRow);
      if (!incidentId) return;

      setActiveCaseId(caseRow.id);
      try {
        await resolveIncident.mutateAsync({
          incidentId,
          resolution: "Resolved by admin operations review",
        });
        toast.success("Incident resolved");
      } catch {
        toast.error("Failed to resolve incident");
      } finally {
        setActiveCaseId(null);
      }
    },
    [getIncidentId, resolveIncident],
  );

  const columns = useMemo<ColumnDef<AdminBookingCaseRow>[]>(
    () => [
      {
        accessorKey: "caseType",
        header: "Case Type",
        cell: ({ row }) => <AdminStatusBadge status={row.original.caseType} />,
      },
      {
        accessorKey: "title",
        header: "Issue",
        cell: ({ row }) => (
          <div>
            <p className="font-medium line-clamp-1">{row.original.title}</p>
            <p className="text-xs text-muted-foreground">{row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "bookingId",
        header: "Booking",
        cell: ({ row }) => row.original.bookingId ?? "--",
      },
      {
        accessorKey: "userId",
        header: "User",
        cell: ({ row }) => row.original.userId ?? "--",
      },
      {
        accessorKey: "amount",
        header: "Amount at Risk",
        cell: ({ row }) =>
          typeof row.original.amount === "number"
            ? formatPrice(row.original.amount)
            : "--",
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
          const caseRow = row.original;
          const isPending =
            activeCaseId === caseRow.id &&
            (updateIncidentStatus.isPending || resolveIncident.isPending);

          if (caseRow.caseType !== "incident") {
            return (
              <Button size="sm" variant="outline" disabled>
                Manual Review
              </Button>
            );
          }

          return (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => markInvestigating(caseRow)}
              >
                Investigate
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => markResolved(caseRow)}
              >
                Resolve
              </Button>
            </div>
          );
        },
      },
    ],
    [
      activeCaseId,
      markInvestigating,
      markResolved,
      resolveIncident.isPending,
      updateIncidentStatus.isPending,
    ],
  );

  const openCases = cases.filter(
    (item) =>
      !["resolved", "closed", "settled", "approved"].includes(item.status),
  ).length;
  const chargebackCases = cases.filter(
    (item) => item.caseType === "chargeback",
  ).length;
  const totalExposure = cases.reduce(
    (sum, item) => sum + (item.amount ?? 0),
    0,
  );

  return (
    <AdminPageScaffold
      section="Platform Operations"
      title="Booking Oversight"
      description="Monitor booking-related incidents, chargebacks, and off-platform fee cases from a unified queue."
      stats={[
        { label: "Total Cases", value: cases.length },
        { label: "Open Cases", value: openCases },
        { label: "Chargebacks", value: chargebackCases },
        { label: "Financial Exposure", value: formatPrice(totalExposure) },
      ]}
    >
      <AdminTableSection
        columns={columns}
        rows={cases}
        isLoading={isLoading}
        searchPlaceholder="Search by case, booking id, user id, or status..."
        getSearchText={(row) =>
          `${row.title} ${row.caseType} ${row.bookingId ?? ""} ${row.userId ?? ""} ${row.status}`
        }
      />
    </AdminPageScaffold>
  );
}
