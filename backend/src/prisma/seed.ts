import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../config/database";

type TouristSpotSeed = {
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
  instantBooking?: boolean;
  isPromoted?: boolean;
};

const DEFAULT_PASSWORD = "Pass@12345";

const CORE_USERS = {
  admin: {
    id: "seed-admin-001",
    email: "admin.seed@mybnb.in",
    name: "Seed Admin",
    role: "admin",
    superhost: false,
  },
  guest: {
    id: "seed-guest-001",
    email: "guest.seed@mybnb.in",
    name: "Seed Guest",
    role: "guest",
    superhost: false,
  },
  user: {
    id: "seed-user-001",
    email: "user.seed@mybnb.in",
    name: "Seed User",
    role: "guest",
    superhost: false,
  },
  hosts: [
    {
      id: "seed-host-001",
      email: "host.kolkata@mybnb.in",
      name: "Kolkata Host",
      role: "host",
      superhost: true,
    },
    {
      id: "seed-host-002",
      email: "host.hills@mybnb.in",
      name: "Hills Host",
      role: "host",
      superhost: true,
    },
    {
      id: "seed-host-003",
      email: "host.coast@mybnb.in",
      name: "Coast Host",
      role: "host",
      superhost: false,
    },
    {
      id: "seed-host-004",
      email: "host.heritage@mybnb.in",
      name: "Heritage Host",
      role: "host",
      superhost: false,
    },
  ],
} as const;

