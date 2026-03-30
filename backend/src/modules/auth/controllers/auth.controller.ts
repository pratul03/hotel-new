import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { successResponse, errorResponse } from "../../../utils/response";
import { authQueries } from "../queries/auth.queries";
import {
  forgotPasswordSchema,
  loginSchema,
  mfaVerifySchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../schemas/auth.schema";

const requireUserId = (req: Request, res: Response): string | null => {
  const userId = authQueries.userId(req);

  if (!userId) {
    res.status(401).json(errorResponse("UNAUTHORIZED", "User not found"));
    return null;
  }

  return userId;
};

export const authController = {
  async register(req: Request, res: Response) {
    const { email, password, name, role } = registerSchema.parse(req.body);
    const result = await authService.register(email, password, name, role);

    res
      .status(201)
      .json(successResponse(result, "User registered successfully"));
  },

  async login(req: Request, res: Response) {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(email, password);

    res.json(successResponse(result, "Login successful"));
  },

  async forgotPassword(req: Request, res: Response) {
    const { email } = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(email);

    res.json(successResponse(result, "Password reset request processed"));
  },

  async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(token, newPassword);

    res.json(successResponse(result, "Password reset successful"));
  },

  async getCurrentUser(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (!userId) {
      return;
    }

    const user = await authService.getCurrentUser(userId);
    res.json(successResponse(user, "User profile retrieved"));
  },

  async updateProfile(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (!userId) {
      return;
    }

    const updates = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(userId, updates);

    res.json(successResponse(user, "Profile updated successfully"));
  },

  logout(_req: Request, res: Response) {
    // Token is invalidated on client side; no backend blacklist for MVP.
    res.json(successResponse(null, "Logout successful"));
  },

  async refreshToken(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (!userId) {
      return;
    }

    const result = await authService.refreshToken(userId);
    res.json(successResponse(result, "Token refreshed"));
  },

  async verifyEmail(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (!userId) {
      return;
    }

    const user = await authService.verifyEmail(userId);
    res.json(successResponse(user, "Email verified"));
  },

  async listSessions(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (!userId) {
      return;
    }

    const sessions = await authService.listSessions(userId);
    res.json(successResponse(sessions, "Active sessions retrieved"));
  },

  async revokeSession(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (!userId) {
      return;
    }

    const sessionId = authQueries.getParam(
      req.params.sessionId as string | string[] | undefined,
    );
    const result = await authService.revokeSession(userId, sessionId);
    res.json(successResponse(result, "Session revoked"));
  },

  async revokeOtherSessions(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (!userId) {
      return;
    }

    const result = await authService.revokeOtherSessions(
      userId,
      authQueries.sessionId(req),
    );
    res.json(successResponse(result, "Other sessions revoked"));
  },

  async setupMfa(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (!userId) {
      return;
    }

    const result = await authService.setupMfa(userId);
    res.json(successResponse(result, "MFA setup created"));
  },

  async verifyMfa(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (!userId) {
      return;
    }

    const { code } = mfaVerifySchema.parse(req.body);
    const result = await authService.verifyMfa(userId, code);
    res.json(successResponse(result, "MFA enabled"));
  },
};

export default authController;
