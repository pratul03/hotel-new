"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistTypeResolvers = void 0;
const helpers_1 = require("../../helpers");
exports.wishlistTypeResolvers = {
    WishlistItem: {
        addedAt: (item) => (0, helpers_1.toIsoString)(item.addedAt),
        room: (item) => item.room ? (0, helpers_1.normalizeRoom)(item.room) : null,
    },
    WishlistInvite: {
        createdAt: (invite) => (0, helpers_1.toIsoString)(invite.createdAt),
    },
};
