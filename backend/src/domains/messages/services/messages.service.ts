import { prisma } from "../../../config/database";
import { AppError } from "../../../utils";
import { publishEvent } from "../../../utils/eventPublisher";

const ATTACHMENT_PREFIX = "[attachment]";
const ALLOWED_ATTACHMENT_TYPES = new Set(["image", "pdf", "file"]);

const normalizeMessageInput = (
  content: string,
  attachmentUrl?: string,
  attachmentType?: string,
) => {
  const trimmedContent = content.trim();
  const hasAttachmentUrl = Boolean(attachmentUrl?.trim());
  const hasAttachmentType = Boolean(attachmentType?.trim());

  if (!trimmedContent && !hasAttachmentUrl) {
    throw new AppError("Message content or attachment is required", 400);
  }

  if (hasAttachmentUrl !== hasAttachmentType) {
    throw new AppError(
      "attachmentUrl and attachmentType must be provided together",
      400,
    );
  }

  if (hasAttachmentType) {
    const normalizedType = attachmentType!.trim().toLowerCase();
    if (!ALLOWED_ATTACHMENT_TYPES.has(normalizedType)) {
      throw new AppError("Invalid attachment type", 400);
    }
  }

  return {
    content: trimmedContent,
    attachmentUrl: attachmentUrl?.trim(),
    attachmentType: attachmentType?.trim().toLowerCase(),
  };
};

const serializeContent = (
  content: string,
  attachmentUrl?: string,
  attachmentType?: string,
) => {
  if (!attachmentUrl) return content;
  const type = (attachmentType || "file").trim().toLowerCase();
  return `${ATTACHMENT_PREFIX}${type}|${attachmentUrl}\n${content}`.trim();
};

const parseContent = (raw: string) => {
  if (!raw.startsWith(ATTACHMENT_PREFIX)) {
    return {
      content: raw,
      attachmentUrl: undefined as string | undefined,
      attachmentType: undefined as string | undefined,
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

const toApiMessage = (msg: any) => {
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

export const messageService = {
  async sendMessage(
    senderUserId: string,
    receiverUserId: string,
    content: string,
    bookingId?: string,
    attachmentUrl?: string,
    attachmentType?: string,
    escalateToSupport?: boolean,
  ) {
    const normalized = normalizeMessageInput(
      content,
      attachmentUrl,
      attachmentType,
    );

    const normalizedContent = serializeContent(
      normalized.content,
      normalized.attachmentUrl,
      normalized.attachmentType,
    );

    const message = await prisma.message.create({
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

    let escalatedTicketId: string | undefined;
    if (escalateToSupport) {
      const ticket = await prisma.supportTicket.create({
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
      prisma.user.findUnique({
        where: { id: senderUserId },
        select: { id: true, name: true, email: true },
      }),
      prisma.user.findUnique({
        where: { id: receiverUserId },
        select: { id: true, name: true, email: true },
      }),
    ])
      .then(([sender, receiver]) => {
        if (!sender || !receiver) return;
        publishEvent("message.new", {
          messageId: message.id,
          sender,
          receiver,
          content: normalizedContent,
          hasAttachment: Boolean(normalized.attachmentUrl),
          attachmentType: normalized.attachmentType,
          bookingId,
        });
      })
      .catch(() => {});

    return {
      ...toApiMessage(message),
      escalatedTicketId,
    };
  },

  async getThread(currentUserId: string, otherUserId: string) {
    const messages = await prisma.message.findMany({
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

  async getConversations(currentUserId: string) {
    const messages = await prisma.message.findMany({
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

    const seen = new Set<string>();
    const unreadByOther = new Map<string, number>();
    const conversations = [] as any[];

    for (const msg of messages) {
      if (msg.receiverUserId === currentUserId && !msg.read) {
        const otherId = msg.senderUserId;
        unreadByOther.set(otherId, (unreadByOther.get(otherId) || 0) + 1);
      }
    }

    for (const msg of messages) {
      const otherId =
        msg.senderUserId === currentUserId
          ? msg.receiverUserId
          : msg.senderUserId;
      if (seen.has(otherId)) continue;
      seen.add(otherId);

      const parsed = parseContent(msg.content || "");
      const otherUser =
        msg.senderUserId === currentUserId ? msg.receiver : msg.sender;
      const preview =
        parsed.content || (parsed.attachmentUrl ? "[Attachment]" : "");

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

  async markAsRead(currentUserId: string, messageId: string) {
    return prisma.message.updateMany({
      where: {
        id: messageId,
        receiverUserId: currentUserId,
      },
      data: { read: true },
    });
  },

  async getUnreadCount(currentUserId: string) {
    const count = await prisma.message.count({
      where: {
        receiverUserId: currentUserId,
        read: false,
      },
    });

    return { unreadCount: count };
  },
};

export default messageService;
