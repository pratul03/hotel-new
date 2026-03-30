"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesSchemas = exports.sendMessageSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.sendMessageSchema = validation_1.z
    .object({
    receiverUserId: validation_1.v.id().optional(),
    receiverId: validation_1.v.id().optional(),
    content: validation_1.z.coerce.string().default(""),
    bookingId: validation_1.v.id().optional(),
    attachmentUrl: validation_1.v.url().optional(),
    attachmentType: validation_1.z.enum(["image", "pdf", "file"]).optional(),
    escalateToSupport: validation_1.v.bool().optional(),
})
    .refine((v) => Boolean(v.receiverUserId || v.receiverId), {
    message: "receiverUserId or receiverId is required",
    path: ["receiverUserId"],
})
    .refine((v) => {
    const hasAttachmentUrl = Boolean(v.attachmentUrl);
    const hasAttachmentType = Boolean(v.attachmentType);
    return hasAttachmentUrl === hasAttachmentType;
}, {
    message: "attachmentUrl and attachmentType must be provided together",
    path: ["attachmentUrl"],
})
    .refine((v) => Boolean(v.content.trim()) || Boolean(v.attachmentUrl), {
    message: "content or attachment is required",
    path: ["content"],
});
exports.messagesSchemas = {
    sendMessageSchema: exports.sendMessageSchema,
};
exports.default = exports.messagesSchemas;
