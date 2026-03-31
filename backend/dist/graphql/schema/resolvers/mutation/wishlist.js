"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistMutationResolvers = void 0;
const wishlist_schema_1 = require("../../../../domains/wishlist/schemas/wishlist.schema");
const wishlist_service_1 = require("../../../../domains/wishlist/services/wishlist.service");
const context_1 = require("../../../context");
exports.wishlistMutationResolvers = {
    wishlistAdd: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = wishlist_schema_1.roomIdSchema.parse(args.input);
        return wishlist_service_1.wishlistService.add(auth.userId, parsed.roomId, parsed.listName);
    },
    wishlistRemove: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = wishlist_schema_1.roomIdSchema.parse(args.input);
        await wishlist_service_1.wishlistService.remove(auth.userId, parsed.roomId, parsed.listName);
        return { deleted: true, message: "Room removed from wishlist" };
    },
    wishlistCreateShare: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = wishlist_schema_1.shareSchema.parse(args.input);
        return wishlist_service_1.wishlistService.createShareLink(auth.userId, parsed.listName);
    },
    wishlistInvite: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = wishlist_schema_1.inviteSchema.parse(args.input);
        return wishlist_service_1.wishlistService.inviteCollaborator(auth.userId, parsed.listName, parsed.email, parsed.permission);
    },
    wishlistAccept: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        const parsed = wishlist_schema_1.acceptInviteSchema.parse(args.input);
        return wishlist_service_1.wishlistService.acceptInvite(auth.userId, parsed.inviteId);
    },
};
