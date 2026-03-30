import { Router } from "express";
import { authenticate } from "../../../middleware/authMiddleware";
import { catchAsync } from "../../../utils";
import { wishlistController } from "../controllers/wishlist.controller";

const router = Router();

router.get("/", authenticate, catchAsync(wishlistController.list));

router.get("/shared/:shareCode", catchAsync(wishlistController.getSharedList));

router.get(
  "/lists",
  authenticate,
  catchAsync(wishlistController.listCollections),
);

router.post(
  "/collaborate/share",
  authenticate,
  catchAsync(wishlistController.createShareLink),
);

router.post(
  "/collaborate/invite",
  authenticate,
  catchAsync(wishlistController.inviteCollaborator),
);

router.get(
  "/collaborate/invites",
  authenticate,
  catchAsync(wishlistController.listInvites),
);

router.post(
  "/collaborate/accept",
  authenticate,
  catchAsync(wishlistController.acceptInvite),
);

router.post("/", authenticate, catchAsync(wishlistController.add));

router.delete("/:roomId", authenticate, catchAsync(wishlistController.remove));

export default router;
