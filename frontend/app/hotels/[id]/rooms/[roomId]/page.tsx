"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { format, differenceInDays, addDays } from "date-fns";
import {
  ArrowLeft,
  Users,
  BedDouble,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ImageSlider } from "@/components/common/ImageSlider/ImageSlider";
import { RazorpayButton } from "@/components/common/RazorpayButton";
import { useHotel } from "@/hooks/useHotels";
import { useCreateBooking } from "@/hooks/useBookings";
import { useVerifyPayment } from "@/hooks/usePayment";
import { useAuthStore } from "@/store/authStore";
import axiosInstance from "@/lib/axios";
import type { RazorpayOrder } from "@/types/payment";
import type { ApiResponse } from "@/types/api";

function parseJsonArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  try {
    return JSON.parse(val as string);
  } catch {
    return [];
  }
}

export default function RoomDetailPage() {
  const { id: hotelId, roomId } = useParams<{ id: string; roomId: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);

  const { data: hotel, isLoading } = useHotel(hotelId);
  const createBooking = useCreateBooking();
  const verifyPayment = useVerifyPayment();

  const today = new Date();
  const [checkIn, setCheckIn] = useState(
    format(addDays(today, 1), "yyyy-MM-dd"),
  );
  const [checkOut, setCheckOut] = useState(
    format(addDays(today, 3), "yyyy-MM-dd"),
  );
  const [guestCount, setGuestCount] = useState(1);
  const [paymentOrder, setPaymentOrder] = useState<RazorpayOrder | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const room = hotel?.rooms?.find((r) => r.id === roomId);
  const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
  const total = room ? room.basePrice * Math.max(nights, 1) : 0;

  const handleBook = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if (nights < 1) {
      toast.error("Check-out must be after check-in");
      return;
    }
    setIsCreatingOrder(true);
    try {
      const booking = await createBooking.mutateAsync({
        roomId,
        checkIn,
        checkOut,
        guestCount,
        amount: total,
      });
      setBookingId(booking.id);

      const { data } = await axiosInstance.post<ApiResponse<RazorpayOrder>>(
        "/payments/create-order",
        { bookingId: booking.id },
      );
      if (data.data) {
        setPaymentOrder(data.data);
      } else {
        toast.error("Could not create payment order");
      }
    } catch {
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaymentSuccess = async (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    if (!bookingId) return;
    try {
      await verifyPayment.mutateAsync({
        bookingId,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
      toast.success("Payment successful! Booking confirmed.");
      router.push("/payment/success");
    } catch {
      toast.error("Payment verification failed. Please contact support.");
      router.push("/payment/failed");
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!hotel || !room) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Room not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold capitalize">
            {room.roomType.replace(/_/g, " ")} Room
          </h1>
          <p className="text-sm text-muted-foreground">
            {hotel.name} · {hotel.location}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Room details */}
        <div className="md:col-span-2 space-y-6">
          {parseJsonArray(room.images).length > 0 ? (
            <div className="h-64 rounded-xl overflow-hidden">
              <ImageSlider images={parseJsonArray(room.images)} />
            </div>
          ) : (
            <div className="h-64 rounded-xl bg-muted flex items-center justify-center">
              <BedDouble className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Up to {room.maxGuests} guests</span>
            </div>
            <div className="flex items-center gap-1.5">
              {room.isAvailable ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span>{room.isAvailable ? "Available" : "Unavailable"}</span>
            </div>
            <Badge variant="secondary" className="capitalize">
              {room.roomType.replace(/_/g, " ")}
            </Badge>
          </div>

          {parseJsonArray(room.amenities).length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {parseJsonArray(room.amenities).map((amenity) => (
                  <Badge key={amenity} variant="outline">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">About {hotel.name}</h3>
            <p className="text-sm text-muted-foreground">{hotel.description}</p>
          </div>

          {hotel.publicRules?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">House Rules</h3>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                {hotel.publicRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Booking card */}
        <Card className="h-fit sticky top-4">
          <CardHeader>
            <CardTitle className="text-xl">
              ₹{room.basePrice.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / night
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Check-in
                </label>
                <input
                  type="date"
                  value={checkIn}
                  min={format(addDays(today, 1), "yyyy-MM-dd")}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Check-out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Guests
              </label>
              <select
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value, 10))}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              >
                {Array.from({ length: room.maxGuests }, (_, i) => i + 1).map(
                  (n) => (
                    <option key={n} value={n}>
                      {n} guest{n !== 1 ? "s" : ""}
                    </option>
                  ),
                )}
              </select>
            </div>

            <Separator />

            {nights > 0 && (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    ₹{room.basePrice.toLocaleString()} × {nights} nights
                  </span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>

            {paymentOrder ? (
              <RazorpayButton
                orderId={paymentOrder.id}
                amount={paymentOrder.amount}
                currency={paymentOrder.currency}
                description={`Room booking — ${hotel.name}`}
                prefill={{
                  name: currentUser?.name,
                  email: currentUser?.email,
                }}
                onSuccess={handlePaymentSuccess}
                onError={(err) => toast.error(err.message)}
                label="Pay & Confirm Booking"
              />
            ) : (
              <Button
                onClick={handleBook}
                disabled={
                  !room.isAvailable ||
                  createBooking.isPending ||
                  isCreatingOrder ||
                  nights < 1
                }
                className="w-full"
              >
                {createBooking.isPending || isCreatingOrder
                  ? "Processing…"
                  : room.isAvailable
                    ? "Reserve"
                    : "Unavailable"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
