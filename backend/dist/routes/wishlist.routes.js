"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const utils_1 = require("../utils");
const wishlist_service_1 = require("../services/wishlist.service");
const router = (0, express_1.Router)();
const roomIdSchema = zod_1.z.object({
    roomId: zod_1.z.string().min(1),
    listName: zod_1.z.string().min(1).max(120).optional(),
});
const inviteSchema = zod_1.z.object({
    listName: zod_1.z.string().min(1).max(120),
    email: zod_1.z.string().email(),
});
const shareSchema = zod_1.z.object({
    listName: zod_1.z.string().min(1).max(120),
});
const acceptInviteSchema = zod_1.z.object({
    inviteId: zod_1.z.string().min(1),
});
const getParam = (value) => Array.isArray(value) ? value[0] || "" : value || "";
const getQueryString = (value) => {
    if (Array.isArray(value))
        return typeof value[0] === "string" ? value[0] : undefined;
    return typeof value === "string" ? value : undefined;
};
router.get("/", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const listName = getQueryString(req.query.listName);
    const data = await wishlist_service_1.wishlistService.list(req.userId, listName);
    res.json((0, utils_1.successResponse)(data, "Wishlist fetched"));
}));
router.get("/shared/:shareCode", (0, utils_1.catchAsync)(async (req, res) => {
    const shareCode = getParam(req.params.shareCode);
    const data = await wishlist_service_1.wishlistService.getSharedList(shareCode);
    res.json((0, utils_1.successResponse)(data, "Shared wishlist fetched"));
}));
router.get("/lists", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const data = await wishlist_service_1.wishlistService.listCollections(req.userId);
    res.json((0, utils_1.successResponse)(data, "Wishlist collections fetched"));
}));
router.post("/collaborate/share", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const payload = shareSchema.parse(req.body);
    const data = await wishlist_service_1.wishlistService.createShareLink(req.userId, payload.listName);
    res.json((0, utils_1.successResponse)(data, "Wishlist share link created"));
}));
router.post("/collaborate/invite", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const payload = inviteSchema.parse(req.body);
    const data = await wishlist_service_1.wishlistService.inviteCollaborator(req.userId, payload.listName, payload.email);
    res
        .status(201)
        .json((0, utils_1.successResponse)(data, "Wishlist collaborator invited"));
}));
router.get("/collaborate/invites", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const data = await wishlist_service_1.wishlistService.listInvites(req.userId);
    res.json((0, utils_1.successResponse)(data, "Wishlist invites fetched"));
}));
router.post("/collaborate/accept", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const payload = acceptInviteSchema.parse(req.body);
    const data = await wishlist_service_1.wishlistService.acceptInvite(req.userId, payload.inviteId);
    res.json((0, utils_1.successResponse)(data, "Wishlist invite accepted"));
}));
router.post("/", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const { roomId, listName } = roomIdSchema.parse(req.body);
    const item = await wishlist_service_1.wishlistService.add(req.userId, roomId, listName);
    res.status(201).json((0, utils_1.successResponse)(item, "Room added to wishlist"));
}));
router.delete("/:roomId", authMiddleware_1.authenticate, (0, utils_1.catchAsync)(async (req, res) => {
    const roomId = getParam(req.params.roomId);
    const listName = getQueryString(req.query.listName);
    const result = await wishlist_service_1.wishlistService.remove(req.userId, roomId, listName);
    res.json((0, utils_1.successResponse)(result, "Room removed from wishlist"));
}));
exports.default = router;
