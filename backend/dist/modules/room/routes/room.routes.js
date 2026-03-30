"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const multer_1 = tslib_1.__importDefault(require("multer"));
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const utils_1 = require("../../../utils");
const room_controller_1 = require("../controllers/room.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
}); // 10MB
// Create room (host only)
router.post("/hotel/:hotelId", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), (0, utils_1.catchAsync)(room_controller_1.roomController.create));
// Get room by ID
router.get("/:id", (0, utils_1.catchAsync)(room_controller_1.roomController.getById));
// Check availability
router.get("/:id/available", (0, utils_1.catchAsync)(room_controller_1.roomController.checkAvailability));
// Get pricing
router.get("/:id/pricing", (0, utils_1.catchAsync)(room_controller_1.roomController.getPricing));
// Update room (host only)
router.put("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), (0, utils_1.catchAsync)(room_controller_1.roomController.update));
// Delete room (host only)
router.delete("/:id", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), (0, utils_1.catchAsync)(room_controller_1.roomController.delete));
// Get presigned URL for image upload (host only)
router.get("/:id/images/presigned-url", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), (0, utils_1.catchAsync)(room_controller_1.roomController.getPresignedUrl));
// Upload image directly (host only, optional endpoint)
router.post("/:id/images", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), upload.single("image"), (0, utils_1.catchAsync)(room_controller_1.roomController.uploadImage));
// Delete image (host only)
router.delete("/:id/images/:imageKey", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), (0, utils_1.catchAsync)(room_controller_1.roomController.deleteImage));
exports.default = router;
