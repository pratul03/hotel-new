"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const host_profile_service_1 = require("../services/host-profile.service");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
const profileSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(2, "Company name must be at least 2 characters"),
    website: zod_1.z.string().url("Invalid URL").optional().or(zod_1.z.literal("")),
    businessType: zod_1.z
        .enum(["agency", "chain", "management_company", "individual"])
        .optional(),
    description: zod_1.z.string().max(1000).optional(),
});
const updateProfileSchema = profileSchema.partial();
// Get host profile (self)
router.get("/profile", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        const profile = await host_profile_service_1.hostProfileService.getProfile(req.userId);
        res.json((0, response_1.successResponse)(profile, "Host profile retrieved"));
    }
    catch (error) {
        next(error);
    }
});
// Create host profile
router.post("/profile", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host"]), async (req, res, next) => {
    try {
        const data = profileSchema.parse(req.body);
        const profile = await host_profile_service_1.hostProfileService.createProfile(req.userId, data);
        res.status(201).json((0, response_1.successResponse)(profile, "Host profile created"));
    }
    catch (error) {
        next(error);
    }
});
// Update host profile
router.put("/profile", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["host", "admin"]), async (req, res, next) => {
    try {
        const data = updateProfileSchema.parse(req.body);
        const profile = await host_profile_service_1.hostProfileService.updateProfile(req.userId, data);
        res.json((0, response_1.successResponse)(profile, "Host profile updated"));
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
