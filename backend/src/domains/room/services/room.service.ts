import { prisma } from '../../../config/database';
import { getMinioClient } from '../../../config/minio';
import { env } from '../../../config/environment';
import { AppError } from '../../../utils';

interface PricingParams {
  checkIn: Date;
  checkOut: Date;
}

export const calculatePricing = (
  basePrice: number,
  nights: number,
  cleaningFee: number = 0,
  taxRate: number = 0.05,
  serviceFeePercent: number = 13
) => {
  const subtotal = basePrice * nights + cleaningFee;
  const serviceCharge = Math.min(subtotal * (serviceFeePercent / 100), subtotal * 0.3); // Cap at 30%
  const taxes = (subtotal + serviceCharge) * taxRate;
  const total = subtotal + serviceCharge + taxes;

  return {
    basePrice,
    nights,
    cleaningFee,
    subtotal,
    serviceCharge,
    taxes,
    total,
  };
};

export const roomService = {
  async createRoom(
    hotelId: string,
    ownerId: string,
    data: {
      roomType: string;
      capacity: number;
      maxGuests: number;
      basePrice: number;
      amenities?: string[];
    }
  ) {
    // Verify hotel ownership
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!hotel || hotel.ownerId !== ownerId) {
      throw new AppError('Unauthorized', 403);
    }

    const room = await prisma.room.create({
      data: {
        hotelId,
        roomType: data.roomType,
        capacity: data.capacity,
        maxGuests: data.maxGuests,
        basePrice: data.basePrice,
        amenities: JSON.stringify(data.amenities || []),
      },
    });

    return room;
  },

  async getRoomById(roomId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            location: true,
            checkInTime: true,
            checkOutTime: true,
          },
        },
      },
    });

    if (!room) {
      throw new AppError('Room not found', 404);
    }

    return room;
  },

  async checkAvailability(roomId: string, checkIn: Date, checkOut: Date) {
    // Verify room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new AppError('Room not found', 404);
    }

    // Check for blocked dates
    const blockedDates = await prisma.blockedDates.findMany({
      where: {
        roomId,
        startDate: { lte: checkOut },
        endDate: { gte: checkIn },
      },
    });

    if (blockedDates.length > 0) {
      return { isAvailable: false, reason: 'Room is blocked for these dates' };
    }

    // Check for existing bookings
    const existingBooking = await prisma.booking.findFirst({
      where: {
        roomId,
        checkIn: { lte: checkOut },
        checkOut: { gte: checkIn },
        status: {
          in: ['pending', 'confirmed', 'checked_in'],
        },
      },
    });

    if (existingBooking) {
      return { isAvailable: false, reason: 'Room is already booked' };
    }

    return { isAvailable: true };
  },

  async getPricing(roomId: string, params: PricingParams) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new AppError('Room not found', 404);
    }

    const nights = Math.ceil(
      (params.checkOut.getTime() - params.checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
      throw new AppError('Check-out must be after check-in', 400);
    }

    // Get tax configuration
    const taxConfig = await prisma.taxConfiguration.findFirst({
      where: { region: 'default' },
    });

    const taxRate = taxConfig ? taxConfig.taxPercentage / 100 : 0.05;

    const pricing = calculatePricing(room.basePrice, nights, 0, taxRate);

    return {
      ...pricing,
      currency: 'INR',
    };
  },

  async updateRoom(roomId: string, ownerId: string, data: any) {
    // Verify ownership
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { hotel: true },
    });

    if (!room || room.hotel.ownerId !== ownerId) {
      throw new AppError('Unauthorized', 403);
    }

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: {
        ...(data.roomType && { roomType: data.roomType }),
        ...(data.capacity && { capacity: data.capacity }),
        ...(data.maxGuests && { maxGuests: data.maxGuests }),
        ...(data.basePrice && { basePrice: data.basePrice }),
        ...(data.amenities && { amenities: JSON.stringify(data.amenities) }),
      },
    });

    return updated;
  },

  async deleteRoom(roomId: string, ownerId: string) {
    // Verify ownership
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { hotel: true },
    });

    if (!room || room.hotel.ownerId !== ownerId) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.room.delete({
      where: { id: roomId },
    });

    return { message: 'Room deleted successfully' };
  },

  async uploadImage(roomId: string, ownerId: string, fileName: string, fileBuffer: Buffer) {
    // Verify room ownership
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { hotel: true },
    });

    if (!room || room.hotel.ownerId !== ownerId) {
      throw new AppError('Unauthorized', 403);
    }

    const minioClient = getMinioClient();
    const bucket = `${env.MINIO_BUCKET_PREFIX}-room-images`;
    const objectKey = `${room.hotel.id}/${roomId}/${Date.now()}_${fileName}`;

    try {
      await minioClient.putObject(bucket, objectKey, fileBuffer);

      const publicUrl = `http://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${bucket}/${objectKey}`;

      // Update room with image
      const currentImages = JSON.parse(room.images || '[]');
      currentImages.push({
        key: objectKey,
        url: publicUrl,
        uploadedAt: new Date(),
      });

      const updated = await prisma.room.update({
        where: { id: roomId },
        data: { images: JSON.stringify(currentImages) },
      });

      return {
        imageUrl: publicUrl,
        room: updated,
      };
    } catch (error) {
      console.error('MinIO upload error:', error);
      throw error;
    }
  },

  async getPresignedUrl(roomId: string, ownerId: string, fileName: string) {
    // Verify room ownership
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { hotel: true },
    });

    if (!room || room.hotel.ownerId !== ownerId) {
      throw new AppError('Unauthorized', 403);
    }

    const minioClient = getMinioClient();
    const bucket = `${env.MINIO_BUCKET_PREFIX}-room-images`;
    const objectKey = `${room.hotel.id}/${roomId}/${Date.now()}_${fileName}`;

    try {
      const presignedUrl = await minioClient.presignedPutObject(bucket, objectKey, 3600); // 1 hour

      return {
        presignedUrl,
        bucket,
        objectKey,
      };
    } catch (error) {
      console.error('Presigned URL generation error:', error);
      throw error;
    }
  },

  async deleteImage(roomId: string, ownerId: string, imageKey: string) {
    // Verify room ownership
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { hotel: true },
    });

    if (!room || room.hotel.ownerId !== ownerId) {
      const error = new Error('Unauthorized') as Error & { status?: number };
      error.status = 403;
      throw error;
    }

    const minioClient = getMinioClient();
    const bucket = `${env.MINIO_BUCKET_PREFIX}-room-images`;

    try {
      await minioClient.removeObject(bucket, imageKey);

      // Remove from room images list
      const currentImages = JSON.parse(room.images || '[]').filter(
        (img: any) => img.key !== imageKey
      );

      const updated = await prisma.room.update({
        where: { id: roomId },
        data: { images: JSON.stringify(currentImages) },
      });

      return updated;
    } catch (error) {
      console.error('Image deletion error:', error);
      throw error;
    }
  },
};

export default roomService;
