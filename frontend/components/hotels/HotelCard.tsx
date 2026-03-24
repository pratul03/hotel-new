"use client";

import { AppCard } from "@/components/common/AppCard/AppCard";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hotel, HotelDetail } from "@/types/hotel";
import { formatPrice } from "@/lib/format";

interface HotelCardProps {
  hotel: Hotel;
  onWishlist?: (hotelId: string) => void;
  onViewDetails?: (hotelId: string) => void;
  isWishlisted?: boolean;
}

export function HotelCard({
  hotel,
  onWishlist,
  onViewDetails,
  isWishlisted = false,
}: HotelCardProps) {
  // Use first available room's basePrice; fall back to undefined
  const pricePerNight = (hotel as HotelDetail).rooms?.[0]?.basePrice;
  const hasPrice = typeof pricePerNight === "number";

  return (
    <div className="relative group">
      <AppCard
        title={hotel.name}
        subtitle={hotel.location}
        description={hotel.description}
        images={(hotel as HotelDetail).rooms?.[0]?.images ?? []}
        stats={[
          ...(hasPrice
            ? [{ label: "/night", value: formatPrice(pricePerNight) }]
            : []),
        ]}
        onClick={() => onViewDetails?.(hotel.id)}
        actions={
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onWishlist?.(hotel.id);
            }}
            className={isWishlisted ? "text-red-500" : ""}
          >
            <Heart
              className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`}
            />
          </Button>
        }
      />
    </div>
  );
}
