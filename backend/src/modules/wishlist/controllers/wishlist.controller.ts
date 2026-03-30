import { Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { successResponse } from "../../../utils";
import { wishlistQueries } from "../queries/wishlist.queries";
import {
  acceptInviteSchema,
  inviteSchema,
  roomIdSchema,
  shareSchema,
} from "../schemas/wishlist.schema";
import { wishlistService } from "../services/wishlist.service";

export const wishlistController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const data = await wishlistService.list(
      wishlistQueries.userId(req),
      wishlistQueries.listName(req),
    );
    res.json(successResponse(data, "Wishlist fetched"));
  },

  async getSharedList(req: AuthenticatedRequest, res: Response) {
    const data = await wishlistService.getSharedList(
      wishlistQueries.shareCode(req),
    );
    res.json(successResponse(data, "Shared wishlist fetched"));
  },

  async listCollections(req: AuthenticatedRequest, res: Response) {
    const data = await wishlistService.listCollections(
      wishlistQueries.userId(req),
    );
    res.json(successResponse(data, "Wishlist collections fetched"));
  },

  async createShareLink(req: AuthenticatedRequest, res: Response) {
    const payload = shareSchema.parse(req.body);
    const data = await wishlistService.createShareLink(
      wishlistQueries.userId(req),
      payload.listName,
    );
    res.json(successResponse(data, "Wishlist share link created"));
  },

  async inviteCollaborator(req: AuthenticatedRequest, res: Response) {
    const payload = inviteSchema.parse(req.body);
    const data = await wishlistService.inviteCollaborator(
      wishlistQueries.userId(req),
      payload.listName,
      payload.email,
      payload.permission,
    );
    res
      .status(201)
      .json(successResponse(data, "Wishlist collaborator invited"));
  },

  async listInvites(req: AuthenticatedRequest, res: Response) {
    const data = await wishlistService.listInvites(wishlistQueries.userId(req));
    res.json(successResponse(data, "Wishlist invites fetched"));
  },

  async acceptInvite(req: AuthenticatedRequest, res: Response) {
    const payload = acceptInviteSchema.parse(req.body);
    const data = await wishlistService.acceptInvite(
      wishlistQueries.userId(req),
      payload.inviteId,
    );
    res.json(successResponse(data, "Wishlist invite accepted"));
  },

  async add(req: AuthenticatedRequest, res: Response) {
    const payload = roomIdSchema.parse(req.body);
    const item = await wishlistService.add(
      wishlistQueries.userId(req),
      payload.roomId,
      payload.listName,
    );
    res.status(201).json(successResponse(item, "Room added to wishlist"));
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    const result = await wishlistService.remove(
      wishlistQueries.userId(req),
      wishlistQueries.roomId(req),
      wishlistQueries.listName(req),
    );
    res.json(successResponse(result, "Room removed from wishlist"));
  },
};

export default wishlistController;
