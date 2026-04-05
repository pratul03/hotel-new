"use client";

import { useCallback, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { AdminPageScaffold } from "@/components/admin/AdminPageScaffold";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableSection } from "@/components/admin/AdminTableSection";
import { Button } from "@/components/ui/button";
import {
  useAdminUpdateUser,
  useAdminVerificationQueue,
} from "@/hooks/useAdminModules";
import { formatDate } from "@/lib/format";
import type { AdminVerificationQueueRow } from "@/types/admin";

export default function AdminVerificationsPage() {
  const { data: queue = [], isLoading } = useAdminVerificationQueue();
  const updateUser = useAdminUpdateUser();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const runDecision = useCallback(
    async (
      userId: string,
      input: { verified?: boolean; superhost?: boolean },
      successMessage: string,
    ) => {
      setActiveUserId(userId);
      try {
        await updateUser.mutateAsync({ userId, input });
        toast.success(successMessage);
      } catch {
        toast.error("Failed to process verification decision");
      } finally {
        setActiveUserId(null);
      }
    },
    [updateUser],
  );

  const columns = useMemo<ColumnDef<AdminVerificationQueueRow>[]>(
    () => [
      {
        accessorKey: "hostName",
        header: "Host",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.hostName}</p>
            <p className="text-xs text-muted-foreground">{row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "listingsCount",
        header: "Listings",
      },
      {
        accessorKey: "responseRate",
        header: "Response Rate",
        cell: ({ row }) => {
          const rate = row.original.responseRate;
          return typeof rate === "number" ? `${rate}%` : "--";
        },
      },
      {
        accessorKey: "superhost",
        header: "Superhost",
        cell: ({ row }) => (row.original.superhost ? "Yes" : "No"),
      },
      {
        accessorKey: "status",
        header: "Queue Status",
        cell: ({ row }) => <AdminStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <p className="max-w-88 text-xs text-muted-foreground">
            {row.original.reason}
          </p>
        ),
      },
      {
        accessorKey: "lastActivityAt",
        header: "Last Activity",
        cell: ({ row }) => formatDate(row.original.lastActivityAt),
      },
      {
        id: "actions",
        header: "Decision",
        cell: ({ row }) => {
          const record = row.original;
          const isPending = activeUserId === record.id && updateUser.isPending;

          return (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runDecision(
                    record.id,
                    {
                      verified: true,
                      superhost:
                        record.superhost || (record.responseRate ?? 0) >= 90,
                    },
                    "Verification approved",
                  )
                }
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runDecision(
                    record.id,
                    {
                      verified: false,
                    },
                    "Moved to in-review",
                  )
                }
              >
                In Review
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  runDecision(
                    record.id,
                    {
                      verified: false,
                      superhost: false,
                    },
                    "Verification rejected",
                  )
                }
              >
                Reject
              </Button>
            </div>
          );
        },
      },
    ],
    [activeUserId, runDecision, updateUser.isPending],
  );

  const verified = queue.filter((item) => item.status === "verified").length;
  const inReview = queue.filter((item) => item.status === "in_review").length;
  const pending = queue.filter((item) => item.status === "pending").length;

  return (
    <AdminPageScaffold
      section="Platform Operations"
      title="Host Verification Queue"
      description="Track host trust signals and prioritize verification actions across active hosts."
      stats={[
        { label: "Verified", value: verified },
        { label: "In Review", value: inReview },
        { label: "Pending", value: pending },
      ]}
    >
      <AdminTableSection
        columns={columns}
        rows={queue}
        isLoading={isLoading}
        searchPlaceholder="Search host by name, id, status, or reason..."
        getSearchText={(row) =>
          `${row.hostName} ${row.id} ${row.reason} ${row.status}`
        }
      />
    </AdminPageScaffold>
  );
}