const WEST_BENGAL_TOURIST_SPOTS: TouristSpotSeed[] = [
  { slug: "victoria-memorial", name: "Victoria Memorial", city: "Kolkata", district: "Kolkata", latitude: 22.5448, longitude: 88.3426, description: "Heritage stay near Victoria Memorial and Maidan.", roomType: "boutique", nightlyPrice: 4900, amenities: ["wifi", "air_conditioning", "workspace", "step_free_entry"], isPromoted: true },
  { slug: "howrah-bridge", name: "Howrah Bridge", city: "Kolkata", district: "Howrah", latitude: 22.585, longitude: 88.3468, description: "City stay near Howrah Bridge and riverfront transit.", roomType: "apartment", nightlyPrice: 3600, amenities: ["wifi", "kitchen", "self_check_in"], instantBooking: true },
  { slug: "dakshineswar-temple", name: "Dakshineswar Kali Temple", city: "Kolkata", district: "North 24 Parganas", latitude: 22.6551, longitude: 88.3573, description: "Calm stay with temple access and metro connectivity.", roomType: "apartment", nightlyPrice: 3200, amenities: ["wifi", "kitchen", "accessible_parking"] },
  { slug: "sundarbans-gosaba", name: "Sundarbans Gateway", city: "Gosaba", district: "South 24 Parganas", latitude: 22.1655, longitude: 88.8083, description: "Eco stay for mangrove safaris and delta experiences.", roomType: "house", nightlyPrice: 5400, amenities: ["breakfast", "guided_tours", "waterfront"], isPromoted: true },
  { slug: "digha-beach", name: "Digha Sea Beach", city: "Digha", district: "Purba Medinipur", latitude: 21.626, longitude: 87.5077, description: "Beachfront property near New Digha sea promenade.", roomType: "villa", nightlyPrice: 6100, amenities: ["beach_access", "pool", "wifi"], instantBooking: true },
  { slug: "mandarmani-beach", name: "Mandarmani Beach", city: "Mandarmani", district: "Purba Medinipur", latitude: 21.6568, longitude: 87.65, description: "Sea-facing villas with sunset deck and dune walks.", roomType: "villa", nightlyPrice: 6900, amenities: ["beach_access", "parking", "pet_friendly"] },
  { slug: "tajpur-beach", name: "Tajpur Beach", city: "Tajpur", district: "Purba Medinipur", latitude: 21.6239, longitude: 87.6202, description: "Quiet beach stay for weekend groups and family trips.", roomType: "house", nightlyPrice: 5200, amenities: ["beach_access", "kitchen", "bbq"] },
  { slug: "bakkhali-beach", name: "Bakkhali Beach", city: "Bakkhali", district: "South 24 Parganas", latitude: 21.5605, longitude: 88.2636, description: "Budget to premium options for Bakkhali coast travel.", roomType: "apartment", nightlyPrice: 3500, amenities: ["wifi", "parking", "self_check_in"] },
  { slug: "gangasagar", name: "Gangasagar", city: "Sagar Island", district: "South 24 Parganas", latitude: 21.6503, longitude: 88.0742, description: "Pilgrim-focused stays with ferry transfer assistance.", roomType: "house", nightlyPrice: 4300, amenities: ["breakfast", "family_friendly", "accessible_parking"] },
  { slug: "darjeeling-mall-road", name: "Darjeeling Mall Road", city: "Darjeeling", district: "Darjeeling", latitude: 27.041, longitude: 88.2663, description: "Mountain-view stays close to Chowrasta and tea cafes.", roomType: "boutique", nightlyPrice: 6800, amenities: ["mountain_view", "heater", "wifi"], isPromoted: true },
  { slug: "tiger-hill", name: "Tiger Hill", city: "Darjeeling", district: "Darjeeling", latitude: 27.0127, longitude: 88.2636, description: "Sunrise-facing lodges with Kanchenjunga viewpoints.", roomType: "boutique", nightlyPrice: 7200, amenities: ["mountain_view", "heater", "breakfast"] },
  { slug: "batasia-loop", name: "Batasia Loop", city: "Darjeeling", district: "Darjeeling", latitude: 27.0297, longitude: 88.253, description: "Rail heritage area stay with toy train proximity.", roomType: "apartment", nightlyPrice: 4700, amenities: ["wifi", "workspace", "heater"] },
  { slug: "mirik-lake", name: "Mirik Lake", city: "Mirik", district: "Darjeeling", latitude: 26.8878, longitude: 88.1896, description: "Lake-side homes for scenic and quiet hill trips.", roomType: "house", nightlyPrice: 4400, amenities: ["lake_view", "wifi", "fireplace"] },
  { slug: "kalimpong-town", name: "Kalimpong Town", city: "Kalimpong", district: "Kalimpong", latitude: 27.0626, longitude: 88.4753, description: "Town-center mountain stays with monastery circuits.", roomType: "apartment", nightlyPrice: 4100, amenities: ["wifi", "parking", "workspace"] },
  { slug: "kurseong", name: "Kurseong", city: "Kurseong", district: "Darjeeling", latitude: 26.8828, longitude: 88.2779, description: "Tea-garden retreats between Siliguri and Darjeeling.", roomType: "boutique", nightlyPrice: 4600, amenities: ["mountain_view", "tea_garden_view", "wifi"] },
  { slug: "lava", name: "Lava", city: "Lava", district: "Kalimpong", latitude: 27.1263, longitude: 88.6621, description: "Forest-edge cabins for birding and trekking.", roomType: "house", nightlyPrice: 4800, amenities: ["forest_view", "heater", "breakfast"] },
  { slug: "lolegaon", name: "Lolegaon", city: "Lolegaon", district: "Kalimpong", latitude: 27.1185, longitude: 88.7361, description: "Canopy-walk area homes with slow travel vibe.", roomType: "house", nightlyPrice: 4500, amenities: ["forest_view", "wifi", "family_friendly"] },
  { slug: "jaldapara", name: "Jaldapara National Park", city: "Madarihat", district: "Alipurduar", latitude: 26.6848, longitude: 89.3558, description: "Safari access stays for rhino and elephant sightings.", roomType: "villa", nightlyPrice: 6400, amenities: ["safari_assistance", "parking", "breakfast"] },
  { slug: "gorumara", name: "Gorumara National Park", city: "Lataguri", district: "Jalpaiguri", latitude: 26.71, longitude: 88.799, description: "Dooars eco stays with jeep safari support.", roomType: "villa", nightlyPrice: 5900, amenities: ["safari_assistance", "pool", "wifi"] },
  { slug: "buxa-fort", name: "Buxa Fort", city: "Buxa", district: "Alipurduar", latitude: 26.7608, longitude: 89.5799, description: "Trek base camps and heritage-themed mountain stays.", roomType: "house", nightlyPrice: 4300, amenities: ["trek_support", "forest_view", "breakfast"] },
  { slug: "cooch-behar-palace", name: "Cooch Behar Palace", city: "Cooch Behar", district: "Cooch Behar", latitude: 26.3167, longitude: 89.442, description: "Royal district stays near palace museum belt.", roomType: "boutique", nightlyPrice: 3900, amenities: ["wifi", "parking", "step_free_entry"] },
  { slug: "bishnupur", name: "Bishnupur Terracotta Temples", city: "Bishnupur", district: "Bankura", latitude: 23.0742, longitude: 87.3197, description: "Craft-and-heritage stays near terracotta temple circuit.", roomType: "boutique", nightlyPrice: 4100, amenities: ["local_tours", "wifi", "workspace"] },
  { slug: "shantiniketan", name: "Shantiniketan", city: "Bolpur", district: "Birbhum", latitude: 23.6774, longitude: 87.6849, description: "Art district stays around Visva-Bharati and Sonajhuri.", roomType: "house", nightlyPrice: 4500, amenities: ["garden", "wifi", "self_check_in"] },
  { slug: "murshidabad-hazarduari", name: "Hazarduari Palace", city: "Murshidabad", district: "Murshidabad", latitude: 24.1954, longitude: 88.2716, description: "Nawab heritage stays near riverfront monuments.", roomType: "boutique", nightlyPrice: 4200, amenities: ["heritage_walks", "wifi", "parking"] },
  { slug: "mayapur", name: "Mayapur ISKCON", city: "Mayapur", district: "Nadia", latitude: 23.4226, longitude: 88.3882, description: "Pilgrim stays with temple shuttle and vegetarian meals.", roomType: "apartment", nightlyPrice: 3600, amenities: ["breakfast", "family_friendly", "wheelchair_accessible"] },
  { slug: "ajodhya-hills", name: "Ajodhya Hills", city: "Baghmundi", district: "Purulia", latitude: 23.2574, longitude: 86.1362, description: "Adventure stay for hill trails, waterfalls, and camps.", roomType: "house", nightlyPrice: 4300, amenities: ["trek_support", "campfire", "parking"] },
  { slug: "mukutmanipur", name: "Mukutmanipur", city: "Mukutmanipur", district: "Bankura", latitude: 22.9421, longitude: 86.7836, description: "Reservoir-view cottages for weekend road trips.", roomType: "villa", nightlyPrice: 5100, amenities: ["lake_view", "kitchen", "wifi"] },
  { slug: "junput", name: "Junput", city: "Junput", district: "Purba Medinipur", latitude: 21.726, longitude: 87.5606, description: "Quiet sea-side homes away from high-crowd beaches.", roomType: "house", nightlyPrice: 3900, amenities: ["beach_access", "parking", "pet_friendly"] },
  { slug: "raichak", name: "Raichak", city: "Raichak", district: "South 24 Parganas", latitude: 22.2207, longitude: 88.1104, description: "River-facing weekend stays along Hooghly stretch.", roomType: "villa", nightlyPrice: 6200, amenities: ["river_view", "pool", "wifi"], instantBooking: true },
];

