export interface Review {
  id: string;
  hotelId: string;
  userId: string;
  bookingId?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}
