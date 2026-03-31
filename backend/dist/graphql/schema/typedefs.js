"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphQLTypeDefs = void 0;
const core_1 = require("./typedefs/core");
const account_1 = require("./typedefs/account");
const wishlist_1 = require("./typedefs/wishlist");
const supportReports_1 = require("./typedefs/supportReports");
const host_1 = require("./typedefs/host");
const commerce_1 = require("./typedefs/commerce");
const operations_1 = require("./typedefs/operations");
exports.graphQLTypeDefs = [
    core_1.coreTypeDefs,
    account_1.accountTypeDefs,
    wishlist_1.wishlistTypeDefs,
    supportReports_1.supportReportsTypeDefs,
    host_1.hostTypeDefs,
    commerce_1.commerceTypeDefs,
    operations_1.operationsTypeDefs,
].join("\n");
