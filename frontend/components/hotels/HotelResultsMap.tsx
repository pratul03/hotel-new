"use client";

import { Hotel } from "@/types/hotel";
import { HotelResultsMapLeaflet } from "./HotelResultsMapLeaflet";

interface HotelResultsMapProps {
  hotels: Hotel[];
  onSelect: (hotelId: string) => void;
  onSearchArea?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
}

export function HotelResultsMap({
  hotels,
  onSelect,
  onSearchArea,
}: HotelResultsMapProps) {
  return (
    <HotelResultsMapLeaflet
      hotels={hotels}
      onSelect={onSelect}
      onSearchArea={onSearchArea}
    />
  );
}
