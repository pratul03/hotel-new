"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsController = void 0;
const utils_1 = require("../../../utils");
const reports_queries_1 = require("../queries/reports.queries");
const reports_schema_1 = require("../schemas/reports.schema");
const reports_service_1 = require("../services/reports.service");
exports.reportsController = {
    async reportIncident(req, res) {
        const payload = reports_schema_1.createSchema.parse(req.body);
        const data = await reports_service_1.reportService.reportIncident(reports_queries_1.reportsQueries.userId(req), payload.bookingId, payload.description);
        res.status(201).json((0, utils_1.successResponse)(data, "Incident reported"));
    },
    async listIncidents(req, res) {
        const payload = reports_schema_1.listSchema.parse(req.query);
        const data = await reports_service_1.reportService.listIncidents(reports_queries_1.reportsQueries.userId(req), payload);
        res.json((0, utils_1.successResponse)(data, "Incidents fetched"));
    },
    async airCoverBoard(req, res) {
        const data = await reports_service_1.reportService.getAirCoverBoard(reports_queries_1.reportsQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "AirCover board fetched"));
    },
    async createOffPlatformFee(req, res) {
        const payload = reports_schema_1.offPlatformFeeSchema.parse(req.body);
        const data = await reports_service_1.reportService.createOffPlatformFeeCase(reports_queries_1.reportsQueries.userId(req), payload);
        res
            .status(201)
            .json((0, utils_1.successResponse)(data, "Off-platform fee case created"));
    },
    async listOffPlatformFee(req, res) {
        const data = await reports_service_1.reportService.listOffPlatformFeeCases(reports_queries_1.reportsQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Off-platform fee cases fetched"));
    },
    async getIncident(req, res) {
        const data = await reports_service_1.reportService.getIncident(reports_queries_1.reportsQueries.userId(req), reports_queries_1.reportsQueries.id(req));
        res.json((0, utils_1.successResponse)(data, "Incident fetched"));
    },
    async updateIncidentStatus(req, res) {
        const payload = reports_schema_1.statusSchema.parse(req.body);
        const data = await reports_service_1.reportService.updateIncidentStatus(reports_queries_1.reportsQueries.userId(req), reports_queries_1.reportsQueries.id(req), payload.status, payload.resolution);
        res.json((0, utils_1.successResponse)(data, "Incident status updated"));
    },
    async resolveIncident(req, res) {
        const payload = reports_schema_1.resolveSchema.parse(req.body);
        const data = await reports_service_1.reportService.resolveIncident(reports_queries_1.reportsQueries.userId(req), reports_queries_1.reportsQueries.id(req), payload.resolution);
        res.json((0, utils_1.successResponse)(data, "Incident resolved"));
    },
};
exports.default = exports.reportsController;
