"use client";

import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppForm } from "@/components/common/AppForm/AppForm";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateRoom } from "@/hooks/useRooms";
import { useHotel } from "@/hooks/useHotels";

const roomSchema = z.object({
  roomType: z.string().min(1, "Required"),
  maxGuests: z.string().min(1),
  basePrice: z.string().min(1, "Price is required"),
  amenities: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

export default function NewRoomPage() {
  const { id: hotelId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: hotel } = useHotel(hotelId);
  const createRoom = useCreateRoom(hotelId);

  const handleSubmit = async (data: RoomFormData) => {
    try {
      await createRoom.mutateAsync({
        roomType: data.roomType as any,
        maxGuests: parseInt(data.maxGuests, 10),
        basePrice: parseFloat(data.basePrice),
        amenities: data.amenities
          ? data.amenities
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
      });
      toast.success("Room added successfully!");
      router.push(`/host/hotels/${hotelId}/rooms`);
    } catch {
      toast.error("Failed to add room. Please try again.");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Add New Room</h1>
          <p className="text-muted-foreground">{hotel?.name ?? "Hotel"}</p>
        </div>

        <AppForm
          schema={roomSchema}
          defaultValues={{
            roomType: "standard",
            maxGuests: "2",
            basePrice: "",
            amenities: "",
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
              placeholder: "2500",
              required: true,
              span: 2,
            },
            {
              name: "amenities",
              label: "Amenities",
              type: "textarea",
              placeholder: "WiFi, AC, TV, Mini Bar (comma-separated)",
              span: 2,
            },
          ]}
          onSubmit={handleSubmit}
          isLoading={createRoom.isPending}
          submitLabel="Add Room"
          onCancel={() => router.back()}
          columns={2}
        />
      </div>
    </AppLayout>
  );
}
