"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const zod_1 = require("zod");
const multer_1 = tslib_1.__importDefault(require("multer"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const room_service_1 = require("../services/room.service");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
}); // 10MB
// Validation schemas
const createRoomSchema = zod_1.z.object({
    roomType: zod_1.z.string().min(1),
    capacity: zod_1.z.number().int().positive(),
    maxGuests: zod_1.z.number().int().positive(),
    basePrice: zod_1.z.number().positive(),
    amenities: zod_1.z.array(zod_1.z.string()).optional(),
});
const updateRoomSchema = createRoomSchema.partial();
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
// Create room (host only)
router.post("/hotel/:hotelId", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const data = createRoomSchema.parse(req.body);
        const hotelId = getParam(req.params.hotelId);
        const room = await room_service_1.roomService.createRoom(hotelId, req.userId, data);
        res.status(201).json((0, response_1.successResponse)(room, "Room created successfully"));
    }
    catch (error) {
        next(error);
    }
});
// Get room by ID
router.get("/:id", async (req, res, next) => {
    try {
        const roomId = getParam(req.params.id);
        const room = await room_service_1.roomService.getRoomById(roomId);
        res.json((0, response_1.successResponse)(room, "Room retrieved"));
    }
    catch (error) {
        next(error);
    }
});
// Check availability
router.get("/:id/available", async (req, res, next) => {
    try {
        const checkIn = new Date(req.query.checkIn);
        const checkOut = new Date(req.query.checkOut);
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            return res
                .status(400)
                .json((0, response_1.errorResponse)("INVALID_INPUT", "Invalid date format"));
        }
        const roomId = getParam(req.params.id);
        const availability = await room_service_1.roomService.checkAvailability(roomId, checkIn, checkOut);
        res.json((0, response_1.successResponse)(availability, "Availability checked"));
    }
    catch (error) {
        next(error);
    }
});
// Get pricing
router.get("/:id/pricing", async (req, res, next) => {
    try {
        const checkIn = new Date(req.query.checkIn);
        const checkOut = new Date(req.query.checkOut);
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            return res
                .status(400)
                .json((0, response_1.errorResponse)("INVALID_INPUT", "Invalid date format"));
        }
        const roomId = getParam(req.params.id);
        const pricing = await room_service_1.roomService.getPricing(roomId, {
            checkIn,
            checkOut,
        });
        res.json((0, response_1.successResponse)(pricing, "Pricing calculated"));
    }
    catch (error) {
        next(error);
    }
});
// Update room (host only)
router.put("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const data = updateRoomSchema.parse(req.body);
        const roomId = getParam(req.params.id);
        const room = await room_service_1.roomService.updateRoom(roomId, req.userId, data);
        res.json((0, response_1.successResponse)(room, "Room updated successfully"));
    }
    catch (error) {
        next(error);
    }
});
// Delete room (host only)
router.delete("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const roomId = getParam(req.params.id);
        const result = await room_service_1.roomService.deleteRoom(roomId, req.userId);
        res.json((0, response_1.successResponse)(result, "Room deleted successfully"));
    }
    catch (error) {
        next(error);
    }
});
// Get presigned URL for image upload (host only)
router.get("/:id/images/presigned-url", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const fileName = req.query.fileName;
        if (!fileName) {
            return res
                .status(400)
                .json((0, response_1.errorResponse)("INVALID_INPUT", "fileName is required"));
        }
        const roomId = getParam(req.params.id);
        const result = await room_service_1.roomService.getPresignedUrl(roomId, req.userId, fileName);
        res.json((0, response_1.successResponse)(result, "Presigned URL generated"));
    }
    catch (error) {
        next(error);
    }
});
// Upload image directly (host only, optional endpoint)
router.post("/:id/images", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), upload.single("image"), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        if (!req.file) {
            return res
                .status(400)
                .json((0, response_1.errorResponse)("INVALID_INPUT", "No file provided"));
        }
        const roomId = getParam(req.params.id);
        const result = await room_service_1.roomService.uploadImage(roomId, req.userId, req.file.originalname, req.file.buffer);
        res
            .status(201)
            .json((0, response_1.successResponse)(result, "Image uploaded successfully"));
    }
    catch (error) {
        next(error);
    }
});
// Delete image (host only)
router.delete("/:id/images/:imageKey", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), async (req, res, next) => {
    try {
        if (!req.userId) {
            return res
                .status(401)
                .json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
        }
        const roomId = getParam(req.params.id);
        const imageKey = getParam(req.params.imageKey);
        const result = await room_service_1.roomService.deleteImage(roomId, req.userId, imageKey);
        res.json((0, response_1.successResponse)(result, "Image deleted successfully"));
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
