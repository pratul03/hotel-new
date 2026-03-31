import { authService } from "../../../../domains/auth/services/auth.service";
import { userService } from "../../../../domains/users/services/users.service";
import { GraphQLContext, requireAuth } from "../../../context";

export const accountQueryResolvers = {
  authSessions: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return authService.listSessions(auth.userId);
  },

  userDocuments: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return userService.listDocuments(auth.userId);
  },

  hostVerification: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return userService.getHostVerification(auth.userId);
  },

  loyaltySummary: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return userService.getLoyaltySummary(auth.userId);
  },

  identityVerification: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return userService.getIdentityVerification(auth.userId);
  },
};
