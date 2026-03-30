"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hosttoolsQueries = void 0;
const host_tools_schema_1 = require("../schemas/host-tools.schema");
class HostToolsQueries {
    static getParam(value) {
        return Array.isArray(value) ? value[0] || "" : value || "";
    }
    static hotelId(req) {
        return this.getParam(req.params.hotelId);
    }
    static id(req) {
        return this.getParam(req.params.id);
    }
    static assignmentId(req) {
        return this.getParam(req.params.assignmentId);
    }
    static analytics(req) {
        return host_tools_schema_1.analyticsQuerySchema.parse(req.query);
    }
    static auditExport(req) {
        return host_tools_schema_1.auditExportQuerySchema.parse(req.query);
    }
}
exports.hosttoolsQueries = HostToolsQueries;
exports.default = exports.hosttoolsQueries;
