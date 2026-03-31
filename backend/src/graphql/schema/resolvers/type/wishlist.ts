import { normalizeRoom, toIsoString } from "../../helpers";

export const wishlistTypeResolvers = {
  WishlistItem: {
    addedAt: (item: { addedAt?: unknown }) => toIsoString(item.addedAt),
    room: (item: { room?: Record<string, unknown> }) =>
      item.room ? normalizeRoom(item.room) : null,
  },

  WishlistInvite: {
    createdAt: (invite: { createdAt?: unknown }) =>
      toIsoString(invite.createdAt),
  },
};
