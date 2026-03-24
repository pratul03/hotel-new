"use client";

import { useState } from "react";
import { z } from "zod";
import { AppForm } from "@/components/common/AppForm/AppForm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { formatPrice, getDaysDifference } from "@/lib/format";

const bookingSchema = z.object({
  checkInDate: z.string(),
  checkOutDate: z.string(),
  numberOfGuests: z.string(),
  specialRequests: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  roomPrice: number;
  roomName: string;
  hotelName: string;
  maxGuests: number;
  onSubmit: (data: BookingFormData) => Promise<void>;
  isLoading?: boolean;
}

export function BookingForm({
  roomPrice,
  roomName,
  hotelName,
  maxGuests,
  onSubmit,
  isLoading = false,
}: BookingFormProps) {
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDescription, setPromoDescription] = useState("");

  const calculateNights = (): number => {
    if (!checkIn || !checkOut) return 0;
    return getDaysDifference(new Date(checkIn), new Date(checkOut));
  };

  const nights = calculateNights();
  const subtotal = roomPrice * nights;
  const taxRate = 0.18;
  const taxAmount = subtotal * taxRate;
  const serviceFee = subtotal * 0.1;
  const total = subtotal + taxAmount + serviceFee;
  const discountedTotal = Math.max(0, total - promoDiscount);

  const applyPromoCode = async () => {
    if (!promoCode || total <= 0) return;
    try {
      const { data } = await axiosInstance.post("/promotions/validate", {
        code: promoCode,
        subtotal: total,
      });

      const result = data?.data;
      setPromoDiscount(result?.discountAmount || 0);
      setPromoDescription(result?.description || "Promotion applied");
      toast.success("Promotion applied");
    } catch (error: any) {
      setPromoDiscount(0);
      setPromoDescription("");
      const message =
        error?.response?.data?.error?.message || "Invalid promotion code";
      toast.error(message);
    }
  };

  const handleSubmit = async (data: BookingFormData) => {
    setCheckIn(data.checkInDate);
    setCheckOut(data.checkOutDate);
    await onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <AppForm
        schema={bookingSchema}
        defaultValues={{
          checkInDate: "",
          checkOutDate: "",
          numberOfGuests: "1",
          specialRequests: "",
        }}
        fields={[
          {
            name: "checkInDate",
            label: "Check-in Date",
            type: "date",
            required: true,
          },
          {
            name: "checkOutDate",
            label: "Check-out Date",
            type: "date",
            required: true,
          },
          {
            name: "numberOfGuests",
            label: "Number of Guests",
            type: "select",
            required: true,
            options: Array.from({ length: maxGuests }, (_, i) => ({
              label: `${i + 1} Guest${i + 1 > 1 ? "s" : ""}`,
              value: String(i + 1),
            })),
          },
          {
            name: "specialRequests",
            label: "Special Requests",
            type: "textarea",
            placeholder: "e.g., Early check-in, late checkout, etc.",
            span: 2,
          },
        ]}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Proceed to Payment"
        columns={2}
      />

      {nights > 0 && (
        <Card className="p-6 space-y-4 bg-muted/50">
          <h3 className="font-semibold">Price Breakdown</h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{roomName}</span>
              <span>{formatPrice(roomPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">× {nights} nights</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>

            <div className="border-t pt-2 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (18%)</span>
                <span>{formatPrice(taxAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>
            </div>

            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Promo code"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyPromoCode}
                >
                  Apply
                </Button>
              </div>
              {promoDiscount > 0 && (
                <>
                  <p className="text-xs text-muted-foreground">
                    {promoDescription}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-{formatPrice(promoDiscount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Final Total</span>
                    <span>{formatPrice(discountedTotal)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <Badge variant="outline" className="w-full justify-center py-2">
            {hotelName} - {roomName}
          </Badge>
        </Card>
      )}
    </div>
  );
}
