"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersController = void 0;
const utils_1 = require("../../../utils");
const users_queries_1 = require("../queries/users.queries");
const users_schema_1 = require("../schemas/users.schema");
const users_service_1 = require("../services/users.service");
exports.usersController = {
    async getProfile(req, res) {
        const profile = await users_service_1.userService.getProfile(users_queries_1.usersQueries.userId(req));
        res.json((0, utils_1.successResponse)(profile, "Profile fetched"));
    },
    async updateProfile(req, res) {
        const data = users_schema_1.updateProfileSchema.parse(req.body);
        const profile = await users_service_1.userService.updateProfile(users_queries_1.usersQueries.userId(req), data);
        res.json((0, utils_1.successResponse)(profile, "Profile updated"));
    },
    async addDocument(req, res) {
        const { documentType, docUrl } = users_schema_1.addDocumentSchema.parse(req.body);
        const doc = await users_service_1.userService.addDocument(users_queries_1.usersQueries.userId(req), documentType, docUrl);
        res.status(201).json((0, utils_1.successResponse)(doc, "Document added"));
    },
    async listDocuments(req, res) {
        const docs = await users_service_1.userService.listDocuments(users_queries_1.usersQueries.userId(req));
        res.json((0, utils_1.successResponse)(docs, "Documents fetched"));
    },
    async deleteDocument(req, res) {
        const result = await users_service_1.userService.deleteDocument(users_queries_1.usersQueries.userId(req), users_queries_1.usersQueries.docId(req));
        res.json((0, utils_1.successResponse)(result, "Document deleted"));
    },
    async hostVerification(req, res) {
        const data = await users_service_1.userService.getHostVerification(users_queries_1.usersQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Host verification fetched"));
    },
    async identityVerification(req, res) {
        const data = await users_service_1.userService.getIdentityVerification(users_queries_1.usersQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Identity verification fetched"));
    },
    async loyalty(req, res) {
        const data = await users_service_1.userService.getLoyaltySummary(users_queries_1.usersQueries.userId(req));
        res.json((0, utils_1.successResponse)(data, "Loyalty summary fetched"));
    },
};
exports.default = exports.usersController;
