export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "guest" | "host" | "admin";
  verified: boolean;
  superhost: boolean;
  responseRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  phoneNumber?: string;
  bio?: string;
  governmentIdVerified: boolean;
  hostRating?: number;
  totalReviews?: number;
}
