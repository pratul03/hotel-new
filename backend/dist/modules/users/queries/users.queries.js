"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersQueries = void 0;
class UsersQueries {
    static getParam(value) {
        return Array.isArray(value) ? value[0] || "" : value || "";
    }
    static userId(req) {
        return this.getParam(req.params.id);
    }
    static docId(req) {
        return this.getParam(req.params.docId);
    }
}
exports.usersQueries = UsersQueries;
exports.default = exports.usersQueries;
