"use client";

import { useParams, useRouter } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  BedDouble,
  CreditCard,
  Clock,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoader } from "@/components/common/PageLoader";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  useBooking,
  useBookingCancellationPreview,
  useCancelBooking,
} from "@/hooks/useBookings";
import { ImageSlider } from "@/components/common/ImageSlider/ImageSlider";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: booking, isLoading, isError } = useBooking(id);
  const { data: cancellationPreview } = useBookingCancellationPreview(id);
  const cancelBooking = useCancelBooking();

  if (isLoading) return <PageLoader />;
  if (isError || !booking)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Booking not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );

  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const nights = differenceInDays(checkOut, checkIn);
  const canCancel =
    booking.status === "pending" || booking.status === "confirmed";

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <p className="text-sm text-muted-foreground">ID: {booking.id}</p>
        </div>
        <div className="ml-auto">
          <BookingStatusBadge status={booking.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Room / Hotel info */}
        <Card className="md:col-span-2">
          {booking.room?.images?.length > 0 && (
            <div className="h-52 overflow-hidden rounded-t-lg">
              <ImageSlider images={booking.room.images} />
            </div>
          )}
          <CardHeader>
            <CardTitle>{booking.room?.hotel?.name ?? "Hotel"}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {booking.room?.hotel?.location ?? "—"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <BedDouble className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">
                {booking.room?.roomType?.replace(/_/g, " ") ?? "Room"}
              </span>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" /> Check-in
                </p>
                <p className="font-medium">
                  {format(checkIn, "EEE, MMM d yyyy")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" /> Check-out
                </p>
                <p className="font-medium">
                  {format(checkOut, "EEE, MMM d yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {booking.guestCount} guest{booking.guestCount !== 1 ? "s" : ""}
              </span>
              <span className="text-muted-foreground">·</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {nights} night{nights !== 1 ? "s" : ""}
              </span>
            </div>

            {booking.notes && (
              <div className="flex items-start gap-2 text-sm">
                <StickyNote className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <p>{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" /> Price Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {booking.priceBreakdown ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      ₹{booking.priceBreakdown.basePrice} ×{" "}
                      {booking.priceBreakdown.nights} nights
                    </span>
                    <span>₹{booking.priceBreakdown.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service fee</span>
                    <span>₹{booking.priceBreakdown.serviceFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxes</span>
                    <span>₹{booking.priceBreakdown.taxAmount}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{booking.priceBreakdown.total}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{booking.amount}</span>
                </div>
              )}

              {cancellationPreview ? (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="font-medium">Cancellation preview</p>
                    <p className="text-muted-foreground">
                      Policy: {cancellationPreview.policyType} • Refundable:{" "}
                      {cancellationPreview.refundablePercent}%
                    </p>
                    <p className="text-muted-foreground">
                      Refund now: ₹{cancellationPreview.refundableAmount}
                    </p>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {booking.history?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Booking Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {booking.history.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-md border bg-muted/30 p-2"
                  >
                    <p className="font-medium capitalize">
                      {event.status.replace(/_/g, " ")}
                    </p>
                    <p className="text-muted-foreground">
                      {format(event.changedAt, "EEE, MMM d yyyy p")}
                    </p>
                    {event.notes ? <p className="mt-1">{event.notes}</p> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {canCancel && (
            <ConfirmDialog
              title="Cancel Booking"
              description="Are you sure you want to cancel this booking? This action cannot be undone."
              confirmLabel="Yes, Cancel"
              variant="destructive"
              isLoading={cancelBooking.isPending}
              onConfirm={() =>
                cancelBooking.mutate(booking.id, {
                  onSuccess: () => router.push("/bookings"),
                })
              }
            >
              <Button variant="destructive" className="w-full">
                Cancel Booking
              </Button>
            </ConfirmDialog>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/hotels/${booking.room?.hotel?.id}`)}
          >
            View Hotel
          </Button>
        </div>
      </div>
    </div>
  );
}
