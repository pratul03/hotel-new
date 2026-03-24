"use client";

import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/common/DataTable/DataTable";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Booking } from "@/types/booking";
import { formatDate, formatPrice } from "@/lib/format";
import { Check, Eye, LogIn, Pencil, UserX, X } from "lucide-react";
import { useState } from "react";
import {
  useHostBookings,
  useConfirmCheckin,
  useHostAcceptBooking,
  useHostAlterBooking,
  useHostDeclineBooking,
  useHostNoShowBooking,
} from "@/hooks/useBookings";
import { toast } from "sonner";

const LIMIT = 10;

function HostBookingActions({ booking }: { booking: Booking }) {
  const confirmCheckin = useConfirmCheckin();
  const acceptBooking = useHostAcceptBooking();
  const declineBooking = useHostDeclineBooking();
  const alterBooking = useHostAlterBooking();
  const noShowBooking = useHostNoShowBooking();

  const handleCheckin = async () => {
    try {
      await confirmCheckin.mutateAsync(booking.id);
      toast.success("Check-in confirmed!");
    } catch {
      toast.error("Failed to confirm check-in");
    }
  };

  const handleAccept = async () => {
    try {
      await acceptBooking.mutateAsync(booking.id);
      toast.success("Booking accepted");
    } catch {
      toast.error("Failed to accept booking");
    }
  };

  const handleDecline = async () => {
    const reason = window.prompt("Optional decline reason:") || undefined;
    try {
      await declineBooking.mutateAsync({ id: booking.id, reason });
      toast.success("Booking declined");
    } catch {
      toast.error("Failed to decline booking");
    }
  };

  const handleAlter = async () => {
    const checkIn = window.prompt(
      "New check-in (ISO, optional):",
      booking.checkIn,
    );
    const checkOut = window.prompt(
      "New check-out (ISO, optional):",
      booking.checkOut,
    );
    const guests = window.prompt(
      "New guest count (optional):",
      String(booking.guestCount),
    );

    try {
      await alterBooking.mutateAsync({
        id: booking.id,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        guestCount: guests ? Number(guests) : undefined,
      });
      toast.success("Booking altered");
    } catch {
      toast.error("Failed to alter booking");
    }
  };

  const handleNoShow = async () => {
    const notes = window.prompt("Optional no-show notes:") || undefined;
    try {
      await noShowBooking.mutateAsync({ id: booking.id, notes });
      toast.success("Booking marked as no-show");
    } catch {
      toast.error("Failed to mark no-show");
    }
  };

  return (
    <div className="flex gap-2">
      {booking.status === "pending" && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={acceptBooking.isPending}
            onClick={handleAccept}
          >
            <Check className="h-3.5 w-3.5" />
            Accept
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={declineBooking.isPending}
            onClick={handleDecline}
          >
            <X className="h-3.5 w-3.5" />
            Decline
          </Button>
        </>
      )}
      {(booking.status === "pending" || booking.status === "confirmed") && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={alterBooking.isPending}
          onClick={handleAlter}
        >
          <Pencil className="h-3.5 w-3.5" />
          Alter
        </Button>
      )}
      {booking.status === "confirmed" && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={confirmCheckin.isPending}
          onClick={handleCheckin}
        >
          <LogIn className="h-3.5 w-3.5" />
          Check In
        </Button>
      )}
      {(booking.status === "confirmed" || booking.status === "checked_in") && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={noShowBooking.isPending}
          onClick={handleNoShow}
        >
          <UserX className="h-3.5 w-3.5" />
          No-show
        </Button>
      )}
      <Button variant="ghost" size="sm" asChild className="gap-1">
        <Link href={`/bookings/${booking.id}`}>
          <Eye className="h-4 w-4" />
          View
        </Link>
      </Button>
    </div>
  );
}

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
    header: "Amount",
    cell: ({ row }) => formatPrice(row.getValue("amount") as number),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <BookingStatusBadge status={row.getValue("status")} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <HostBookingActions booking={row.original} />,
  },
];

export default function HostBookingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useHostBookings(page, LIMIT);
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
          <h1 className="text-3xl font-bold">Incoming Bookings</h1>
          <p className="text-muted-foreground">
            Manage guest reservations for your properties
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
