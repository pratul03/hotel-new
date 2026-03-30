"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const utils_1 = require("../../../utils");
const host_profile_controller_1 = require("../controllers/host-profile.controller");
const router = (0, express_1.Router)();
// Get host profile (self)
router.get("/profile", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(host_profile_controller_1.hostprofileController.getProfile));
// Create host profile
router.post("/profile", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), (0, utils_1.catchAsync)(host_profile_controller_1.hostprofileController.createProfile));
// Update host profile
router.put("/profile", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), (0, utils_1.catchAsync)(host_profile_controller_1.hostprofileController.updateProfile));
exports.default = router;
