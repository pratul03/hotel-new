"use client";

import { useCallback, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { AdminPageScaffold } from "@/components/admin/AdminPageScaffold";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableSection } from "@/components/admin/AdminTableSection";
import { Button } from "@/components/ui/button";
import { useAdminUpdateUser, useAdminUsers } from "@/hooks/useAdminModules";
import { formatDate } from "@/lib/format";
import type { AdminUserManagementRow } from "@/types/admin";

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminUsers();
  const updateUser = useAdminUpdateUser();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const runUserUpdate = useCallback(
    async (
      userId: string,
      input: {
        role?: "guest" | "host" | "admin";
        verified?: boolean;
        superhost?: boolean;
      },
      successMessage: string,
    ) => {
      setActiveUserId(userId);
      try {
        await updateUser.mutateAsync({ userId, input });
        toast.success(successMessage);
      } catch {
        toast.error("Failed to update user moderation");
      } finally {
        setActiveUserId(null);
      }
    },
    [updateUser],
  );

  const columns = useMemo<ColumnDef<AdminUserManagementRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <AdminStatusBadge status={row.original.role} />,
      },
      {
        accessorKey: "verified",
        header: "Verified",
        cell: ({ row }) => (
          <AdminStatusBadge
            status={row.original.verified ? "verified" : "pending"}
          />
        ),
      },
      {
        accessorKey: "listingsCount",
        header: "Listings",
      },
      {
        accessorKey: "promotedListingsCount",
        header: "Promoted",
      },
      {
        accessorKey: "responseRate",
        header: "Response Rate",
        cell: ({ row }) => {
          const rate = row.original.responseRate;
          if (typeof rate !== "number") return "--";
          return `${rate}%`;
        },
      },
      {
        accessorKey: "health",
        header: "Health",
        cell: ({ row }) => <AdminStatusBadge status={row.original.health} />,
      },
      {
        accessorKey: "lastActivityAt",
        header: "Last Activity",
        cell: ({ row }) => formatDate(row.original.lastActivityAt),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          const isPending = activeUserId === user.id && updateUser.isPending;

          return (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runUserUpdate(
                    user.id,
                    { verified: !user.verified },
                    user.verified
                      ? "User moved out of verified state"
                      : "User marked verified",
                  )
                }
              >
                {user.verified ? "Unverify" : "Verify"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runUserUpdate(
                    user.id,
                    { superhost: !user.superhost },
                    user.superhost
                      ? "Superhost badge removed"
                      : "Superhost badge granted",
                  )
                }
              >
                {user.superhost ? "Remove Superhost" : "Grant Superhost"}
              </Button>
              {user.role !== "host" ? (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    runUserUpdate(
                      user.id,
                      { role: "host" },
                      "User promoted to host",
                    )
                  }
                >
                  Promote Host
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [activeUserId, runUserUpdate, updateUser.isPending],
  );

  const activeHosts = users.filter((user) => user.role === "host").length;
  const verifiedUsers = users.filter((user) => user.verified).length;
  const superhosts = users.filter((user) => user.superhost).length;
  const averageResponse =
    users.length === 0
      ? "--"
      : `${Math.round(
          users.reduce((sum, user) => sum + (user.responseRate ?? 0), 0) /
            users.length,
        )}%`;

  return (
    <AdminPageScaffold
      section="Platform Operations"
      title="User Management"
      description="Moderate user role, trust verification, and host quality signals from a single queue."
      stats={[
        { label: "Active Hosts", value: activeHosts },
        { label: "Verified Users", value: verifiedUsers },
        { label: "Superhosts", value: superhosts },
        { label: "Average Response", value: averageResponse },
      ]}
    >
      <AdminTableSection
        columns={columns}
        rows={users}
        isLoading={isLoading}
        searchPlaceholder="Search user by name, email, role, or id..."
        getSearchText={(row) =>
          `${row.name} ${row.email ?? ""} ${row.id} ${row.health} ${row.role}`
        }
      />
    </AdminPageScaffold>
  );
}
