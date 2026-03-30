"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomController = void 0;
const response_1 = require("../../../utils/response");
const room_queries_1 = require("../queries/room.queries");
const room_schema_1 = require("../schemas/room.schema");
const room_service_1 = require("../services/room.service");
exports.roomController = {
    async create(req, res) {
        const userId = room_queries_1.roomQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const data = room_schema_1.createRoomSchema.parse(req.body);
        const room = await room_service_1.roomService.createRoom(room_queries_1.roomQueries.hotelId(req), userId, data);
        res.status(201).json((0, response_1.successResponse)(room, "Room created successfully"));
    },
    async getById(req, res) {
        const room = await room_service_1.roomService.getRoomById(room_queries_1.roomQueries.id(req));
        res.json((0, response_1.successResponse)(room, "Room retrieved"));
    },
    async checkAvailability(req, res) {
        const { checkIn, checkOut } = room_queries_1.roomQueries.dateRange(req);
        const availability = await room_service_1.roomService.checkAvailability(room_queries_1.roomQueries.id(req), checkIn, checkOut);
        res.json((0, response_1.successResponse)(availability, "Availability checked"));
    },
    async getPricing(req, res) {
        const { checkIn, checkOut } = room_queries_1.roomQueries.dateRange(req);
        const pricing = await room_service_1.roomService.getPricing(room_queries_1.roomQueries.id(req), {
            checkIn,
            checkOut,
        });
        res.json((0, response_1.successResponse)(pricing, "Pricing calculated"));
    },
    async update(req, res) {
        const userId = room_queries_1.roomQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const data = room_schema_1.updateRoomSchema.parse(req.body);
        const room = await room_service_1.roomService.updateRoom(room_queries_1.roomQueries.id(req), userId, data);
        res.json((0, response_1.successResponse)(room, "Room updated successfully"));
    },
    async delete(req, res) {
        const userId = room_queries_1.roomQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const result = await room_service_1.roomService.deleteRoom(room_queries_1.roomQueries.id(req), userId);
        res.json((0, response_1.successResponse)(result, "Room deleted successfully"));
    },
    async getPresignedUrl(req, res) {
        const userId = room_queries_1.roomQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const result = await room_service_1.roomService.getPresignedUrl(room_queries_1.roomQueries.id(req), userId, room_queries_1.roomQueries.fileName(req));
        res.json((0, response_1.successResponse)(result, "Presigned URL generated"));
    },
    async uploadImage(req, res) {
        const userId = room_queries_1.roomQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const file = req.file;
        if (!file) {
            res.status(400).json((0, response_1.errorResponse)("INVALID_INPUT", "No file provided"));
            return;
        }
        const result = await room_service_1.roomService.uploadImage(room_queries_1.roomQueries.id(req), userId, file.originalname, file.buffer);
        res
            .status(201)
            .json((0, response_1.successResponse)(result, "Image uploaded successfully"));
    },
    async deleteImage(req, res) {
        const userId = room_queries_1.roomQueries.userId(req);
        if (!userId) {
            res.status(401).json((0, response_1.errorResponse)("UNAUTHORIZED", "User not found"));
            return;
        }
        const result = await room_service_1.roomService.deleteImage(room_queries_1.roomQueries.id(req), userId, room_queries_1.roomQueries.imageKey(req));
        res.json((0, response_1.successResponse)(result, "Image deleted successfully"));
    },
};
exports.default = exports.roomController;