const buildLocation = (spot: TouristSpotSeed): string =>
  `${spot.latitude},${spot.longitude},${spot.name}, ${spot.city}, ${spot.district}, West Bengal, India`;

const ensureUser = async (input: {
  id: string;
  email: string;
  name: string;
  role: string;
  superhost: boolean;
  passwordHash: string;
}) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        role: input.role,
        superhost: input.superhost,
        verified: true,
        responseRate: input.superhost ? 95 : 88,
        password: input.passwordHash,
      },
    });
  }

  return prisma.user.create({
    data: {
      id: input.id,
      email: input.email,
      password: input.passwordHash,
      name: input.name,
      role: input.role,
      verified: true,
      superhost: input.superhost,
      responseRate: input.superhost ? 95 : 88,
    },
  });
};

const upsertHostProfile = async (hostUserId: string, companyName: string) => {
  await prisma.hostProfile.upsert({
    where: { userId: hostUserId },
    update: {
      companyName,
      website: "https://mybnb.in",
      businessType: "agency",
      description: "Seed host profile for local testing and onboarding.",
      verified: true,
    },
    create: {
      userId: hostUserId,
      companyName,
      website: "https://mybnb.in",
      businessType: "agency",
      description: "Seed host profile for local testing and onboarding.",
      verified: true,
    },
  });
};

const seedUsers = async () => {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const admin = await ensureUser({ ...CORE_USERS.admin, passwordHash });
  const guest = await ensureUser({ ...CORE_USERS.guest, passwordHash });
  const user = await ensureUser({ ...CORE_USERS.user, passwordHash });

  const hosts = [] as Array<{ id: string; email: string; name: string }>;

  for (const hostSeed of CORE_USERS.hosts) {
    const host = await ensureUser({ ...hostSeed, passwordHash });
    await upsertHostProfile(host.id, `${host.name} Hospitality`);
    hosts.push({ id: host.id, email: host.email, name: host.name });
  }

  return { admin, guest, user, hosts };
};

