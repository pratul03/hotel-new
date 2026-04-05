"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { AdminPageScaffold } from "@/components/admin/AdminPageScaffold";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableSection } from "@/components/admin/AdminTableSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminPromotions } from "@/hooks/useAdminModules";
import { formatDate, formatPrice } from "@/lib/format";
import { usePromoteHotel, useUnpromoteHotel } from "@/hooks/useHotels";
import type { AdminHotelInventoryRow } from "@/types/admin";

function usePromotionsColumns(
  durationDays: number,
  onPromote: (hotelId: string) => void,
  onUnpromote: (hotelId: string) => void,
  isPending: (hotelId: string) => boolean,
) {
  return useMemo<ColumnDef<AdminHotelInventoryRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Hotel",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "ownerName",
        header: "Host",
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-[18rem]">
            {row.original.location}
          </span>
        ),
      },
      {
        accessorKey: "isPromoted",
        header: "Promotion State",
        cell: ({ row }) => (
          <AdminStatusBadge
            status={row.original.isPromoted ? "active" : "not_promoted"}
          />
        ),
      },
      {
        accessorKey: "promotedUntil",
        header: "Promoted Until",
        cell: ({ row }) =>
          row.original.promotedUntil
            ? formatDate(row.original.promotedUntil)
            : "--",
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const hotel = row.original;
          const pending = isPending(hotel.id);

          if (hotel.isPromoted) {
            return (
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => onUnpromote(hotel.id)}
              >
                Stop Promotion
              </Button>
            );
          }

          return (
            <Button
              size="sm"
              disabled={pending}
              onClick={() => onPromote(hotel.id)}
            >
              Promote ({durationDays}d)
            </Button>
          );
        },
      },
    ],
    [durationDays, onPromote, onUnpromote, isPending],
  );
}

export default function AdminPromotionsPage() {
  const { data, isLoading, refetch } = useAdminPromotions();
  const promoteHotel = usePromoteHotel();
  const unpromoteHotel = useUnpromoteHotel();
  const [durationDays, setDurationDays] = useState(30);
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);

  const rules = data?.rules ?? [];
  const hotels = data?.hotels ?? [];
  const promotedHotels = hotels.filter((hotel) => hotel.isPromoted);

  const handlePromote = async (hotelId: string) => {
    setActiveHotelId(hotelId);
    try {
      await promoteHotel.mutateAsync({ id: hotelId, durationDays });
      toast.success("Hotel promoted successfully");
      await refetch();
    } catch {
      toast.error("Failed to promote hotel");
    } finally {
      setActiveHotelId(null);
    }
  };

  const handleUnpromote = async (hotelId: string) => {
    setActiveHotelId(hotelId);
    try {
      await unpromoteHotel.mutateAsync(hotelId);
      toast.success("Promotion removed");
      await refetch();
    } catch {
      toast.error("Failed to remove promotion");
    } finally {
      setActiveHotelId(null);
    }
  };

  const columns = usePromotionsColumns(
    durationDays,
    handlePromote,
    handleUnpromote,
    (hotelId) =>
      activeHotelId === hotelId &&
      (promoteHotel.isPending || unpromoteHotel.isPending),
  );

  return (
    <AdminPageScaffold
      section="Inventory"
      title="Promotions"
      description="Manage platform promotion rules and featured listing state from one control panel."
      stats={[
        { label: "Promotion Rules", value: rules.length },
        { label: "Promoted Hotels", value: promotedHotels.length },
        {
          label: "Coverage",
          value:
            hotels.length === 0
              ? "0%"
              : `${Math.round((promotedHotels.length / hotels.length) * 100)}%`,
        },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Duration (days)</span>
          <Input
            type="number"
            min={1}
            max={365}
            value={durationDays}
            onChange={(event) =>
              setDurationDays(Number(event.target.value) || 30)
            }
            className="w-24"
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rules.map((rule) => (
          <Card key={rule.code}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{rule.code}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{rule.description}</p>
              <p className="text-muted-foreground">
                Min subtotal: {formatPrice(rule.minSubtotal)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminTableSection
        columns={columns}
        rows={hotels}
        isLoading={isLoading}
        searchPlaceholder="Search hotel, host, or location..."
        getSearchText={(row) =>
          `${row.name} ${row.ownerName} ${row.location} ${row.id}`
        }
      />
    </AdminPageScaffold>
  );
}
