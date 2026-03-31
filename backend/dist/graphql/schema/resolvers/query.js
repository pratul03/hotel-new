"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryResolvers = void 0;
const core_1 = require("./query/core");
const account_1 = require("./query/account");
const wishlist_1 = require("./query/wishlist");
const supportReports_1 = require("./query/supportReports");
const host_1 = require("./query/host");
const commerce_1 = require("./query/commerce");
const reviews_1 = require("./query/reviews");
exports.queryResolvers = {
    ...core_1.coreQueryResolvers,
    ...account_1.accountQueryResolvers,
    ...wishlist_1.wishlistQueryResolvers,
    ...supportReports_1.supportReportsQueryResolvers,
    ...host_1.hostQueryResolvers,
    ...commerce_1.commerceQueryResolvers,
    ...reviews_1.reviewQueryResolvers,
};
