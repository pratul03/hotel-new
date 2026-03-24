import { Router, Response } from "express";
import { z } from "zod";
import {
  authenticate,
  AuthenticatedRequest,
} from "../../../middleware/authMiddleware";
import { catchAsync, successResponse } from "../../../utils";
import { userService } from "../services/users.service";

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().url().optional(),
});

const addDocumentSchema = z.object({
  documentType: z.string().min(1),
  docUrl: z.string().url(),
});

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";

router.get(
  "/:id/profile",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getParam(req.params.id as string | string[] | undefined);
    const profile = await userService.getProfile(userId);
    res.json(successResponse(profile, "Profile fetched"));
  }),
);

router.put(
  "/:id/profile",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getParam(req.params.id as string | string[] | undefined);
    const data = updateProfileSchema.parse(req.body);
    const profile = await userService.updateProfile(userId, data);
    res.json(successResponse(profile, "Profile updated"));
  }),
);

router.post(
  "/:id/verify-document",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getParam(req.params.id as string | string[] | undefined);
    const { documentType, docUrl } = addDocumentSchema.parse(req.body);
    const doc = await userService.addDocument(userId, documentType, docUrl);
    res.status(201).json(successResponse(doc, "Document added"));
  }),
);

router.get(
  "/:id/documents",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getParam(req.params.id as string | string[] | undefined);
    const docs = await userService.listDocuments(userId);
    res.json(successResponse(docs, "Documents fetched"));
  }),
);

router.delete(
  "/:id/documents/:docId",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getParam(req.params.id as string | string[] | undefined);
    const docId = getParam(req.params.docId as string | string[] | undefined);
    const result = await userService.deleteDocument(userId, docId);
    res.json(successResponse(result, "Document deleted"));
  }),
);

router.get(
  "/:id/host-verification",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getParam(req.params.id as string | string[] | undefined);
    const data = await userService.getHostVerification(userId);
    res.json(successResponse(data, "Host verification fetched"));
  }),
);

router.get(
  "/:id/identity-verification",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getParam(req.params.id as string | string[] | undefined);
    const data = await userService.getIdentityVerification(userId);
    res.json(successResponse(data, "Identity verification fetched"));
  }),
);

router.get(
  "/:id/identity-verification/mock",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getParam(req.params.id as string | string[] | undefined);
    const data = await userService.getIdentityVerification(userId);
    res.json(successResponse(data, "Identity verification fetched"));
  }),
);

router.get(
  "/:id/loyalty",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getParam(req.params.id as string | string[] | undefined);
    const data = await userService.getLoyaltySummary(userId);
    res.json(successResponse(data, "Loyalty summary fetched"));
  }),
);

export default router;

