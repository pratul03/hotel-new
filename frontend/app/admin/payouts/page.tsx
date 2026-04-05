"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AdminPageScaffold } from "@/components/admin/AdminPageScaffold";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableSection } from "@/components/admin/AdminTableSection";
import {
  useAdminBookingCases,
  useAdminPaymentQueueSummary,
} from "@/hooks/useAdminModules";
import { formatDate, formatPrice } from "@/lib/format";
import type { AdminBookingCaseRow } from "@/types/admin";

const columns: ColumnDef<AdminBookingCaseRow>[] = [
  {
    accessorKey: "title",
    header: "Finance Case",
    cell: ({ row }) => (
      <div>
        <p className="font-medium line-clamp-1">{row.original.title}</p>
        <p className="text-xs text-muted-foreground">{row.original.id}</p>
      </div>
    ),
  },
  {
    accessorKey: "caseType",
    header: "Type",
    cell: ({ row }) => <AdminStatusBadge status={row.original.caseType} />,
  },
  {
    accessorKey: "bookingId",
    header: "Booking",
    cell: ({ row }) => row.original.bookingId ?? "--",
  },
  {
    accessorKey: "amount",
    header: "Amount",
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
];

export default function AdminPayoutsPage() {
  const { data: queue } = useAdminPaymentQueueSummary();
  const { data: cases = [], isLoading } = useAdminBookingCases();

  const financeCases = cases.filter(
    (item) =>
      item.caseType === "chargeback" || item.caseType === "off_platform_fee",
  );

  const totalRiskAmount = financeCases.reduce(
    (sum, item) => sum + (item.amount ?? 0),
    0,
  );

  return (
    <AdminPageScaffold
      section="Finance"
      title="Payout Approvals"
      description="Track payout-affecting finance risks and payment processing load before approvals."
      stats={[
        { label: "Queue Total", value: queue?.total ?? 0 },
        { label: "Processing", value: queue?.processing ?? 0 },
        { label: "Stale Processing", value: queue?.staleProcessing ?? 0 },
        { label: "Risk Exposure", value: formatPrice(totalRiskAmount) },
      ]}
    >
      <AdminTableSection
        columns={columns}
        rows={financeCases}
        isLoading={isLoading}
        searchPlaceholder="Search finance cases by booking or status..."
        getSearchText={(row) =>
          `${row.title} ${row.caseType} ${row.bookingId ?? ""} ${row.status}`
        }
      />
    </AdminPageScaffold>
  );
}
