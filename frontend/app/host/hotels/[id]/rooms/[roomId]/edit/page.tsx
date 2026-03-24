"use client";

import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppForm } from "@/components/common/AppForm/AppForm";
import { z } from "zod";
import { toast } from "sonner";
import { PageLoader } from "@/components/common/PageLoader";
import { useRoom, useUpdateRoom } from "@/hooks/useRooms";
import { useHotel } from "@/hooks/useHotels";

const editRoomSchema = z.object({
  roomType: z.string().min(1, "Required"),
  maxGuests: z.string().min(1),
  basePrice: z.string().min(1, "Price is required"),
  amenities: z.string().optional(),
});

type EditRoomData = z.infer<typeof editRoomSchema>;

export default function EditRoomPage() {
  const { id: hotelId, roomId } = useParams<{ id: string; roomId: string }>();
  const router = useRouter();
  const { data: hotel } = useHotel(hotelId);
  const { data: room, isLoading } = useRoom(hotelId, roomId);
  const updateRoom = useUpdateRoom(hotelId, roomId);

  if (isLoading) return <PageLoader />;

  if (!room)
    return (
      <AppLayout>
        <p className="text-muted-foreground">Room not found.</p>
      </AppLayout>
    );

  const handleSubmit = async (data: EditRoomData) => {
    try {
      await updateRoom.mutateAsync({
        roomType: data.roomType as "single" | "double" | "suite" | "deluxe",
        maxGuests: parseInt(data.maxGuests, 10),
        basePrice: parseFloat(data.basePrice),
        amenities: data.amenities
          ? data.amenities
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
      });
      toast.success("Room updated successfully!");
      router.push(`/host/hotels/${hotelId}/rooms`);
    } catch {
      toast.error("Failed to update room. Please try again.");
    }
  };

  const parseJsonArray = (val: unknown): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val as string[];
    try {
      return JSON.parse(val as string);
    } catch {
      return [];
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Room</h1>
          <p className="text-muted-foreground">
            {hotel?.name ?? "Hotel"} ·{" "}
            <span className="capitalize">
              {room.roomType.replace(/_/g, " ")}
            </span>
          </p>
        </div>

        <AppForm
          schema={editRoomSchema}
          defaultValues={{
            roomType: room.roomType,
            maxGuests: String(room.maxGuests),
            basePrice: String(room.basePrice),
            amenities: parseJsonArray(room.amenities).join(", "),
          }}
          fields={[
            {
              name: "roomType",
              label: "Room Type",
              type: "select",
              options: [
                { label: "Standard", value: "standard" },
                { label: "Deluxe", value: "deluxe" },
                { label: "Suite", value: "suite" },
                { label: "Villa", value: "villa" },
              ],
            },
            {
              name: "maxGuests",
              label: "Max Guests",
              type: "select",
              options: [
                { label: "1", value: "1" },
                { label: "2", value: "2" },
                { label: "3", value: "3" },
                { label: "4", value: "4" },
                { label: "6", value: "6" },
                { label: "8", value: "8" },
              ],
            },
            {
              name: "basePrice",
              label: "Base Price / Night (₹)",
              type: "number",
              required: true,
              span: 2,
            },
            {
              name: "amenities",
              label: "Amenities",
              type: "textarea",
              placeholder: "WiFi, AC, TV (comma-separated)",
              span: 2,
            },
          ]}
          onSubmit={handleSubmit}
          isLoading={updateRoom.isPending}
          submitLabel="Save Changes"
          onCancel={() => router.back()}
          columns={2}
        />
      </div>
    </AppLayout>
  );
}
