"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistQueryResolvers = void 0;
const wishlist_service_1 = require("../../../../domains/wishlist/services/wishlist.service");
const context_1 = require("../../../context");
exports.wishlistQueryResolvers = {
    wishlist: async (_parent, args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return wishlist_service_1.wishlistService.list(auth.userId, args.listName);
    },
    wishlistCollections: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return wishlist_service_1.wishlistService.listCollections(auth.userId);
    },
    wishlistShared: async (_parent, args) => wishlist_service_1.wishlistService.getSharedList(args.shareCode),
    wishlistInvites: async (_parent, _args, context) => {
        const auth = (0, context_1.requireAuth)(context);
        return wishlist_service_1.wishlistService.listInvites(auth.userId);
    },
};
