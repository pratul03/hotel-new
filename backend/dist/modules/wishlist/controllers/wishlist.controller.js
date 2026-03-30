"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistController = void 0;
const utils_1 = require("../../../utils");
const wishlist_queries_1 = require("../queries/wishlist.queries");
const wishlist_schema_1 = require("../schemas/wishlist.schema");
const wishlist_service_1 = require("../services/wishlist.service");
exports.wishlistController = {
    async list(req, res) {
        const data = await wishlist_service_1.wishlistService.list(wishlist_queries_1.wishlistQueries.userId(req), wishlist_queries_1.wishlistQueries.listName(req));
        res.json((0, utils_1.successResponse)(data, "Wishlist fetched"));
    },
    async getSharedList(req, res) {
        const data = await wishlist_service_1.wishlistService.getSharedList(wishlist_queries_1.wishlistQueries.shareCode(req));
        res.json((0, utils_1.successResponse)(data, "Shared wishlist fetched"));
    },
    async listCollections(req, res) {
        const data = await wishlist_service_1.wishlistService.listCollections(wishlist_queries_1.wishlistQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Wishlist collections fetched"));
    },
    async createShareLink(req, res) {
        const payload = wishlist_schema_1.shareSchema.parse(req.body);
        const data = await wishlist_service_1.wishlistService.createShareLink(wishlist_queries_1.wishlistQueries.userId(req), payload.listName);
        res.json((0, utils_1.successResponse)(data, "Wishlist share link created"));
    },
    async inviteCollaborator(req, res) {
        const payload = wishlist_schema_1.inviteSchema.parse(req.body);
        const data = await wishlist_service_1.wishlistService.inviteCollaborator(wishlist_queries_1.wishlistQueries.userId(req), payload.listName, payload.email, payload.permission);
        res
            .status(201)
            .json((0, utils_1.successResponse)(data, "Wishlist collaborator invited"));
    },
    async listInvites(req, res) {
        const data = await wishlist_service_1.wishlistService.listInvites(wishlist_queries_1.wishlistQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Wishlist invites fetched"));
    },
    async acceptInvite(req, res) {
        const payload = wishlist_schema_1.acceptInviteSchema.parse(req.body);
        const data = await wishlist_service_1.wishlistService.acceptInvite(wishlist_queries_1.wishlistQueries.userId(req), payload.inviteId);
        res.json((0, utils_1.successResponse)(data, "Wishlist invite accepted"));
    },
    async add(req, res) {
        const payload = wishlist_schema_1.roomIdSchema.parse(req.body);
        const item = await wishlist_service_1.wishlistService.add(wishlist_queries_1.wishlistQueries.userId(req), payload.roomId, payload.listName);
        res.status(201).json((0, utils_1.successResponse)(item, "Room added to wishlist"));
    },
    async remove(req, res) {
        const result = await wishlist_service_1.wishlistService.remove(wishlist_queries_1.wishlistQueries.userId(req), wishlist_queries_1.wishlistQueries.roomId(req), wishlist_queries_1.wishlistQueries.listName(req));
        res.json((0, utils_1.successResponse)(result, "Room removed from wishlist"));
    },
};
exports.default = exports.wishlistController;
