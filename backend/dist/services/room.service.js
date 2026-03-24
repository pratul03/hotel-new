"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomService = exports.calculatePricing = void 0;
const database_1 = require("../config/database");
const minio_1 = require("../config/minio");
const environment_1 = require("../config/environment");
const utils_1 = require("../utils");
const calculatePricing = (basePrice, nights, cleaningFee = 0, taxRate = 0.05, serviceFeePercent = 13) => {
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
exports.calculatePricing = calculatePricing;
exports.roomService = {
    async createRoom(hotelId, ownerId, data) {
        // Verify hotel ownership
        const hotel = await database_1.prisma.hotel.findUnique({
            where: { id: hotelId },
        });
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new utils_1.AppError('Unauthorized', 403);
        }
        const room = await database_1.prisma.room.create({
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
    async getRoomById(roomId) {
        const room = await database_1.prisma.room.findUnique({
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
            throw new utils_1.AppError('Room not found', 404);
        }
        return room;
    },
    async checkAvailability(roomId, checkIn, checkOut) {
        // Verify room exists
        const room = await database_1.prisma.room.findUnique({
            where: { id: roomId },
        });
        if (!room) {
            throw new utils_1.AppError('Room not found', 404);
        }
        // Check for blocked dates
        const blockedDates = await database_1.prisma.blockedDates.findMany({
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
        const existingBooking = await database_1.prisma.booking.findFirst({
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
    async getPricing(roomId, params) {
        const room = await database_1.prisma.room.findUnique({
            where: { id: roomId },
        });
        if (!room) {
            throw new utils_1.AppError('Room not found', 404);
        }
        const nights = Math.ceil((params.checkOut.getTime() - params.checkIn.getTime()) / (1000 * 60 * 60 * 24));
        if (nights <= 0) {
            throw new utils_1.AppError('Check-out must be after check-in', 400);
        }
        // Get tax configuration
        const taxConfig = await database_1.prisma.taxConfiguration.findFirst({
            where: { region: 'default' },
        });
        const taxRate = taxConfig ? taxConfig.taxPercentage / 100 : 0.05;
        const pricing = (0, exports.calculatePricing)(room.basePrice, nights, 0, taxRate);
        return {
            ...pricing,
            currency: 'INR',
        };
    },
    async updateRoom(roomId, ownerId, data) {
        // Verify ownership
        const room = await database_1.prisma.room.findUnique({
            where: { id: roomId },
            include: { hotel: true },
        });
        if (!room || room.hotel.ownerId !== ownerId) {
            throw new utils_1.AppError('Unauthorized', 403);
        }
        const updated = await database_1.prisma.room.update({
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
    async deleteRoom(roomId, ownerId) {
        // Verify ownership
        const room = await database_1.prisma.room.findUnique({
            where: { id: roomId },
            include: { hotel: true },
        });
        if (!room || room.hotel.ownerId !== ownerId) {
            throw new utils_1.AppError('Unauthorized', 403);
        }
        await database_1.prisma.room.delete({
            where: { id: roomId },
        });
        return { message: 'Room deleted successfully' };
    },
    async uploadImage(roomId, ownerId, fileName, fileBuffer) {
        // Verify room ownership
        const room = await database_1.prisma.room.findUnique({
            where: { id: roomId },
            include: { hotel: true },
        });
        if (!room || room.hotel.ownerId !== ownerId) {
            throw new utils_1.AppError('Unauthorized', 403);
        }
        const minioClient = (0, minio_1.getMinioClient)();
        const bucket = `${environment_1.env.MINIO_BUCKET_PREFIX}-room-images`;
        const objectKey = `${room.hotel.id}/${roomId}/${Date.now()}_${fileName}`;
        try {
            await minioClient.putObject(bucket, objectKey, fileBuffer);
            const publicUrl = `http://${environment_1.env.MINIO_ENDPOINT}:${environment_1.env.MINIO_PORT}/${bucket}/${objectKey}`;
            // Update room with image
            const currentImages = JSON.parse(room.images || '[]');
            currentImages.push({
                key: objectKey,
                url: publicUrl,
                uploadedAt: new Date(),
            });
            const updated = await database_1.prisma.room.update({
                where: { id: roomId },
                data: { images: JSON.stringify(currentImages) },
            });
            return {
                imageUrl: publicUrl,
                room: updated,
            };
        }
        catch (error) {
            console.error('MinIO upload error:', error);
            throw error;
        }
    },
    async getPresignedUrl(roomId, ownerId, fileName) {
        // Verify room ownership
        const room = await database_1.prisma.room.findUnique({
            where: { id: roomId },
            include: { hotel: true },
        });
        if (!room || room.hotel.ownerId !== ownerId) {
            throw new utils_1.AppError('Unauthorized', 403);
        }
        const minioClient = (0, minio_1.getMinioClient)();
        const bucket = `${environment_1.env.MINIO_BUCKET_PREFIX}-room-images`;
        const objectKey = `${room.hotel.id}/${roomId}/${Date.now()}_${fileName}`;
        try {
            const presignedUrl = await minioClient.presignedPutObject(bucket, objectKey, 3600); // 1 hour
            return {
                presignedUrl,
                bucket,
                objectKey,
            };
        }
        catch (error) {
            console.error('Presigned URL generation error:', error);
            throw error;
        }
    },
    async deleteImage(roomId, ownerId, imageKey) {
        // Verify room ownership
        const room = await database_1.prisma.room.findUnique({
            where: { id: roomId },
            include: { hotel: true },
        });
        if (!room || room.hotel.ownerId !== ownerId) {
            const error = new Error('Unauthorized');
            error.status = 403;
            throw error;
        }
        const minioClient = (0, minio_1.getMinioClient)();
        const bucket = `${environment_1.env.MINIO_BUCKET_PREFIX}-room-images`;
        try {
            await minioClient.removeObject(bucket, imageKey);
            // Remove from room images list
            const currentImages = JSON.parse(room.images || '[]').filter((img) => img.key !== imageKey);
            const updated = await database_1.prisma.room.update({
                where: { id: roomId },
                data: { images: JSON.stringify(currentImages) },
            });
            return updated;
        }
        catch (error) {
            console.error('Image deletion error:', error);
            throw error;
        }
    },
};
exports.default = exports.roomService;