const seedHotelsAndRooms = async (hostIds: string[]) => {
  const now = new Date();
  const promotedUntil = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 45);

  for (let i = 0; i < WEST_BENGAL_TOURIST_SPOTS.length; i += 1) {
    const spot = WEST_BENGAL_TOURIST_SPOTS[i];
    const ownerId = hostIds[i % hostIds.length];
    const hotelId = `seed-wb-hotel-${spot.slug}`;

    await prisma.hotel.upsert({
      where: { id: hotelId },
      update: {
        ownerId,
        name: `${spot.name} Stay`,
        description: spot.description,
        location: buildLocation(spot),
        amenities: JSON.stringify(spot.amenities),
        publicRules:
          "No smoking indoors. Respect local neighborhood quiet hours after 10 PM.",
        checkInTime: "13:00",
        checkOutTime: "10:00",
        instantBooking: Boolean(spot.instantBooking),
        isPromoted: Boolean(spot.isPromoted),
        promotedUntil: spot.isPromoted ? promotedUntil : null,
      },
      create: {
        id: hotelId,
        ownerId,
        name: `${spot.name} Stay`,
        description: spot.description,
        location: buildLocation(spot),
        amenities: JSON.stringify(spot.amenities),
        publicRules:
          "No smoking indoors. Respect local neighborhood quiet hours after 10 PM.",
        checkInTime: "13:00",
        checkOutTime: "10:00",
        instantBooking: Boolean(spot.instantBooking),
        isPromoted: Boolean(spot.isPromoted),
        promotedUntil: spot.isPromoted ? promotedUntil : null,
      },
    });

    await prisma.room.upsert({
      where: { id: `seed-wb-room-${spot.slug}-std` },
      update: {
        hotelId,
        roomType: spot.roomType,
        capacity: 2,
        maxGuests: 2,
        basePrice: spot.nightlyPrice,
        amenities: JSON.stringify(spot.amenities),
        images: JSON.stringify([
          `https://images.mybnb.in/seed/wb/${spot.slug}/standard-1.jpg`,
          `https://images.mybnb.in/seed/wb/${spot.slug}/standard-2.jpg`,
        ]),
      },
      create: {
        id: `seed-wb-room-${spot.slug}-std`,
        hotelId,
        roomType: spot.roomType,
        capacity: 2,
        maxGuests: 2,
        basePrice: spot.nightlyPrice,
        amenities: JSON.stringify(spot.amenities),
        images: JSON.stringify([
          `https://images.mybnb.in/seed/wb/${spot.slug}/standard-1.jpg`,
          `https://images.mybnb.in/seed/wb/${spot.slug}/standard-2.jpg`,
        ]),
      },
    });

    await prisma.room.upsert({
      where: { id: `seed-wb-room-${spot.slug}-family` },
      update: {
        hotelId,
        roomType: "house",
        capacity: 4,
        maxGuests: 5,
        basePrice: Math.round(spot.nightlyPrice * 1.35),
        amenities: JSON.stringify([...spot.amenities, "family_friendly", "kitchen"]),
        images: JSON.stringify([
          `https://images.mybnb.in/seed/wb/${spot.slug}/family-1.jpg`,
          `https://images.mybnb.in/seed/wb/${spot.slug}/family-2.jpg`,
        ]),
      },
      create: {
        id: `seed-wb-room-${spot.slug}-family`,
        hotelId,
        roomType: "house",
        capacity: 4,
        maxGuests: 5,
        basePrice: Math.round(spot.nightlyPrice * 1.35),
        amenities: JSON.stringify([...spot.amenities, "family_friendly", "kitchen"]),
        images: JSON.stringify([
          `https://images.mybnb.in/seed/wb/${spot.slug}/family-1.jpg`,
          `https://images.mybnb.in/seed/wb/${spot.slug}/family-2.jpg`,
        ]),
      },
    });
  }
};

const seedSearchHistory = async (guestUserId: string) => {
  const searchLocations = [
    "Darjeeling, West Bengal, India",
    "Digha, West Bengal, India",
    "Sundarbans, West Bengal, India",
    "Shantiniketan, West Bengal, India",
    "Bishnupur, West Bengal, India",
    "Jaldapara, West Bengal, India",
    "Kalimpong, West Bengal, India",
    "Kolkata, West Bengal, India",
  ];

  for (let i = 0; i < searchLocations.length; i += 1) {
    await prisma.searchHistory.upsert({
      where: { id: `seed-searchhistory-${i + 1}` },
      update: {
        userId: guestUserId,
        queryLocation: searchLocations[i],
        guests: 2,
      },
      create: {
        id: `seed-searchhistory-${i + 1}`,
        userId: guestUserId,
        queryLocation: searchLocations[i],
        guests: 2,
      },
    });
  }
};

export const runSeed = async () => {
  console.log("Starting seed: core users + West Bengal tourist spot hotels");

  const users = await seedUsers();
  await seedHotelsAndRooms(users.hosts.map((h) => h.id));
  await seedSearchHistory(users.guest.id);

  const [usersCount, hotelsCount, roomsCount] = await Promise.all([
    prisma.user.count(),
    prisma.hotel.count(),
    prisma.room.count(),
  ]);

  console.log("Seed complete");
  console.log({
    testPassword: DEFAULT_PASSWORD,
    adminId: users.admin.id,
    guestId: users.guest.id,
    userId: users.user.id,
    hostIds: users.hosts.map((h) => h.id),
    westBengalHotelSpotsSeeded: WEST_BENGAL_TOURIST_SPOTS.length,
    totals: {
      users: usersCount,
      hotels: hotelsCount,
      rooms: roomsCount,
    },
  });
};

if (require.main === module) {
  runSeed()
    .catch((error) => {
      console.error("Seed failed", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
