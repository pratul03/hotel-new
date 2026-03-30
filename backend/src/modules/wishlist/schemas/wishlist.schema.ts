import { z, v } from "../../../utils/validation";

export const roomIdSchema = z.object({
  roomId: v.id(),
  listName: v.id().max(120).optional(),
});

export const inviteSchema = z.object({
  listName: v.id().max(120),
  email: v.email(),
  permission: z.enum(["viewer", "editor"]).default("viewer"),
});

export const shareSchema = z.object({
  listName: v.id().max(120),
});

export const acceptInviteSchema = z.object({
  inviteId: v.id(),
});

export const wishlistSchemas = {
  roomIdSchema,
  inviteSchema,
  shareSchema,
  acceptInviteSchema,
};

export default wishlistSchemas;
