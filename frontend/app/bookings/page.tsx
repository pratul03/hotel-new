"use client";

import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/common/DataTable/DataTable";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { Booking } from "@/types/booking";
import { formatDate, formatPrice } from "@/lib/format";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useState } from "react";
import { useBookings } from "@/hooks/useBookings";

const LIMIT = 10;

const columns: ColumnDef<Booking>[] = [
  {
    accessorKey: "id",
    header: "Booking Ref",
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        #{row.original.id.slice(-8).toUpperCase()}
      </span>
    ),
  },
  {
    accessorKey: "checkIn",
    header: "Check-in",
    cell: ({ row }) => formatDate(row.getValue("checkIn") as string),
  },
  {
    accessorKey: "checkOut",
    header: "Check-out",
    cell: ({ row }) => formatDate(row.getValue("checkOut") as string),
  },
  {
    accessorKey: "guestCount",
    header: "Guests",
  },
  {
    accessorKey: "amount",
    header: "Total",
    cell: ({ row }) => formatPrice(row.getValue("amount") as number),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <BookingStatusBadge status={row.getValue("status")} />,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild className="gap-1">
        <Link href={`/bookings/${row.original.id}`}>
          <Eye className="h-4 w-4" />
          View
        </Link>
      </Button>
    ),
  },
];

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useBookings(page, LIMIT);
  const bookings = data?.data ?? [];
  const total = data?.total ?? 0;

  const filtered = search
    ? bookings.filter(
        (b) =>
          b.status.toLowerCase().includes(search.toLowerCase()) ||
          b.id.toLowerCase().includes(search.toLowerCase()),
      )
    : bookings;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">
            View and manage your reservations
          </p>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          totalCount={total}
          page={page}
          limit={LIMIT}
          isLoading={isLoading}
          searchPlaceholder="Search by status or ref..."
          onSearch={setSearch}
          onPageChange={setPage}
        />
      </div>
    </AppLayout>
  );
}
