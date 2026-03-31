"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountTypeResolvers = void 0;
const helpers_1 = require("../../helpers");
exports.accountTypeResolvers = {
    SessionRecord: {
        createdAt: (record) => (0, helpers_1.toIsoString)(record.createdAt),
        lastSeenAt: (record) => (0, helpers_1.toIsoString)(record.lastSeenAt),
    },
    UserDocument: {
        createdAt: (doc) => (0, helpers_1.toIsoString)(doc.createdAt),
    },
    HostVerification: {
        approvedAt: (item) => (0, helpers_1.toIsoString)(item.approvedAt),
        createdAt: (item) => (0, helpers_1.toIsoString)(item.createdAt),
        updatedAt: (item) => (0, helpers_1.toIsoString)(item.updatedAt),
    },
    IdentityDocument: {
        createdAt: (doc) => (0, helpers_1.toIsoString)(doc.createdAt),
    },
};
