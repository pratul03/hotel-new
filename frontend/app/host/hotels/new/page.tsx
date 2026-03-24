"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { AppForm } from "@/components/common/AppForm/AppForm";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateHotel } from "@/hooks/useHotels";
import axiosInstance from "@/lib/axios";

const hotelSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters"),
  location: z.string().min(3, "Location is required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  checkInTime: z.string().min(1, "Required"),
  checkOutTime: z.string().min(1, "Required"),
  publicRules: z.string().optional(),
  instantBooking: z.boolean(),
  // First room
  roomType: z.string().min(1, "Required"),
  maxGuests: z.string().min(1),
  basePrice: z.string().min(1, "Price is required"),
});

type HotelFormData = z.infer<typeof hotelSchema>;

export default function AddHotelPage() {
  const router = useRouter();
  const createHotel = useCreateHotel();

  const handleSubmit = async (data: HotelFormData) => {
    try {
      const hotel = await createHotel.mutateAsync({
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

      // Create the initial room
      await axiosInstance.post(`/hotels/${hotel.id}/rooms`, {
        roomType: data.roomType,
        maxGuests: parseInt(data.maxGuests, 10),
        basePrice: parseFloat(data.basePrice),
      });

      toast.success("Hotel listed successfully!");
      router.push("/host/hotels");
    } catch {
      toast.error("Failed to create listing. Please try again.");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">List Your Property</h1>
          <p className="text-muted-foreground">Create a new hotel listing</p>
        </div>

        <AppForm
          schema={hotelSchema}
          defaultValues={{
            name: "",
            location: "",
            description: "",
            checkInTime: "14:00",
            checkOutTime: "11:00",
            publicRules: "",
            instantBooking: false,
            roomType: "standard",
            maxGuests: "2",
            basePrice: "",
          }}
          fields={[
            {
              name: "name",
              label: "Property Name",
              type: "text",
              placeholder: "e.g., Luxury Beach Villa",
              required: true,
            },
            {
              name: "location",
              label: "Location",
              type: "text",
              placeholder: "e.g., Goa, India",
              required: true,
            },
            {
              name: "description",
              label: "Description",
              type: "textarea",
              placeholder: "Describe your property…",
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
              description: "Comma-separated list of house rules",
              span: 2,
            },
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
                { label: "1 Guest", value: "1" },
                { label: "2 Guests", value: "2" },
                { label: "4 Guests", value: "4" },
                { label: "6 Guests", value: "6" },
                { label: "8+ Guests", value: "8" },
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
              name: "instantBooking",
              label: "Enable Instant Booking",
              type: "checkbox",
            },
          ]}
          onSubmit={handleSubmit}
          isLoading={createHotel.isPending}
          submitLabel="Create Listing"
          onCancel={() => router.back()}
          columns={2}
        />
      </div>
    </AppLayout>
  );
}
