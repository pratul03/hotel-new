import { wishlistService } from "../../../../domains/wishlist/services/wishlist.service";
import { GraphQLContext, requireAuth } from "../../../context";

export const wishlistQueryResolvers = {
  wishlist: async (
    _parent: unknown,
    args: { listName?: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return wishlistService.list(auth.userId, args.listName);
  },

  wishlistCollections: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return wishlistService.listCollections(auth.userId);
  },

  wishlistShared: async (_parent: unknown, args: { shareCode: string }) =>
    wishlistService.getSharedList(args.shareCode),

  wishlistInvites: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return wishlistService.listInvites(auth.userId);
  },
};
