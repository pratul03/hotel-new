import { Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { successResponse } from "../../../utils";
import { usersQueries } from "../queries/users.queries";
import {
  addDocumentSchema,
  updateProfileSchema,
} from "../schemas/users.schema";
import { userService } from "../services/users.service";

export const usersController = {
  async getProfile(req: AuthenticatedRequest, res: Response) {
    const profile = await userService.getProfile(usersQueries.userId(req));
    res.json(successResponse(profile, "Profile fetched"));
  },

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    const data = updateProfileSchema.parse(req.body);
    const profile = await userService.updateProfile(
      usersQueries.userId(req),
      data,
    );
    res.json(successResponse(profile, "Profile updated"));
  },

  async addDocument(req: AuthenticatedRequest, res: Response) {
    const { documentType, docUrl } = addDocumentSchema.parse(req.body);
    const doc = await userService.addDocument(
      usersQueries.userId(req),
      documentType,
      docUrl,
    );
    res.status(201).json(successResponse(doc, "Document added"));
  },

  async listDocuments(req: AuthenticatedRequest, res: Response) {
    const docs = await userService.listDocuments(usersQueries.userId(req));
    res.json(successResponse(docs, "Documents fetched"));
  },

  async deleteDocument(req: AuthenticatedRequest, res: Response) {
    const result = await userService.deleteDocument(
      usersQueries.userId(req),
      usersQueries.docId(req),
    );
    res.json(successResponse(result, "Document deleted"));
  },

  async hostVerification(req: AuthenticatedRequest, res: Response) {
    const data = await userService.getHostVerification(
      usersQueries.userId(req),
    );
    res.json(successResponse(data, "Host verification fetched"));
  },

  async identityVerification(req: AuthenticatedRequest, res: Response) {
    const data = await userService.getIdentityVerification(
      usersQueries.userId(req),
    );
    res.json(successResponse(data, "Identity verification fetched"));
  },

  async loyalty(req: AuthenticatedRequest, res: Response) {
    const data = await userService.getLoyaltySummary(usersQueries.userId(req));
    res.json(successResponse(data, "Loyalty summary fetched"));
  },
};

export default usersController;
