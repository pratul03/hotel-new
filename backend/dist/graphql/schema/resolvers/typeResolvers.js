"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeResolvers = void 0;
const account_1 = require("./type/account");
const commerce_1 = require("./type/commerce");
const core_1 = require("./type/core");
const host_1 = require("./type/host");
const supportReports_1 = require("./type/supportReports");
const wishlist_1 = require("./type/wishlist");
exports.typeResolvers = {
    ...core_1.coreTypeResolvers,
    ...account_1.accountTypeResolvers,
    ...wishlist_1.wishlistTypeResolvers,
    ...supportReports_1.supportReportsTypeResolvers,
    ...host_1.hostTypeResolvers,
    ...commerce_1.commerceTypeResolvers,
};
