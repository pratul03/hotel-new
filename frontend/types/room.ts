export interface Room {
  id: string;
  hotelId: string;
  roomType: "single" | "double" | "suite" | "deluxe";
  maxGuests: number;
  basePrice: number;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomAvailability {
  roomId: string;
  blockedDates: string[];
  availableFrom?: string;
  availableTo?: string;
}
