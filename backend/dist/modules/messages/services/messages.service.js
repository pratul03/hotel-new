"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageService = void 0;
const database_1 = require("../../../config/database");
const utils_1 = require("../../../utils");
const eventPublisher_1 = require("../../../utils/eventPublisher");
const ATTACHMENT_PREFIX = "[attachment]";
const ALLOWED_ATTACHMENT_TYPES = new Set(["image", "pdf", "file"]);
const normalizeMessageInput = (content, attachmentUrl, attachmentType) => {
    const trimmedContent = content.trim();
    const hasAttachmentUrl = Boolean(attachmentUrl?.trim());
    const hasAttachmentType = Boolean(attachmentType?.trim());
    if (!trimmedContent && !hasAttachmentUrl) {
        throw new utils_1.AppError("Message content or attachment is required", 400);
    }
    if (hasAttachmentUrl !== hasAttachmentType) {
        throw new utils_1.AppError("attachmentUrl and attachmentType must be provided together", 400);
    }
    if (hasAttachmentType) {
        const normalizedType = attachmentType.trim().toLowerCase();
        if (!ALLOWED_ATTACHMENT_TYPES.has(normalizedType)) {
            throw new utils_1.AppError("Invalid attachment type", 400);
        }
    }
    return {
        content: trimmedContent,
        attachmentUrl: attachmentUrl?.trim(),
        attachmentType: attachmentType?.trim().toLowerCase(),
    };
};
const serializeContent = (content, attachmentUrl, attachmentType) => {
    if (!attachmentUrl)
        return content;
    const type = (attachmentType || "file").trim().toLowerCase();
    return `${ATTACHMENT_PREFIX}${type}|${attachmentUrl}\n${content}`.trim();
};
const parseContent = (raw) => {
    if (!raw.startsWith(ATTACHMENT_PREFIX)) {
        return {
            content: raw,
            attachmentUrl: undefined,
            attachmentType: undefined,
        };
    }
    const newlineIdx = raw.indexOf("\n");
    const header = newlineIdx >= 0 ? raw.slice(0, newlineIdx) : raw;
    const body = newlineIdx >= 0 ? raw.slice(newlineIdx + 1) : "";
    const payload = header.replace(ATTACHMENT_PREFIX, "");
    const [attachmentType, attachmentUrl] = payload.split("|");
    const normalizedType = (attachmentType || "").trim().toLowerCase();
    const validType = ALLOWED_ATTACHMENT_TYPES.has(normalizedType)
        ? normalizedType
        : undefined;
    return {
        content: body,
        attachmentUrl: attachmentUrl || undefined,
        attachmentType: validType,
    };
};
const toApiMessage = (msg) => {
    const parsed = parseContent(msg.content || "");
    return {
        id: msg.id,
        senderId: msg.senderUserId,
        receiverId: msg.receiverUserId,
        bookingId: msg.bookingId || undefined,
        content: parsed.content,
        attachmentUrl: parsed.attachmentUrl,
        attachmentType: parsed.attachmentType,
        hasAttachment: Boolean(parsed.attachmentUrl),
        messageType: parsed.attachmentUrl ? "attachment" : "text",
        read: msg.read,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        sender: msg.sender,
        receiver: msg.receiver,
    };
};
exports.messageService = {
    async sendMessage(senderUserId, receiverUserId, content, bookingId, attachmentUrl, attachmentType, escalateToSupport) {
        const normalized = normalizeMessageInput(content, attachmentUrl, attachmentType);
        const normalizedContent = serializeContent(normalized.content, normalized.attachmentUrl, normalized.attachmentType);
        const message = await database_1.prisma.message.create({
            data: {
                senderUserId,
                receiverUserId,
                content: normalizedContent,
                ...(bookingId && { bookingId }),
            },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
                receiver: { select: { id: true, name: true, avatar: true } },
            },
        });
        let escalatedTicketId;
        if (escalateToSupport) {
            const ticket = await database_1.prisma.supportTicket.create({
                data: {
                    userId: senderUserId,
                    subject: "Escalated chat conversation",
                    description: `Escalation from in-app message thread with user ${receiverUserId}.\n\nMessage:\n${normalized.content}`,
                    priority: "urgent",
                },
            });
            escalatedTicketId = ticket.id;
        }
        // Fire-and-forget: notify receiver
        Promise.all([
            database_1.prisma.user.findUnique({
                where: { id: senderUserId },
                select: { id: true, name: true, email: true },
            }),
            database_1.prisma.user.findUnique({
                where: { id: receiverUserId },
                select: { id: true, name: true, email: true },
            }),
        ])
            .then(([sender, receiver]) => {
            if (!sender || !receiver)
                return;
            (0, eventPublisher_1.publishEvent)("message.new", {
                messageId: message.id,
                sender,
                receiver,
                content: normalizedContent,
                hasAttachment: Boolean(normalized.attachmentUrl),
                attachmentType: normalized.attachmentType,
                bookingId,
            });
        })
            .catch(() => { });
        return {
            ...toApiMessage(message),
            escalatedTicketId,
        };
    },
    async getThread(currentUserId, otherUserId) {
        const messages = await database_1.prisma.message.findMany({
            where: {
                OR: [
                    { senderUserId: currentUserId, receiverUserId: otherUserId },
                    { senderUserId: otherUserId, receiverUserId: currentUserId },
                ],
            },
            orderBy: { createdAt: "asc" },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
                receiver: { select: { id: true, name: true, avatar: true } },
            },
        });
        return messages.map(toApiMessage);
    },
    async getConversations(currentUserId) {
        const messages = await database_1.prisma.message.findMany({
            where: {
                OR: [
                    { senderUserId: currentUserId },
                    { receiverUserId: currentUserId },
                ],
            },
            orderBy: { createdAt: "desc" },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
                receiver: { select: { id: true, name: true, avatar: true } },
            },
        });
        const seen = new Set();
        const unreadByOther = new Map();
        const conversations = [];
        for (const msg of messages) {
            if (msg.receiverUserId === currentUserId && !msg.read) {
                const otherId = msg.senderUserId;
                unreadByOther.set(otherId, (unreadByOther.get(otherId) || 0) + 1);
            }
        }
        for (const msg of messages) {
            const otherId = msg.senderUserId === currentUserId
                ? msg.receiverUserId
                : msg.senderUserId;
            if (seen.has(otherId))
                continue;
            seen.add(otherId);
            const parsed = parseContent(msg.content || "");
            const otherUser = msg.senderUserId === currentUserId ? msg.receiver : msg.sender;
            const preview = parsed.content || (parsed.attachmentUrl ? "[Attachment]" : "");
            conversations.push({
                userId: otherId,
                userName: otherUser?.name || "User",
                userAvatar: otherUser?.avatar || undefined,
                lastMessage: preview,
                hasAttachment: Boolean(parsed.attachmentUrl),
                attachmentType: parsed.attachmentType,
                lastMessageAt: msg.createdAt,
                unreadCount: unreadByOther.get(otherId) || 0,
                bookingId: msg.bookingId || undefined,
            });
        }
        return conversations;
    },
    async markAsRead(currentUserId, messageId) {
        return database_1.prisma.message.updateMany({
            where: {
                id: messageId,
                receiverUserId: currentUserId,
            },
            data: { read: true },
        });
    },
    async getUnreadCount(currentUserId) {
        const count = await database_1.prisma.message.count({
            where: {
                receiverUserId: currentUserId,
                read: false,
            },
        });
        return { unreadCount: count };
    },
};
exports.default = exports.messageService;
