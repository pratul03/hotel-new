import { Router, Response } from "express";
import { z } from "zod";
import {
  authenticate,
  AuthenticatedRequest,
} from "../../../middleware/authMiddleware";
import { catchAsync, successResponse } from "../../../utils";
import { messageService } from "../services/messages.service";

const router = Router();

const sendMessageSchema = z
  .object({
    receiverUserId: z.string().min(1).optional(),
    receiverId: z.string().min(1).optional(),
    content: z.string().default(""),
    bookingId: z.string().optional(),
    attachmentUrl: z.string().url().optional(),
    attachmentType: z.enum(["image", "pdf", "file"]).optional(),
    escalateToSupport: z.boolean().optional(),
  })
  .refine((v) => Boolean(v.receiverUserId || v.receiverId), {
    message: "receiverUserId or receiverId is required",
    path: ["receiverUserId"],
  })
  .refine(
    (v) => {
      const hasAttachmentUrl = Boolean(v.attachmentUrl);
      const hasAttachmentType = Boolean(v.attachmentType);
      return hasAttachmentUrl === hasAttachmentType;
    },
    {
      message: "attachmentUrl and attachmentType must be provided together",
      path: ["attachmentUrl"],
    },
  )
  .refine((v) => Boolean(v.content.trim()) || Boolean(v.attachmentUrl), {
    message: "content or attachment is required",
    path: ["content"],
  });

const getParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] || "" : value || "";

router.post(
  "/",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const payload = sendMessageSchema.parse(req.body);
    const msg = await messageService.sendMessage(
      req.userId as string,
      (payload.receiverUserId || payload.receiverId) as string,
      payload.content,
      payload.bookingId,
      payload.attachmentUrl,
      payload.attachmentType,
      payload.escalateToSupport,
    );
    res.status(201).json(successResponse(msg, "Message sent"));
  }),
);

router.get(
  "/thread/:userId",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const otherUserId = getParam(
      req.params.userId as string | string[] | undefined,
    );
    const thread = await messageService.getThread(
      req.userId as string,
      otherUserId,
    );
    res.json(successResponse(thread, "Thread fetched"));
  }),
);

router.get(
  "/:userId",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const otherUserId = getParam(
      req.params.userId as string | string[] | undefined,
    );
    const thread = await messageService.getThread(
      req.userId as string,
      otherUserId,
    );
    res.json(successResponse(thread, "Thread fetched"));
  }),
);

router.get(
  "/conversations",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await messageService.getConversations(req.userId as string);
    res.json(successResponse(data, "Conversations fetched"));
  }),
);

router.patch(
  "/:id/read",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const messageId = getParam(req.params.id as string | string[] | undefined);
    const data = await messageService.markAsRead(
      req.userId as string,
      messageId,
    );
    res.json(successResponse(data, "Message marked as read"));
  }),
);

router.get(
  "/unread-count",
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await messageService.getUnreadCount(req.userId as string);
    res.json(successResponse(data, "Unread count fetched"));
  }),
);

export default router;

