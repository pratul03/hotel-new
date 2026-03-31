import {
  forgotPasswordSchema,
  mfaVerifySchema,
  resetPasswordSchema,
  updateProfileSchema as authUpdateProfileSchema,
} from "../../../../domains/auth/schemas/auth.schema";
import { authService } from "../../../../domains/auth/services/auth.service";
import {
  addDocumentSchema,
  updateProfileSchema as userUpdateProfileSchema,
} from "../../../../domains/users/schemas/users.schema";
import { userService } from "../../../../domains/users/services/users.service";
import { GraphQLContext, requireAuth } from "../../../context";

export const accountMutationResolvers = {
  logout: async () => ({ success: true, message: "Logout successful" }),

  updateMyProfile: async (
    _parent: unknown,
    args: { input: unknown },
    context: GraphQLContext,
  ) => {
    const auth = requireAuth(context);
    const parsed = authUpdateProfileSchema.parse(args.input);
    return authService.updateProfile(auth.userId, parsed);
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
    const auth = requireAuth(context);
    return authService.refreshToken(auth.userId);
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
