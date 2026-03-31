import {
  acceptInviteSchema,
  inviteSchema,
  roomIdSchema,
  shareSchema,
} from "../../../../domains/wishlist/schemas/wishlist.schema";
import { wishlistService } from "../../../../domains/wishlist/services/wishlist.service";
import { GraphQLContext, requireAuth } from "../../../context";

export const wishlistMutationResolvers = {
  wishlistAdd: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = roomIdSchema.parse(args.input);
    return wishlistService.add(auth.userId, parsed.roomId, parsed.listName);
  },

  wishlistRemove: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = roomIdSchema.parse(args.input);
    await wishlistService.remove(auth.userId, parsed.roomId, parsed.listName);
    return { deleted: true, message: "Room removed from wishlist" };
  },

  wishlistCreateShare: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = shareSchema.parse(args.input);
    return wishlistService.createShareLink(auth.userId, parsed.listName);
  },

  wishlistInvite: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = inviteSchema.parse(args.input);
    return wishlistService.inviteCollaborator(
      auth.userId,
      parsed.listName,
      parsed.email,
      parsed.permission,
    );
  },

  wishlistAccept: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = acceptInviteSchema.parse(args.input);
    return wishlistService.acceptInvite(auth.userId, parsed.inviteId);
  },
};
