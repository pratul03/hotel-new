"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistSchemas = exports.acceptInviteSchema = exports.shareSchema = exports.inviteSchema = exports.roomIdSchema = void 0;
const validation_1 = require("../../../utils/validation");
exports.roomIdSchema = validation_1.z.object({
    roomId: validation_1.v.id(),
    listName: validation_1.v.id().max(120).optional(),
});
exports.inviteSchema = validation_1.z.object({
    listName: validation_1.v.id().max(120),
    email: validation_1.v.email(),
    permission: validation_1.z.enum(["viewer", "editor"]).default("viewer"),
});
exports.shareSchema = validation_1.z.object({
    listName: validation_1.v.id().max(120),
});
exports.acceptInviteSchema = validation_1.z.object({
    inviteId: validation_1.v.id(),
});
exports.wishlistSchemas = {
    roomIdSchema: exports.roomIdSchema,
    inviteSchema: exports.inviteSchema,
    shareSchema: exports.shareSchema,
    acceptInviteSchema: exports.acceptInviteSchema,
};
exports.default = exports.wishlistSchemas;
