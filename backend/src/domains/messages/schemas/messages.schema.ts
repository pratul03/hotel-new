import { z, v } from "../../../utils/validation";

export const sendMessageSchema = z
  .object({
    receiverUserId: v.id().optional(),
    receiverId: v.id().optional(),
    content: z.coerce.string().default(""),
    bookingId: v.id().optional(),
    attachmentUrl: v.url().optional(),
    attachmentType: z.enum(["image", "pdf", "file"]).optional(),
    escalateToSupport: v.bool().optional(),
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

export const messagesSchemas = {
  sendMessageSchema,
};

export default messagesSchemas;
