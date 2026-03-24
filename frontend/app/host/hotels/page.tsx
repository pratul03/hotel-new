"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/common/DataTable/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Hotel } from "@/types/hotel";
import { Edit, MoreVertical, CalendarX, PlusCircle, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import {
  useMyHotels,
  usePromoteHotel,
  useUnpromoteHotel,
} from "@/hooks/useHotels";
import { toast } from "sonner";

export default function HostHotelsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data: hotels, isLoading } = useMyHotels();
  const promoteHotel = usePromoteHotel();
  const unpromoteHotel = useUnpromoteHotel();
  const allHotels = hotels ?? [];
  const filtered = search
    ? allHotels.filter((h) =>
        h.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allHotels;

  const handlePromote = async (hotelId: string) => {
    try {
      await promoteHotel.mutateAsync({ id: hotelId, durationDays: 30 });
      toast.success("Hotel promoted for 30 days");
    } catch {
      toast.error("Failed to promote hotel");
    }
  };

  const handleUnpromote = async (hotelId: string) => {
    try {
      await unpromoteHotel.mutateAsync(hotelId);
      toast.success("Hotel unpromoted");
    } catch {
      toast.error("Failed to unpromote hotel");
    }
  };

  const columns: ColumnDef<Hotel>[] = [
    {
      accessorKey: "name",
      header: "Property Name",
      cell: ({ row }) => (
        <Link
          href={`/host/hotels/${row.original.id}`}
          className="font-medium hover:underline text-primary"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
    },
    {
      accessorKey: "checkInTime",
      header: "Check-In",
      cell: ({ row }) => row.getValue("checkInTime") ?? "—",
    },
    {
      accessorKey: "instantBooking",
      header: "Booking",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("instantBooking") ? "default" : "secondary"}
        >
          {row.getValue("instantBooking") ? "Instant" : "Manual"}
        </Badge>
      ),
    },
    {
      accessorKey: "isPromoted",
      header: "Promotion",
      cell: ({ row }) =>
        row.original.isPromoted ? (
          <Badge className="bg-yellow-500 text-white">Featured</Badge>
        ) : (
          <Badge variant="outline">Not promoted</Badge>
        ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href={`/host/hotels/${row.original.id}/edit`}
                className="gap-2 flex items-center"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/host/hotels/${row.original.id}/block-dates`}
                className="gap-2 flex items-center"
              >
                <CalendarX className="h-4 w-4" />
                <span>Block Dates</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/host/hotels/${row.original.id}/calendar-rules`}
                className="gap-2 flex items-center"
              >
                <CalendarX className="h-4 w-4" />
                <span>Calendar Rules</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/host/hotels/${row.original.id}/ical-sync`}
                className="gap-2 flex items-center"
              >
                <CalendarX className="h-4 w-4" />
                <span>iCal Sync</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/host/hotels/${row.original.id}/pricing-rules`}
                className="gap-2 flex items-center"
              >
                <CalendarX className="h-4 w-4" />
                <span>Pricing Rules</span>
              </Link>
            </DropdownMenuItem>
            {row.original.isPromoted ? (
              <DropdownMenuItem
                onClick={() => handleUnpromote(row.original.id)}
                className="gap-2"
              >
                <Star className="h-4 w-4" />
                <span>Remove Promotion</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => handlePromote(row.original.id)}
                className="gap-2"
              >
                <Star className="h-4 w-4" />
                <span>Promote (30 days)</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Properties</h1>
            <p className="text-muted-foreground">Manage your listed hotels</p>
          </div>
          <Button asChild>
            <Link href="/host/hotels/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Property
            </Link>
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          totalCount={filtered.length}
          page={page}
          limit={10}
          searchPlaceholder="Search hotels..."
          onSearch={setSearch}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      </div>
    </AppLayout>
  );
}
