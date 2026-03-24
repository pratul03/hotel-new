import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import {
  authenticate,
  AuthenticatedRequest,
} from "../../../middleware/authMiddleware";
import { successResponse, errorResponse } from "../../../utils/response";

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["guest", "host"]).optional().default("guest"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

const mfaVerifySchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Code must be a 6-digit number"),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().url().optional(),
});

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";

// Register
router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name, role } = registerSchema.parse(req.body);

      const result = await authService.register(email, password, name, role);

      res
        .status(201)
        .json(successResponse(result, "User registered successfully"));
    } catch (error) {
      next(error);
    }
  },
);

// Login
router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const result = await authService.login(email, password);

      res.json(successResponse(result, "Login successful"));
    } catch (error) {
      next(error);
    }
  },
);

// Forgot password
router.post(
  "/forgot-password",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(email);
      res.json(successResponse(result, "Password reset request processed"));
    } catch (error) {
      next(error);
    }
  },
);

// Reset password
router.post(
  "/reset-password",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(token, newPassword);
      res.json(successResponse(result, "Password reset successful"));
    } catch (error) {
      next(error);
    }
  },
);

// Get current user
router.get(
  "/me",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const user = await authService.getCurrentUser(req.userId);

      res.json(successResponse(user, "User profile retrieved"));
    } catch (error) {
      next(error);
    }
  },
);

// Update profile
router.put(
  "/me",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const updates = updateProfileSchema.parse(req.body);

      const user = await authService.updateProfile(req.userId, updates);

      res.json(successResponse(user, "Profile updated successfully"));
    } catch (error) {
      next(error);
    }
  },
);

// Logout
router.post("/logout", authenticate, (req: Request, res: Response) => {
  // Token is invalidated on client side
  // No backend token blacklist needed for MVP
  res.json(successResponse(null, "Logout successful"));
});

// Refresh token
router.post(
  "/refresh-token",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const result = await authService.refreshToken(req.userId);
      res.json(successResponse(result, "Token refreshed"));
    } catch (error) {
      next(error);
    }
  },
);

// Verify email
router.post(
  "/verify-email",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const user = await authService.verifyEmail(req.userId);
      res.json(successResponse(user, "Email verified"));
    } catch (error) {
      next(error);
    }
  },
);

// List active sessions
router.get(
  "/sessions",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const sessions = await authService.listSessions(req.userId);
      res.json(successResponse(sessions, "Active sessions retrieved"));
    } catch (error) {
      next(error);
    }
  },
);

// Revoke one session
router.delete(
  "/sessions/:sessionId",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const sessionId = getParam(
        req.params.sessionId as string | string[] | undefined,
      );
      const result = await authService.revokeSession(req.userId, sessionId);
      res.json(successResponse(result, "Session revoked"));
    } catch (error) {
      next(error);
    }
  },
);

// Revoke all sessions except current
router.post(
  "/sessions/revoke-others",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const result = await authService.revokeOtherSessions(
        req.userId,
        req.sessionId,
      );
      res.json(successResponse(result, "Other sessions revoked"));
    } catch (error) {
      next(error);
    }
  },
);

// MFA scaffold setup
router.post(
  "/mfa/setup",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const result = await authService.setupMfa(req.userId);
      res.json(successResponse(result, "MFA setup created"));
    } catch (error) {
      next(error);
    }
  },
);

// MFA scaffold verify
router.post(
  "/mfa/verify",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json(errorResponse("UNAUTHORIZED", "User not found"));
      }

      const { code } = mfaVerifySchema.parse(req.body);
      const result = await authService.verifyMfa(req.userId, code);
      res.json(successResponse(result, "MFA enabled"));
    } catch (error) {
      next(error);
    }
  },
);

export default router;

