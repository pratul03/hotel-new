"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutationResolvers = void 0;
const core_1 = require("./mutation/core");
const account_1 = require("./mutation/account");
const wishlist_1 = require("./mutation/wishlist");
const supportReports_1 = require("./mutation/supportReports");
const host_1 = require("./mutation/host");
const commerce_1 = require("./mutation/commerce");
const reviews_1 = require("./mutation/reviews");
exports.mutationResolvers = {
    ...core_1.coreMutationResolvers,
    ...account_1.accountMutationResolvers,
    ...wishlist_1.wishlistMutationResolvers,
    ...supportReports_1.supportReportsMutationResolvers,
    ...host_1.hostMutationResolvers,
    ...commerce_1.commerceMutationResolvers,
    ...reviews_1.reviewMutationResolvers,
};
