"use client";

import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  BedDouble,
  Users,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useRooms, useDeleteRoom } from "@/hooks/useRooms";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useHotel } from "@/hooks/useHotels";

export default function HostHotelRoomsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: hotel } = useHotel(id);
  const { data: rooms, isLoading } = useRooms(id);
  const deleteRoom = useDeleteRoom(id);

  const handleDelete = (roomId: string) => {
    deleteRoom.mutate(roomId, {
      onSuccess: () => toast.success("Room deleted"),
      onError: () => toast.error("Failed to delete room"),
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Rooms</h1>
            <p className="text-muted-foreground">{hotel?.name ?? "Hotel"}</p>
          </div>
          <Button onClick={() => router.push(`/host/hotels/${id}/rooms/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : !rooms?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <BedDouble className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              No rooms yet. Add your first room.
            </p>
            <Button onClick={() => router.push(`/host/hotels/${id}/rooms/new`)}>
              <Plus className="h-4 w-4 mr-2" /> Add Room
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card key={room.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base capitalize">
                      {room.roomType.replace(/_/g, " ")}
                    </CardTitle>
                    {room.isAvailable ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {room.maxGuests} guests
                    </span>
                    <span>₹{room.basePrice.toLocaleString()} / night</span>
                  </div>

                  {room.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {room.amenities.slice(0, 3).map((a) => (
                        <Badge key={a} variant="secondary" className="text-xs">
                          {a}
                        </Badge>
                      ))}
                      {room.amenities.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{room.amenities.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        router.push(`/host/hotels/${id}/rooms/${room.id}/edit`)
                      }
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <ConfirmDialog
                      title="Delete Room"
                      description="Are you sure you want to delete this room? All associated bookings may be affected."
                      confirmLabel="Delete"
                      variant="destructive"
                      isLoading={deleteRoom.isPending}
                      onConfirm={() => handleDelete(room.id)}
                    >
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </ConfirmDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
