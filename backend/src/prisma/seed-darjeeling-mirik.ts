import "dotenv/config";

import bcrypt from "bcrypt";
import { prisma } from "../config/database";
import { env } from "../config/environment";
import { getMinioClient, initializeMinIOBuckets } from "../config/minio";
import {
  DARJEELING_MIRIK_HOTELS,
  ScenicSeedHotel,
} from "./data/darjeeling-mirik.seed-data";

const TEST_PASSWORD = "Pass@12345";
const HOST_EMAIL = "host.hills@mybnb.in";
const HOST_USER_ID = "seed-host-002";

const roomBucket = `${env.MINIO_BUCKET_PREFIX}-room-images`;

const ensureHillHost = async () => {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const existing = await prisma.user.findUnique({ where: { email: HOST_EMAIL } });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "host",
        verified: true,
        superhost: true,
        responseRate: 96,
      },
    });
  }

  return prisma.user.create({
    data: {
      id: HOST_USER_ID,
      email: HOST_EMAIL,
      password: passwordHash,
      name: "Hills Host",
      role: "host",
      verified: true,
      superhost: true,
      responseRate: 96,
    },
  });
};

const contentTypeToExt = (contentType: string | null) => {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
};

const publicMinioUrl = (bucket: string, objectKey: string) => {
  const protocol = env.MINIO_USE_SSL ? "https" : "http";
  return `${protocol}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${bucket}/${objectKey}`;
};

const uploadRemoteImageToMinio = async (
  hotelSlug: string,
  roomSlug: string,
  sourceUrl: string,
  index: number,
) => {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status}) for ${sourceUrl}`);
  }

  const bytes = await response.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = contentTypeToExt(response.headers.get("content-type"));
  const objectKey = `${hotelSlug}/${roomSlug}/seed-${index + 1}.${ext}`;

  const minio = getMinioClient();
  await minio.putObject(
    roomBucket,
    objectKey,
    buffer,
    buffer.length,
    {
      "Content-Type": response.headers.get("content-type") || "image/jpeg",
      "x-amz-meta-source-url": sourceUrl,
    },
  );

  return publicMinioUrl(roomBucket, objectKey);
};

const buildLocation = (hotel: ScenicSeedHotel) =>
  `${hotel.latitude},${hotel.longitude},${hotel.name}, ${hotel.city}, ${hotel.district}, West Bengal, India`;

const upsertHotelWithRooms = async (hotel: ScenicSeedHotel, hostId: string) => {
  const hotelId = `seed-dm-hotel-${hotel.slug}`;
  const stdRoomId = `seed-dm-room-${hotel.slug}-std`;
  const familyRoomId = `seed-dm-room-${hotel.slug}-family`;

  const uploadedImages = await Promise.all(
    hotel.imageSources.map((sourceUrl, index) =>
      uploadRemoteImageToMinio(hotel.slug, "std", sourceUrl, index),
    ),
  );

  await prisma.hotel.upsert({
    where: { id: hotelId },
    update: {
      ownerId: hostId,
      name: hotel.name,
      description: hotel.description,
      location: buildLocation(hotel),
      amenities: JSON.stringify(hotel.amenities),
      publicRules:
        "No loud music after 10 PM. Keep windows closed during heavy rain/wind alerts.",
      checkInTime: "13:00",
      checkOutTime: "10:00",
      instantBooking: true,
      isPromoted: true,
    },
    create: {
      id: hotelId,
      ownerId: hostId,
      name: hotel.name,
      description: hotel.description,
      location: buildLocation(hotel),
      amenities: JSON.stringify(hotel.amenities),
      publicRules:
        "No loud music after 10 PM. Keep windows closed during heavy rain/wind alerts.",
      checkInTime: "13:00",
      checkOutTime: "10:00",
      instantBooking: true,
      isPromoted: true,
    },
  });

  await prisma.room.upsert({
    where: { id: stdRoomId },
    update: {
      hotelId,
      roomType: hotel.roomType,
      capacity: 2,
      maxGuests: 2,
      basePrice: hotel.nightlyPrice,
      amenities: JSON.stringify(hotel.amenities),
      images: JSON.stringify(uploadedImages),
    },
    create: {
      id: stdRoomId,
      hotelId,
      roomType: hotel.roomType,
      capacity: 2,
      maxGuests: 2,
      basePrice: hotel.nightlyPrice,
      amenities: JSON.stringify(hotel.amenities),
      images: JSON.stringify(uploadedImages),
    },
  });

  await prisma.room.upsert({
    where: { id: familyRoomId },
    update: {
      hotelId,
      roomType: "house",
      capacity: 4,
      maxGuests: 5,
      basePrice: Math.round(hotel.nightlyPrice * 1.3),
      amenities: JSON.stringify([...hotel.amenities, "family_friendly", "kitchen"]),
      images: JSON.stringify(uploadedImages),
    },
    create: {
      id: familyRoomId,
      hotelId,
      roomType: "house",
      capacity: 4,
      maxGuests: 5,
      basePrice: Math.round(hotel.nightlyPrice * 1.3),
      amenities: JSON.stringify([...hotel.amenities, "family_friendly", "kitchen"]),
      images: JSON.stringify(uploadedImages),
    },
  });
};

export const runDarjeelingMirikSeed = async () => {
  console.log("Starting Darjeeling + Mirik MinIO image seed...");

  await initializeMinIOBuckets();
  const host = await ensureHillHost();

  for (const hotel of DARJEELING_MIRIK_HOTELS) {
    await upsertHotelWithRooms(hotel, host.id);
  }

  const hotelsCount = await prisma.hotel.count({
    where: {
      id: {
        in: DARJEELING_MIRIK_HOTELS.map((hotel) => `seed-dm-hotel-${hotel.slug}`),
      },
    },
  });

  console.log("Darjeeling + Mirik seed complete");
  console.log({
    hostId: host.id,
    hotelsSeeded: hotelsCount,
    roomBucket,
    note:
      "Replace imageSources with links you are licensed to use before production usage.",
  });
};

if (require.main === module) {
  runDarjeelingMirikSeed()
    .catch((error) => {
      console.error("Darjeeling/Mirik seed failed", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
