export type ScenicSeedHotel = {
  slug: string;
  name: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  description: string;
  roomType: "apartment" | "house" | "villa" | "boutique";
  nightlyPrice: number;
  amenities: string[];
  imageSources: string[];
};

// NOTE: Replace imageSources with links you are licensed to use.
// This starter dataset uses publicly accessible sample URLs for local testing.
export const DARJEELING_MIRIK_HOTELS: ScenicSeedHotel[] = [
  {
    slug: "darjeeling-mall-road-heritage",
    name: "Darjeeling Mall Road Heritage",
    city: "Darjeeling",
    district: "Darjeeling",
    latitude: 27.041,
    longitude: 88.2663,
    description:
      "Boutique hill stay near Chowrasta with Kanchenjunga sunrise access.",
    roomType: "boutique",
    nightlyPrice: 7200,
    amenities: ["wifi", "mountain_view", "heater", "workspace"],
    imageSources: [
      "https://picsum.photos/seed/darjeeling-mall-1/1600/1000",
      "https://picsum.photos/seed/darjeeling-mall-2/1600/1000",
      "https://picsum.photos/seed/darjeeling-mall-3/1600/1000"
    ]
  },
  {
    slug: "darjeeling-tiger-hill-lodge",
    name: "Tiger Hill Sunrise Lodge",
    city: "Darjeeling",
    district: "Darjeeling",
    latitude: 27.0127,
    longitude: 88.2636,
    description:
      "Scenic lodge optimized for sunrise trips, tea gardens, and toy train routes.",
    roomType: "house",
    nightlyPrice: 6800,
    amenities: ["wifi", "heater", "breakfast", "mountain_view"],
    imageSources: [
      "https://picsum.photos/seed/tiger-hill-1/1600/1000",
      "https://picsum.photos/seed/tiger-hill-2/1600/1000",
      "https://picsum.photos/seed/tiger-hill-3/1600/1000"
    ]
  },
  {
    slug: "mirik-lake-view-retreat",
    name: "Mirik Lake View Retreat",
    city: "Mirik",
    district: "Darjeeling",
    latitude: 26.8878,
    longitude: 88.1896,
    description:
      "Lake-facing family retreat with pine trails and boating access.",
    roomType: "villa",
    nightlyPrice: 5900,
    amenities: ["wifi", "lake_view", "parking", "family_friendly"],
    imageSources: [
      "https://picsum.photos/seed/mirik-lake-1/1600/1000",
      "https://picsum.photos/seed/mirik-lake-2/1600/1000",
      "https://picsum.photos/seed/mirik-lake-3/1600/1000"
    ]
  },
  {
    slug: "mirik-pine-heights",
    name: "Mirik Pine Heights",
    city: "Mirik",
    district: "Darjeeling",
    latitude: 26.8942,
    longitude: 88.1861,
    description:
      "Quiet hillside apartments close to Sumendu Lake and local cafes.",
    roomType: "apartment",
    nightlyPrice: 4700,
    amenities: ["wifi", "workspace", "kitchen", "step_free_entry"],
    imageSources: [
      "https://picsum.photos/seed/mirik-pine-1/1600/1000",
      "https://picsum.photos/seed/mirik-pine-2/1600/1000",
      "https://picsum.photos/seed/mirik-pine-3/1600/1000"
    ]
  }
];
