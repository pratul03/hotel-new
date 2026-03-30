"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistQueries = void 0;
class WishlistQueries {
    static getParam(value) {
        return Array.isArray(value) ? value[0] || "" : value || "";
    }
    static getQueryString(value) {
        if (Array.isArray(value)) {
            return typeof value[0] === "string" ? value[0] : undefined;
        }
        return typeof value === "string" ? value : undefined;
    }
    static userId(req) {
        return req.userId;
    }
    static roomId(req) {
        return this.getParam(req.params.roomId);
    }
    static shareCode(req) {
        return this.getParam(req.params.shareCode);
    }
    static listName(req) {
        return this.getQueryString(req.query.listName);
    }
}
exports.wishlistQueries = WishlistQueries;
exports.default = exports.wishlistQueries;
