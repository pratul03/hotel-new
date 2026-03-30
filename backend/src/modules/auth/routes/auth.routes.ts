import { Router } from "express";
import { authenticate } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { authController } from "../controllers/auth.controller";

const router = Router();

router.post("/register", catchAsync(authController.register));

router.post("/login", catchAsync(authController.login));

router.post("/forgot-password", catchAsync(authController.forgotPassword));

router.post("/reset-password", catchAsync(authController.resetPassword));

router.get("/me", authenticate, catchAsync(authController.getCurrentUser));

router.put("/me", authenticate, catchAsync(authController.updateProfile));

router.post("/logout", authenticate, authController.logout);

router.post(
  "/refresh-token",
  authenticate,
  catchAsync(authController.refreshToken),
);

router.post(
  "/verify-email",
  authenticate,
  catchAsync(authController.verifyEmail),
);

router.get("/sessions", authenticate, catchAsync(authController.listSessions));

router.delete(
  "/sessions/:sessionId",
  authenticate,
  catchAsync(authController.revokeSession),
);

router.post(
  "/sessions/revoke-others",
  authenticate,
  catchAsync(authController.revokeOtherSessions),
);

router.post("/mfa/setup", authenticate, catchAsync(authController.setupMfa));

router.post("/mfa/verify", authenticate, catchAsync(authController.verifyMfa));

export default router;
