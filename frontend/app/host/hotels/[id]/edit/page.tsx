"use client";

import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppForm } from "@/components/common/AppForm/AppForm";
import { z } from "zod";
import { toast } from "sonner";
import { PageLoader } from "@/components/common/PageLoader";
import { useHotel, useUpdateHotel } from "@/hooks/useHotels";

const editHotelSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters"),
  location: z.string().min(3, "Location is required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  checkInTime: z.string().min(1, "Required"),
  checkOutTime: z.string().min(1, "Required"),
  publicRules: z.string().optional(),
  instantBooking: z.boolean(),
});

type EditHotelData = z.infer<typeof editHotelSchema>;

export default function EditHotelPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: hotel, isLoading } = useHotel(id);
  const updateHotel = useUpdateHotel(id);

  if (isLoading) return <PageLoader />;
  if (!hotel)
    return (
      <AppLayout>
        <p className="text-muted-foreground">Hotel not found.</p>
      </AppLayout>
    );

  const handleSubmit = async (data: EditHotelData) => {
    try {
      await updateHotel.mutateAsync({
        name: data.name,
        location: data.location,
        description: data.description,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        publicRules: data.publicRules
          ? data.publicRules
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean)
          : [],
        instantBooking: data.instantBooking,
      });
      toast.success("Hotel updated successfully!");
      router.push("/host/hotels");
    } catch {
      toast.error("Failed to update hotel. Please try again.");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Listing</h1>
          <p className="text-muted-foreground">{hotel.name}</p>
        </div>

        <AppForm
          schema={editHotelSchema}
          defaultValues={{
            name: hotel.name,
            location: hotel.location,
            description: hotel.description,
            checkInTime: hotel.checkInTime ?? "14:00",
            checkOutTime: hotel.checkOutTime ?? "11:00",
            publicRules: hotel.publicRules?.join(", ") ?? "",
            instantBooking: hotel.instantBooking ?? false,
          }}
          fields={[
            {
              name: "name",
              label: "Property Name",
              type: "text",
              required: true,
            },
            {
              name: "location",
              label: "Location",
              type: "text",
              required: true,
            },
            {
              name: "description",
              label: "Description",
              type: "textarea",
              required: true,
              span: 2,
            },
            {
              name: "checkInTime",
              label: "Check-in Time",
              type: "text",
              placeholder: "14:00",
            },
            {
              name: "checkOutTime",
              label: "Check-out Time",
              type: "text",
              placeholder: "11:00",
            },
            {
              name: "publicRules",
              label: "House Rules",
              type: "textarea",
              placeholder: "No smoking, No pets (comma-separated)",
              span: 2,
            },
            {
              name: "instantBooking",
              label: "Enable Instant Booking",
              type: "checkbox",
            },
          ]}
          onSubmit={handleSubmit}
          isLoading={updateHotel.isPending}
          submitLabel="Save Changes"
          onCancel={() => router.back()}
          columns={2}
        />
      </div>
    </AppLayout>
  );
}
