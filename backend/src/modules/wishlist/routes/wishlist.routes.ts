import { Router, Response } from "express";
import { z } from "zod";
import {
  authenticate,
  AuthenticatedRequest,
} from "../../../middleware/authMiddleware";
import { catchAsync, successResponse } from "../../../utils";
import { wishlistService } from "../services/wishlist.service";

const router = Router();

const roomIdSchema = z.object({
  roomId: z.string().min(1),
  listName: z.string().min(1).max(120).optional(),
});

const inviteSchema = z.object({
  listName: z.string().min(1).max(120),
  email: z.string().email(),
  permission: z.enum(["viewer", "editor"]).default("viewer"),
});

const shareSchema = z.object({
  listName: z.string().min(1).max(120),
});

const acceptInviteSchema = z.object({
  inviteId: z.string().min(1),
});
const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";
const getQueryString = (value: unknown): string | undefined => {
  if (Array.isArray(value))
    return typeof value[0] === "string" ? value[0] : undefined;
  return typeof value === "string" ? value : undefined;
};

router.get(
  "/",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const listName = getQueryString(req.query.listName);
    const data = await wishlistService.list(req.userId as string, listName);
    res.json(successResponse(data, "Wishlist fetched"));
  }),
);

router.get(
  "/shared/:shareCode",
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const shareCode = getParam(
      req.params.shareCode as string | string[] | undefined,
    );
    const data = await wishlistService.getSharedList(shareCode);
    res.json(successResponse(data, "Shared wishlist fetched"));
  }),
);

router.get(
  "/lists",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await wishlistService.listCollections(req.userId as string);
    res.json(successResponse(data, "Wishlist collections fetched"));
  }),
);

router.post(
  "/collaborate/share",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = shareSchema.parse(req.body);
    const data = await wishlistService.createShareLink(
      req.userId as string,
      payload.listName,
    );
    res.json(successResponse(data, "Wishlist share link created"));
  }),
);

router.post(
  "/collaborate/invite",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = inviteSchema.parse(req.body);
    const data = await wishlistService.inviteCollaborator(
      req.userId as string,
      payload.listName,
      payload.email,
      payload.permission,
    );
    res
      .status(201)
      .json(successResponse(data, "Wishlist collaborator invited"));
  }),
);

router.get(
  "/collaborate/invites",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await wishlistService.listInvites(req.userId as string);
    res.json(successResponse(data, "Wishlist invites fetched"));
  }),
);

router.post(
  "/collaborate/accept",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = acceptInviteSchema.parse(req.body);
    const data = await wishlistService.acceptInvite(
      req.userId as string,
      payload.inviteId,
    );
    res.json(successResponse(data, "Wishlist invite accepted"));
  }),
);

router.post(
  "/",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { roomId, listName } = roomIdSchema.parse(req.body);
    const item = await wishlistService.add(
      req.userId as string,
      roomId,
      listName,
    );
    res.status(201).json(successResponse(item, "Room added to wishlist"));
  }),
);

router.delete(
  "/:roomId",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const roomId = getParam(req.params.roomId as string | string[] | undefined);
    const listName = getQueryString(req.query.listName);
    const result = await wishlistService.remove(
      req.userId as string,
      roomId,
      listName,
    );
    res.json(successResponse(result, "Room removed from wishlist"));
  }),
);

export default router;

