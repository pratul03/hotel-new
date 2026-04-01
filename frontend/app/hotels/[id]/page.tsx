"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/format";
import { StarRating } from "@/components/common/StarRating";
import {
  Heart,
  MapPin,
  Users,
  BedDouble,
  ChevronLeft,
  Clock,
  CheckCircle,
  Shield,
  Star,
} from "lucide-react";
import { useHotel } from "@/hooks/useHotels";
import {
  useIsWishlisted,
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlistedItemByHotel,
} from "@/hooks/useWishlist";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

function parseJsonArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  try {
    return JSON.parse(val as string);
  } catch {
    return [];
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: hotel, isLoading } = useHotel(id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isWishlisted = useIsWishlisted(id);
  const wishlistedItem = useWishlistedItemByHotel(id);
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.info("Login to save hotels to wishlist");
      return;
    }

    if (isWishlisted && wishlistedItem) {
      removeFromWishlist.mutate(wishlistedItem, {
        onSuccess: () => toast.success("Removed from wishlist"),
        onError: () => toast.error("Failed to update wishlist"),
      });
    } else if (!isWishlisted && hotel?.rooms?.[0]) {
      addToWishlist.mutate(hotel.rooms[0].id, {
        onSuccess: () => toast.success("Added to wishlist"),
        onError: () => toast.error("Failed to update wishlist"),
      });
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-60 w-full rounded-xl" />
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  if (!hotel) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Hotel not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </main>
    );
  }

  const rooms = hotel.rooms ?? [];
  const reviews = hotel.reviews ?? [];
  const amenities = parseJsonArray(hotel.amenities);
  const rules = parseJsonArray(hotel.publicRules);
  const allImages = rooms.flatMap((room) => parseJsonArray(room.images));
  const uniqueImages = Array.from(new Set(allImages.filter(Boolean)));
  const listingQualityScore =
    clamp(uniqueImages.length * 5, 0, 50) +
    clamp((hotel.description?.length || 0) / 8, 0, 25) +
    clamp(amenities.length * 2, 0, 15) +
    clamp(reviews.length * 1.5, 0, 10);
  const lowestPrice = rooms.length
    ? Math.min(...rooms.map((r) => r.basePrice))
    : null;

  return (
    <main className="min-h-screen bg-background">
      {/* Top nav */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleWishlist}
            disabled={addToWishlist.isPending || removeFromWishlist.isPending}
            className={isWishlisted ? "text-red-500 border-red-500" : ""}
          >
            <Heart
              className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">{hotel.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{hotel.location}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {reviews.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {(
                      reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                    ).toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({reviews.length})
                  </span>
                </div>
              )}
              {hotel.instantBooking && <Badge>Instant Booking</Badge>}
            </div>
          </div>
          <p className="text-muted-foreground">{hotel.description}</p>
        </div>

        {/* Rich media gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 aspect-video rounded-xl overflow-hidden border bg-muted">
            {uniqueImages[0] ? (
              <img
                src={uniqueImages[0]}
                alt={`${hotel.name} main photo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-linear-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">
                  Photos coming soon
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {[1, 2].map((idx) => (
              <div
                key={idx}
                className="aspect-video rounded-xl overflow-hidden border bg-muted"
              >
                {uniqueImages[idx] ? (
                  <img
                    src={uniqueImages[idx]}
                    alt={`${hotel.name} photo ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Host info */}
            {hotel.owner && (
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage
                    src={hotel.owner.avatar}
                    alt={hotel.owner.name}
                  />
                  <AvatarFallback>{hotel.owner.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">Hosted by {hotel.owner.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {hotel.owner.superhost && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Superhost
                      </Badge>
                    )}
                    {hotel.owner.responseRate != null && (
                      <span>Response rate: {hotel.owner.responseRate}%</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Check-in/out times */}
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Check-in: <strong>{hotel.checkInTime}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Check-out: <strong>{hotel.checkOutTime}</strong>
                </span>
              </div>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6 space-y-3">
              <h2 className="text-xl font-bold">Listing Quality</h2>
              <p className="text-sm text-muted-foreground">
                Media and detail completeness score for this listing.
              </p>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${Math.round(clamp(listingQualityScore, 0, 100))}%`,
                  }}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                <p>{uniqueImages.length} photos</p>
                <p>{amenities.length} amenities</p>
                <p>{reviews.length} reviews</p>
                <p>{Math.round(listingQualityScore)}/100 quality</p>
              </div>
            </Card>

            {/* Available Rooms */}
            {rooms.length > 0 && (
              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Available Rooms</h2>
                <div className="space-y-4">
                  {rooms.map((room) => {
                    const roomAmenities = parseJsonArray(room.amenities);
                    const roomTypeLabel = (room.roomType ?? "room").replace(
                      /_/g,
                      " ",
                    );
                    return (
                      <Card key={room.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold capitalize">
                                {roomTypeLabel} Room
                              </h3>
                              {!room.isAvailable && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                <span>Up to {room.maxGuests} guests</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <BedDouble className="h-3.5 w-3.5" />
                                <span className="capitalize">
                                  {roomTypeLabel}
                                </span>
                              </div>
                            </div>
                            {roomAmenities.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {roomAmenities.slice(0, 4).map((a) => (
                                  <Badge
                                    key={a}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {a}
                                  </Badge>
                                ))}
                                {roomAmenities.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{roomAmenities.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0 space-y-2">
                            <p className="text-xl font-bold">
                              {formatPrice(room.basePrice)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              / night
                            </p>
                            <Button
                              asChild
                              size="sm"
                              disabled={!room.isAvailable}
                            >
                              <Link
                                href={`/hotels/${hotel.id}/rooms/${room.id}`}
                              >
                                Book Now
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* House Rules */}
            {rules.length > 0 && (
              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-bold">House Rules</h2>
                <ul className="space-y-2">
                  {rules.map((rule) => (
                    <li key={rule} className="flex items-start gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {hotel.cancellationPolicy && (
              <Card className="p-6 space-y-3">
                <h2 className="text-xl font-bold">Cancellation Policy</h2>
                <p className="text-sm text-muted-foreground capitalize">
                  {hotel.cancellationPolicy.policyType} policy
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    Free cancellation until{" "}
                    {hotel.cancellationPolicy.freeCancellationHours} hours
                    before check-in.
                  </li>
                  <li>
                    After that, refund up to{" "}
                    {hotel.cancellationPolicy.partialRefundPercent}% based on
                    timing.
                  </li>
                  <li>
                    No-show charge can be up to{" "}
                    {hotel.cancellationPolicy.noShowPenaltyPercent}%.
                  </li>
                </ul>
              </Card>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">
                  Reviews ({reviews.length})
                </h2>
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <Card key={review.id} className="p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={review.sender?.avatar}
                            alt={review.sender?.name}
                          />
                          <AvatarFallback>
                            {review.sender?.name?.[0] ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {review.sender?.name ?? "Guest"}
                          </p>
                          <StarRating
                            value={review.rating}
                            readonly
                            size="sm"
                          />
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">
                          {review.comment}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card className="p-6 sticky top-24 space-y-4">
              {lowestPrice != null && (
                <div>
                  <span className="text-2xl font-bold">
                    {formatPrice(lowestPrice)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {" "}
                    / night
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Starting price
                  </p>
                </div>
              )}
              <Separator />
              <p className="text-sm">
                <span className="font-medium">{rooms.length}</span> room types
                available
              </p>
              {rooms.length > 0 && (
                <Button className="w-full" size="lg" asChild>
                  <Link href={`/hotels/${hotel.id}/rooms/${rooms[0].id}`}>
                    View Rooms & Book
                  </Link>
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
