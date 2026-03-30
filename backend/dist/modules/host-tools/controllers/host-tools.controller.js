"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hosttoolsController = void 0;
const utils_1 = require("../../../utils");
const host_tools_queries_1 = require("../queries/host-tools.queries");
const host_tools_schema_1 = require("../schemas/host-tools.schema");
const host_tools_service_1 = require("../services/host-tools.service");
class HostToolsController {
    async getCancellationPolicy(req, res) {
        const data = await host_tools_service_1.hostToolsService.getCancellationPolicy(host_tools_queries_1.hosttoolsQueries.hotelId(req), req.userId);
        res.json((0, utils_1.successResponse)(data, "Cancellation policy retrieved"));
    }
    async upsertCancellationPolicy(req, res) {
        const payload = host_tools_schema_1.cancellationSchema.parse(req.body);
        const data = await host_tools_service_1.hostToolsService.upsertCancellationPolicy(host_tools_queries_1.hosttoolsQueries.hotelId(req), req.userId, payload);
        res.json((0, utils_1.successResponse)(data, "Cancellation policy updated"));
    }
    async listQuickReplies(req, res) {
        const data = await host_tools_service_1.hostToolsService.listQuickReplies(req.userId);
        res.json((0, utils_1.successResponse)(data, "Quick replies retrieved"));
    }
    async createQuickReply(req, res) {
        const payload = host_tools_schema_1.quickReplySchema.parse(req.body);
        const data = await host_tools_service_1.hostToolsService.createQuickReply(req.userId, payload);
        res.status(201).json((0, utils_1.successResponse)(data, "Quick reply created"));
    }
    async deleteQuickReply(req, res) {
        const data = await host_tools_service_1.hostToolsService.deleteQuickReply(req.userId, host_tools_queries_1.hosttoolsQueries.id(req));
        res.json((0, utils_1.successResponse)(data, "Quick reply deleted"));
    }
    async listScheduledMessages(req, res) {
        const data = await host_tools_service_1.hostToolsService.listScheduledMessages(req.userId);
        res.json((0, utils_1.successResponse)(data, "Scheduled messages retrieved"));
    }
    async createScheduledMessage(req, res) {
        const payload = host_tools_schema_1.scheduledMessageSchema.parse(req.body);
        const data = await host_tools_service_1.hostToolsService.createScheduledMessage(req.userId, {
            ...payload,
            sendAt: new Date(payload.sendAt),
        });
        res.status(201).json((0, utils_1.successResponse)(data, "Scheduled message created"));
    }
    async cancelScheduledMessage(req, res) {
        const data = await host_tools_service_1.hostToolsService.cancelScheduledMessage(req.userId, host_tools_queries_1.hosttoolsQueries.id(req));
        res.json((0, utils_1.successResponse)(data, "Scheduled message cancelled"));
    }
    async getAnalytics(req, res) {
        const payload = host_tools_queries_1.hosttoolsQueries.analytics(req);
        const data = await host_tools_service_1.hostToolsService.getAnalytics(req.userId, payload.days);
        res.json((0, utils_1.successResponse)(data, "Host analytics retrieved"));
    }
    async listCoHosts(req, res) {
        const data = await host_tools_service_1.hostToolsService.listCoHosts(host_tools_queries_1.hosttoolsQueries.hotelId(req), req.userId);
        res.json((0, utils_1.successResponse)(data, "Co-hosts retrieved"));
    }
    async addCoHost(req, res) {
        const payload = host_tools_schema_1.addCohostSchema.parse(req.body);
        const data = await host_tools_service_1.hostToolsService.addCoHost(host_tools_queries_1.hosttoolsQueries.hotelId(req), req.userId, payload);
        res.status(201).json((0, utils_1.successResponse)(data, "Co-host assigned"));
    }
    async removeCoHost(req, res) {
        const data = await host_tools_service_1.hostToolsService.removeCoHost(host_tools_queries_1.hosttoolsQueries.hotelId(req), req.userId, host_tools_queries_1.hosttoolsQueries.assignmentId(req));
        res.json((0, utils_1.successResponse)(data, "Co-host removed"));
    }
    async getComplianceChecklist(req, res) {
        const data = await host_tools_service_1.hostToolsService.getComplianceChecklist(host_tools_queries_1.hosttoolsQueries.hotelId(req), req.userId);
        res.json((0, utils_1.successResponse)(data, "Compliance checklist retrieved"));
    }
    async getListingQuality(req, res) {
        const data = await host_tools_service_1.hostToolsService.getListingQuality(host_tools_queries_1.hosttoolsQueries.hotelId(req), req.userId);
        res.json((0, utils_1.successResponse)(data, "Listing quality retrieved"));
    }
    async upsertListingQuality(req, res) {
        const payload = host_tools_schema_1.listingQualitySchema.parse(req.body);
        const data = await host_tools_service_1.hostToolsService.upsertListingQuality(host_tools_queries_1.hosttoolsQueries.hotelId(req), req.userId, payload);
        res.json((0, utils_1.successResponse)(data, "Listing quality updated"));
    }
    async upsertComplianceChecklist(req, res) {
        const payload = host_tools_schema_1.complianceSchema.parse(req.body);
        const data = await host_tools_service_1.hostToolsService.upsertComplianceChecklist(host_tools_queries_1.hosttoolsQueries.hotelId(req), req.userId, payload);
        res.json((0, utils_1.successResponse)(data, "Compliance checklist updated"));
    }
    async listClaims(req, res) {
        const data = await host_tools_service_1.hostToolsService.listClaims(req.userId);
        res.json((0, utils_1.successResponse)(data, "Claims retrieved"));
    }
    async createClaim(req, res) {
        const payload = host_tools_schema_1.claimSchema.parse(req.body);
        const data = await host_tools_service_1.hostToolsService.createClaim(req.userId, payload);
        res.status(201).json((0, utils_1.successResponse)(data, "Claim created"));
    }
    async adjudicateClaim(req, res) {
        const payload = host_tools_schema_1.adjudicateClaimSchema.parse(req.body);
        const data = await host_tools_service_1.hostToolsService.adjudicateClaim(req.userId, host_tools_queries_1.hosttoolsQueries.id(req), payload);
        res.json((0, utils_1.successResponse)(data, "Claim adjudicated"));
    }
    async exportComplianceAudit(req, res) {
        const payload = host_tools_queries_1.hosttoolsQueries.auditExport(req);
        const data = await host_tools_service_1.hostToolsService.exportComplianceAudit(req.userId, payload.days);
        res.json((0, utils_1.successResponse)(data, "Compliance audit export generated"));
    }
}
exports.hosttoolsController = new HostToolsController();
exports.default = exports.hosttoolsController;
