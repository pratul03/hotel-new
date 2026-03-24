"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const promoter_service_1 = require("../services/promoter.service");
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
// Get promoter profile (self)
router.get("/profile", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["hotelPromoter", "admin"]), async (req, res, next) => {
    try {
        const profile = await promoter_service_1.promoterService.getProfile(req.userId);
        res.json((0, response_1.successResponse)(profile, "Promoter profile retrieved"));
    }
    catch (error) {
        next(error);
    }
});
// Create promoter profile
router.post("/profile", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["hotelPromoter"]), async (req, res, next) => {
    try {
        const data = profileSchema.parse(req.body);
        const profile = await promoter_service_1.promoterService.createProfile(req.userId, data);
        res
            .status(201)
            .json((0, response_1.successResponse)(profile, "Promoter profile created"));
    }
    catch (error) {
        next(error);
    }
});
// Update promoter profile
router.put("/profile", authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(["hotelPromoter", "admin"]), async (req, res, next) => {
    try {
        const data = updateProfileSchema.parse(req.body);
        const profile = await promoter_service_1.promoterService.updateProfile(req.userId, data);
        res.json((0, response_1.successResponse)(profile, "Promoter profile updated"));
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
