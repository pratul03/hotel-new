import {
  forgotPasswordSchema,
  mfaVerifySchema,
  resetPasswordSchema,
  updateProfileSchema as authUpdateProfileSchema,
} from "../../../../domains/auth/schemas/auth.schema";
import { authService } from "../../../../domains/auth/services/auth.service";
import {
  addDocumentSchema,
  adminUpdateUserSchema,
  updateProfileSchema as userUpdateProfileSchema,
} from "../../../../domains/users/schemas/users.schema";
import { userService } from "../../../../domains/users/services/users.service";
import { GraphQLContext, requireAuth, requireRole } from "../../../context";
import {
  clearAuthCookies,
  readRefreshTokenFromRequest,
  setAuthCookies,
} from "../../../../domains/auth/services/authCookies.service";
import { verifyRefreshToken } from "../../../../utils/jwt";
import { GraphQLError } from "graphql";

export const accountMutationResolvers = {
  logout: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const refreshToken = readRefreshTokenFromRequest(context.req);

    try {
      if (context.authUser?.sessionId) {
        await authService.revokeSession(
          context.authUser.userId,
          context.authUser.sessionId,
        );
      } else if (refreshToken) {
        const decoded = verifyRefreshToken(refreshToken);
        if (decoded.sid) {
          await authService.revokeSession(decoded.userId, decoded.sid);
        }
      }
    } catch {
      // Best-effort revoke; cookie clear is still required.
    }

    clearAuthCookies(context.res);
    return { success: true, message: "Logout successful" };
  },

  updateMyProfile: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = authUpdateProfileSchema.parse(args.input);
    return authService.updateProfile(auth.userId, parsed);
  },

  adminUpdateUser: async (
    _parent: unknown,
    args: { userId: string; input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireRole(context, ["admin"]);
    const parsed = adminUpdateUserSchema.parse(args.input);
    return userService.updateUserByAdmin(auth.userId, args.userId, parsed);
  },

  verifyEmail: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return authService.verifyEmail(auth.userId);
  },

  refreshToken: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const refreshToken = readRefreshTokenFromRequest(context.req);

    if (!refreshToken) {
      throw new GraphQLError("Refresh token is missing", {
        extensions: {
          code: "UNAUTHORIZED",
          http: { status: 401 },
        },
      });
    }

    const result = await authService.refreshSessionFromToken(refreshToken);
    setAuthCookies(context.res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    return { token: result.token };
  },

  forgotPassword: async (_parent: unknown, args: { email: string }) => {
    const parsed = forgotPasswordSchema.parse(args);
    return authService.forgotPassword(parsed.email);
  },

  resetPassword: async (_parent: unknown, args: { input: unknown }) => {
    const parsed = resetPasswordSchema.parse(args.input);
    const result = await authService.resetPassword(
      parsed.token,
      parsed.newPassword,
    );
    return {
      success: Boolean((result as { success?: boolean }).success),
      message: "Password reset successful",
    };
  },

  revokeSession: async (
    _parent: unknown,
    args: { sessionId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    await authService.revokeSession(auth.userId, args.sessionId);
    return { success: true, message: "Session revoked" };
  },

  revokeOtherSessions: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    await authService.revokeOtherSessions(auth.userId, auth.sessionId);
    return { success: true, message: "Other sessions revoked" };
  },

  setupMfa: async (
    _parent: unknown,
    _args: unknown,
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    return authService.setupMfa(auth.userId);
  },

  verifyMfa: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = mfaVerifySchema.parse(args.input);
    return authService.verifyMfa(auth.userId, parsed.code);
  },

  addUserDocument: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = addDocumentSchema.parse(args.input);
    return userService.addDocument(
      auth.userId,
      parsed.documentType,
      parsed.docUrl,
    );
  },

  deleteUserDocument: async (
    _parent: unknown,
    args: { docId: string },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    await userService.deleteDocument(auth.userId, args.docId);
    return { deleted: true, message: "Document deleted" };
  },

  updateUserProfile: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = userUpdateProfileSchema.parse(args.input);
    return userService.updateProfile(auth.userId, parsed);
  },
};
