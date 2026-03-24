"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const utils_1 = require("../utils");
const user_service_1 = require("../services/user.service");
const router = (0, express_1.Router)();
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    avatar: zod_1.z.string().url().optional(),
});
const addDocumentSchema = zod_1.z.object({
    documentType: zod_1.z.string().min(1),
    docUrl: zod_1.z.string().url(),
});
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
router.get("/:id/profile", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const userId = getParam(req.params.id);
    const profile = await user_service_1.userService.getProfile(userId);
    res.json((0, utils_1.successResponse)(profile, "Profile fetched"));
}));
router.put("/:id/profile", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const userId = getParam(req.params.id);
    const data = updateProfileSchema.parse(req.body);
    const profile = await user_service_1.userService.updateProfile(userId, data);
    res.json((0, utils_1.successResponse)(profile, "Profile updated"));
}));
router.post("/:id/verify-document", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const userId = getParam(req.params.id);
    const { documentType, docUrl } = addDocumentSchema.parse(req.body);
    const doc = await user_service_1.userService.addDocument(userId, documentType, docUrl);
    res.status(201).json((0, utils_1.successResponse)(doc, "Document added"));
}));
router.get("/:id/documents", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const userId = getParam(req.params.id);
    const docs = await user_service_1.userService.listDocuments(userId);
    res.json((0, utils_1.successResponse)(docs, "Documents fetched"));
}));
router.delete("/:id/documents/:docId", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const userId = getParam(req.params.id);
    const docId = getParam(req.params.docId);
    const result = await user_service_1.userService.deleteDocument(userId, docId);
    res.json((0, utils_1.successResponse)(result, "Document deleted"));
}));
router.get("/:id/host-verification", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const userId = getParam(req.params.id);
    const data = await user_service_1.userService.getHostVerification(userId);
    res.json((0, utils_1.successResponse)(data, "Host verification fetched"));
}));
router.get("/:id/loyalty", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const userId = getParam(req.params.id);
    const data = await user_service_1.userService.getLoyaltySummary(userId);
    res.json((0, utils_1.successResponse)(data, "Loyalty summary fetched"));
}));
exports.default = router;
