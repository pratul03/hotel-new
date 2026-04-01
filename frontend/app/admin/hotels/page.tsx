"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Building2, MapPin, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/common/DataTable/DataTable";
import { Badge } from "@/components/ui/badge";
import { Hotel } from "@/types/hotel";
import { useHotels } from "@/hooks/useHotels";

const WORLD_BOUNDS = {
  north: 90,
  south: -90,
  east: 180,
  west: -180,
};

const parseLocation = (location: string) => {
  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    place: parts[2] || "",
    city: parts[3] || "",
    district: parts[4] || "",
    coordinates: parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : location,
  };
};

export default function AdminHotelsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useHotels({
    ...WORLD_BOUNDS,
    page,
    limit: 50,
    sortBy: "recommended",
  });

  const allHotels = data?.data ?? [];

  const filteredHotels = useMemo(() => {
    if (!search.trim()) return allHotels;

    const query = search.toLowerCase();
    return allHotels.filter((hotel) => {
      const location = hotel.location.toLowerCase();
      return (
        hotel.name.toLowerCase().includes(query) || location.includes(query)
      );
    });
  }, [allHotels, search]);

  const uniqueCities = useMemo(() => {
    return new Set(
      filteredHotels
        .map((hotel) => parseLocation(hotel.location).city)
        .filter(Boolean),
    ).size;
  }, [filteredHotels]);

  const uniqueDistricts = useMemo(() => {
    return new Set(
      filteredHotels
        .map((hotel) => parseLocation(hotel.location).district)
        .filter(Boolean),
    ).size;
  }, [filteredHotels]);

  const columns: ColumnDef<Hotel>[] = [
    {
      accessorKey: "name",
      header: "Hotel",
      cell: ({ row }) => (
        <Link
          href={`/hotels/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => {
        const location = parseLocation(row.original.location);

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{location.place || row.original.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {[location.city, location.district].filter(Boolean).join(", ")}
            </p>
            <p className="text-xs text-muted-foreground">
              {location.coordinates}
            </p>
          </div>
        );
      },
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
          <Badge className="bg-yellow-500 text-white">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Featured
          </Badge>
        ) : (
          <Badge variant="outline">Not promoted</Badge>
        ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Admin console
            </div>
            <div>
              <h1 className="text-3xl font-bold">Registered Hotels</h1>
              <p className="text-muted-foreground">
                View every registered property and its primary location across
                the platform.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-lg border bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Hotels
              </p>
              <p className="text-xl font-semibold">{filteredHotels.length}</p>
            </div>
            <div className="rounded-lg border bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Cities
              </p>
              <p className="text-xl font-semibold">{uniqueCities}</p>
            </div>
            <div className="rounded-lg border bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Districts
              </p>
              <p className="text-xl font-semibold">{uniqueDistricts}</p>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredHotels}
          totalCount={filteredHotels.length}
          page={page}
          limit={50}
          searchPlaceholder="Search hotels or locations..."
          onSearch={setSearch}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      </div>
    </AppLayout>
  );
}
