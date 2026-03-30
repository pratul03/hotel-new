import { Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/authMiddleware";
import { successResponse } from "../../../utils";
import { messagesQueries } from "../queries/messages.queries";
import { sendMessageSchema } from "../schemas/messages.schema";
import { messageService } from "../services/messages.service";

export const messagesController = {
  async sendMessage(req: AuthenticatedRequest, res: Response) {
    const payload = sendMessageSchema.parse(req.body);
    const msg = await messageService.sendMessage(
      messagesQueries.userId(req),
      (payload.receiverUserId || payload.receiverId) as string,
      payload.content,
      payload.bookingId,
      payload.attachmentUrl,
      payload.attachmentType,
      payload.escalateToSupport,
    );

    res.status(201).json(successResponse(msg, "Message sent"));
  },

  async getThread(req: AuthenticatedRequest, res: Response) {
    const thread = await messageService.getThread(
      messagesQueries.userId(req),
      messagesQueries.otherUserId(req),
    );
    res.json(successResponse(thread, "Thread fetched"));
  },

  async getConversations(req: AuthenticatedRequest, res: Response) {
    const data = await messageService.getConversations(
      messagesQueries.userId(req),
    );
    res.json(successResponse(data, "Conversations fetched"));
  },

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    const data = await messageService.markAsRead(
      messagesQueries.userId(req),
      messagesQueries.messageId(req),
    );
    res.json(successResponse(data, "Message marked as read"));
  },

  async unreadCount(req: AuthenticatedRequest, res: Response) {
    const data = await messageService.getUnreadCount(
      messagesQueries.userId(req),
    );
    res.json(successResponse(data, "Unread count fetched"));
  },
};

export default messagesController;
