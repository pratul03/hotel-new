import { Router } from "express";
import { authenticate } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { usersController } from "../controllers/users.controller";

const router = Router();

router.get(
  "/:id/profile",
  authenticate,
  catchAsync(usersController.getProfile),
);

router.put(
  "/:id/profile",
  authenticate,
  catchAsync(usersController.updateProfile),
);

router.post(
  "/:id/verify-document",
  authenticate,
  catchAsync(usersController.addDocument),
);

router.get(
  "/:id/documents",
  authenticate,
  catchAsync(usersController.listDocuments),
);

router.delete(
  "/:id/documents/:docId",
  authenticate,
  catchAsync(usersController.deleteDocument),
);

router.get(
  "/:id/host-verification",
  authenticate,
  catchAsync(usersController.hostVerification),
);

router.get(
  "/:id/identity-verification",
  authenticate,
  catchAsync(usersController.identityVerification),
);

router.get(
  "/:id/identity-verification/mock",
  authenticate,
  catchAsync(usersController.identityVerification),
);

router.get("/:id/loyalty", authenticate, catchAsync(usersController.loyalty));

export default router;
