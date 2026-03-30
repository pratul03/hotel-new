"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostprofileController = void 0;
const response_1 = require("../../../utils/response");
const host_profile_service_1 = require("../services/host-profile.service");
const host_profile_queries_1 = require("../queries/host-profile.queries");
const host_profile_schema_1 = require("../schemas/host-profile.schema");
exports.hostprofileController = {
    async getProfile(req, res) {
        const profile = await host_profile_service_1.hostProfileService.getProfile(host_profile_queries_1.hostprofileQueries.userId(req));
        res.json((0, response_1.successResponse)(profile, "Host profile retrieved"));
    },
    async createProfile(req, res) {
        const data = host_profile_schema_1.profileSchema.parse(req.body);
        const profile = await host_profile_service_1.hostProfileService.createProfile(host_profile_queries_1.hostprofileQueries.userId(req), data);
        res.status(201).json((0, response_1.successResponse)(profile, "Host profile created"));
    },
    async updateProfile(req, res) {
        const data = host_profile_schema_1.updateProfileSchema.parse(req.body);
        const profile = await host_profile_service_1.hostProfileService.updateProfile(host_profile_queries_1.hostprofileQueries.userId(req), data);
        res.json((0, response_1.successResponse)(profile, "Host profile updated"));
    },
};
exports.default = exports.hostprofileController;
